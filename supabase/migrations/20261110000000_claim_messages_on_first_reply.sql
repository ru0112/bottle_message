update public.messages as message
set recipient_id = (
  select reply.user_id
  from public.message_replies as reply
  where reply.message_id = message.id
  order by reply.created_at, reply.id
  limit 1
)
where exists (
  select 1
  from public.message_replies as reply
  where reply.message_id = message.id
);

update public.messages as message
set recipient_id = null
where not exists (
  select 1
  from public.message_replies as reply
  where reply.message_id = message.id
);

create or replace function public.get_random_message(p_excluded_ids uuid[])
returns table (
  id uuid,
  content text,
  created_at timestamptz
)
language sql
volatile
security definer
set search_path = ''
as $$
  select message.id, message.content, message.created_at
  from public.messages as message
  where (select auth.uid()) is not null
    and message.user_id <> (select auth.uid())
    and message.recipient_id is null
    and not (
      message.id = any(coalesce(p_excluded_ids, array[]::uuid[]))
    )
    and not exists (
      select 1
      from public.message_replies as reply
      where reply.message_id = message.id
    )
  order by random()
  limit 1;
$$;

revoke all on function public.get_random_message(uuid[]) from public, anon, authenticated;
grant execute on function public.get_random_message(uuid[]) to authenticated;

create or replace function public.create_message_reply(
  p_message_id uuid,
  p_content text
)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  parent_message public.messages%rowtype;
  reply_count integer;
  last_speaker_id uuid;
begin
  if current_user_id is null then
    raise exception using
      errcode = '42501',
      message = 'ログインが必要です。';
  end if;

  if p_content is null or btrim(p_content) = '' then
    raise exception using
      errcode = '22023',
      message = '返信を入力してください。';
  end if;

  select message.*
  into parent_message
  from public.messages as message
  where message.id = p_message_id
  for update;

  if not found then
    raise exception using
      errcode = '42501',
      message = 'このスレッドには返信できません。';
  end if;

  select count(*)::integer
  into reply_count
  from public.message_replies as reply
  where reply.message_id = p_message_id;

  if reply_count = 0 then
    if parent_message.user_id <> current_user_id then
      if parent_message.recipient_id is not null
        and parent_message.recipient_id <> current_user_id
      then
        raise exception using
          errcode = '22023',
          message = 'このメッセージは既に他のユーザーとやり取りが始まりました';
      end if;

      update public.messages as message
      set recipient_id = current_user_id
      where message.id = p_message_id
        and message.recipient_id is null;

      if not found
        and parent_message.recipient_id is distinct from current_user_id
      then
        raise exception using
          errcode = '22023',
          message = 'このメッセージは既に他のユーザーとやり取りが始まりました';
      end if;

      parent_message.recipient_id := current_user_id;
    end if;
  elsif parent_message.user_id is distinct from current_user_id
    and parent_message.recipient_id is distinct from current_user_id
  then
    raise exception using
      errcode = '22023',
      message = 'このメッセージは既に他のユーザーとやり取りが始まりました';
  end if;

  if reply_count >= 3 then
    raise exception using
      errcode = '22023',
      message = 'このスレッドのやり取りは終了しています。';
  end if;

  select reply.user_id
  into last_speaker_id
  from public.message_replies as reply
  where reply.message_id = p_message_id
  order by reply.created_at desc, reply.id desc
  limit 1;

  if not found then
    last_speaker_id := parent_message.user_id;
  end if;

  if last_speaker_id = current_user_id then
    raise exception using
      errcode = '22023',
      message = '相手の返信を待ってから送信してください。';
  end if;

  insert into public.message_replies (message_id, user_id, content)
  values (p_message_id, current_user_id, btrim(p_content));
end;
$$;

revoke all on function public.create_message_reply(uuid, text) from public, anon, authenticated;
grant execute on function public.create_message_reply(uuid, text) to authenticated;

create or replace function public.get_message_thread(p_message_id uuid)
returns table (
  message_id uuid,
  entry_id uuid,
  content text,
  created_at timestamptz,
  speaker text
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    message.id as message_id,
    reply.id as entry_id,
    coalesce(reply.content, message.content) as content,
    coalesce(reply.created_at, message.created_at) as created_at,
    case
      when coalesce(reply.user_id, message.user_id) = (select auth.uid())
        then 'you'
      else 'other'
    end as speaker
  from public.messages as message
  left join public.message_replies as reply
    on reply.message_id = message.id
  where message.id = p_message_id
    and (select auth.uid()) is not null
    and (
      message.user_id = (select auth.uid())
      or message.recipient_id = (select auth.uid())
      or (
        message.recipient_id is null
        and not exists (
          select 1
          from public.message_replies as existing_reply
          where existing_reply.message_id = message.id
        )
      )
    )
  order by coalesce(reply.created_at, message.created_at), reply.id;
$$;

revoke all on function public.get_message_thread(uuid) from public, anon, authenticated;
grant execute on function public.get_message_thread(uuid) to authenticated;
