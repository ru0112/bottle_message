create or replace function public.get_random_message(
  p_user_id uuid,
  p_excluded_ids uuid[]
)
returns table (
  id uuid,
  content text,
  created_at timestamptz
)
language sql
volatile
set search_path = public
as $$
  select message.id, message.content, message.created_at
  from public.messages as message
  where message.user_id <> p_user_id
    and not (
      message.id = any(coalesce(p_excluded_ids, '{}'::uuid[]))
    )
  order by random()
  limit 1;
$$;

revoke execute on function public.get_random_message(uuid, uuid[]) from public;
grant execute on function public.get_random_message(uuid, uuid[]) to anon;
