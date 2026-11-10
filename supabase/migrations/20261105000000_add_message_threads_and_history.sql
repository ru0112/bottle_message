alter table public.messages
  add column recipient_id uuid,
  add constraint messages_recipient_is_not_author
    check (recipient_id is null or recipient_id <> user_id);

drop policy if exists "Authenticated users can read messages" on public.messages;

create policy "Participants can read messages"
  on public.messages
  for select
  to authenticated
  using (
    user_id = (select auth.uid())
    or recipient_id = (select auth.uid())
  );

create table public.message_replies (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.messages(id) on delete cascade,
  user_id uuid not null,
  content text not null check (btrim(content) <> ''),
  created_at timestamptz not null default now()
);

create index message_replies_message_id_created_at_idx
  on public.message_replies (message_id, created_at, id);

alter table public.message_replies enable row level security;

create policy "Participants can read message replies"
  on public.message_replies
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.messages as message
      where message.id = message_id
        and (
          message.user_id = (select auth.uid())
          or message.recipient_id = (select auth.uid())
        )
    )
  );

revoke all on table public.message_replies from public, anon, authenticated;

drop function if exists public.get_random_message(uuid[]);

create function public.get_random_message(p_excluded_ids uuid[])
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
  with candidate as materialized (
    select message.id
    from public.messages as message
    where (select auth.uid()) is not null
      and message.user_id <> (select auth.uid())
      and message.recipient_id is null
      and not (
        message.id = any(coalesce(p_excluded_ids, array[]::uuid[]))
      )
    order by random()
    limit 1
    for update skip locked
  ),
  claimed as (
    update public.messages as message
    set recipient_id = (select auth.uid())
    from candidate
    where message.id = candidate.id
      and message.recipient_id is null
    returning message.id, message.content, message.created_at
  )
  select claimed.id, claimed.content, claimed.created_at
  from claimed;
$$;

revoke all on function public.get_random_message(uuid[]) from public, anon, authenticated;
grant execute on function public.get_random_message(uuid[]) to authenticated;

create function public.create_message_reply(
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

  if parent_message.user_id is distinct from current_user_id
    and parent_message.recipient_id is distinct from current_user_id
  then
    raise exception using
      errcode = '42501',
      message = 'このスレッドには返信できません。';
  end if;

  select count(*)::integer
  into reply_count
  from public.message_replies as reply
  where reply.message_id = p_message_id;

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

create function public.get_message_thread(p_message_id uuid)
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
    )
  order by coalesce(reply.created_at, message.created_at), reply.id;
$$;

revoke all on function public.get_message_thread(uuid) from public, anon, authenticated;
grant execute on function public.get_message_thread(uuid) to authenticated;

create function public.get_message_history(p_direction text)
returns table (
  message_id uuid,
  content text,
  created_at timestamptz,
  updated_at timestamptz,
  reply_count integer,
  latest_content text,
  status text
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    raise exception using
      errcode = '42501',
      message = 'ログインが必要です。';
  end if;

  if p_direction not in ('sent', 'received') then
    raise exception using
      errcode = '22023',
      message = '履歴の種類が不正です。';
  end if;

  return query
  with threads as (
    select
      message.id as thread_message_id,
      message.content as thread_content,
      message.created_at as thread_created_at,
      coalesce(last_reply.created_at, message.created_at) as thread_updated_at,
      replies.reply_count,
      coalesce(last_reply.content, message.content) as thread_latest_content,
      coalesce(last_reply.user_id, message.user_id) as last_speaker_id
    from public.messages as message
    cross join lateral (
      select count(*)::integer as reply_count
      from public.message_replies as reply
      where reply.message_id = message.id
    ) as replies
    left join lateral (
      select reply.user_id, reply.content, reply.created_at
      from public.message_replies as reply
      where reply.message_id = message.id
      order by reply.created_at desc, reply.id desc
      limit 1
    ) as last_reply on true
    where case p_direction
      when 'sent' then message.user_id = (select auth.uid())
      when 'received' then message.recipient_id = (select auth.uid())
    end
  )
  select
    threads.thread_message_id,
    threads.thread_content,
    threads.thread_created_at,
    threads.thread_updated_at,
    threads.reply_count,
    threads.thread_latest_content,
    case
      when threads.reply_count >= 3 then 'ended'
      when threads.last_speaker_id = (select auth.uid()) then 'waiting'
      else 'reply_received'
    end
  from threads
  order by threads.thread_updated_at desc, threads.thread_message_id;
end;
$$;

revoke all on function public.get_message_history(text) from public, anon, authenticated;
grant execute on function public.get_message_history(text) to authenticated;
