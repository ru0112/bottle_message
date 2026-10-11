create table public.messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  content text not null check (btrim(content) <> ''),
  created_at timestamptz not null default now()
);

alter table public.messages enable row level security;

grant select, insert on public.messages to anon;

create policy "Anonymous users can read messages"
  on public.messages
  for select
  to anon
  using (true);

create policy "Anonymous users can post messages"
  on public.messages
  for insert
  to anon
  with check (btrim(content) <> '');

create or replace function public.get_random_message(p_user_id uuid)
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
  order by random()
  limit 1;
$$;

revoke execute on function public.get_random_message(uuid) from public;
grant execute on function public.get_random_message(uuid) to anon;
