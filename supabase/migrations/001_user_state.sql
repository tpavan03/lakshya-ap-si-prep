-- Run this in the Supabase SQL editor for the Lakshya project.
create table if not exists public.user_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  payload jsonb not null default '{}'::jsonb,
  schema_version integer not null default 1,
  updated_at timestamptz not null default now()
);

alter table public.user_state enable row level security;

drop policy if exists "Users read their own preparation state" on public.user_state;
create policy "Users read their own preparation state"
on public.user_state for select
using (auth.uid() = user_id);

drop policy if exists "Users insert their own preparation state" on public.user_state;
create policy "Users insert their own preparation state"
on public.user_state for insert
with check (auth.uid() = user_id);

drop policy if exists "Users update their own preparation state" on public.user_state;
create policy "Users update their own preparation state"
on public.user_state for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create or replace function public.touch_user_state_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists user_state_set_updated_at on public.user_state;
create trigger user_state_set_updated_at
before update on public.user_state
for each row execute function public.touch_user_state_updated_at();
