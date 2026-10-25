drop policy if exists "Anonymous users can read messages" on public.messages;
drop policy if exists "Anonymous users can post messages" on public.messages;

revoke all on table public.messages from public, anon, authenticated;
grant select (id, content, created_at) on table public.messages to authenticated;
grant insert (content, user_id) on table public.messages to authenticated;

create policy "Authenticated users can read messages"
  on public.messages
  for select
  to authenticated
  using ((select auth.uid()) is not null);

create policy "Authenticated users can post messages"
  on public.messages
  for insert
  to authenticated
  with check (user_id = (select auth.uid()));

drop function if exists public.get_random_message(uuid);
drop function if exists public.get_random_message(uuid, uuid[]);

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
  select message.id, message.content, message.created_at
  from public.messages as message
  where (select auth.uid()) is not null
    and message.user_id <> (select auth.uid())
    and not (
      message.id = any(coalesce(p_excluded_ids, array[]::uuid[]))
    )
  order by random()
  limit 1;
$$;

revoke all on function public.get_random_message(uuid[]) from public, anon, authenticated;
grant execute on function public.get_random_message(uuid[]) to authenticated;
