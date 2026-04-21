-- TariroClinincs Supabase schema
-- Run this in Supabase SQL editor.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null check (role in ('officer', 'admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.transactions (
  transaction_id text primary key,
  customer_id text not null,
  service text not null,
  amount numeric(12,2) not null check (amount >= 0),
  payment_method text not null check (payment_method in ('EcoCash', 'Card', 'Cash')),
  provider_reference text,
  created_by uuid not null references auth.users(id),
  timestamp timestamptz not null default now()
);

create index if not exists idx_transactions_timestamp on public.transactions (timestamp);
create index if not exists idx_transactions_created_by on public.transactions (created_by);

alter table public.profiles enable row level security;
alter table public.transactions enable row level security;

create policy "profile self read"
  on public.profiles
  for select
  to authenticated
  using (auth.uid() = id);

create policy "profile self update"
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "officer or admin can insert transaction"
  on public.transactions
  for insert
  to authenticated
  with check (
    created_by = auth.uid()
    and exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
      and p.role in ('officer', 'admin')
    )
  );

create policy "officer sees own transactions"
  on public.transactions
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
      and (
        p.role = 'admin'
        or created_by = auth.uid()
      )
    )
  );

-- Helper function to set user role manually from SQL editor.
create or replace function public.set_user_role(user_email text, app_role text)
returns void
language plpgsql
security definer
as $$
declare
  target_user_id uuid;
begin
  if app_role not in ('officer', 'admin') then
    raise exception 'Invalid role: %', app_role;
  end if;

  select id into target_user_id
  from auth.users
  where email = user_email;

  if target_user_id is null then
    raise exception 'User not found: %', user_email;
  end if;

  insert into public.profiles (id, role)
  values (target_user_id, app_role)
  on conflict (id)
  do update set role = excluded.role;
end;
$$;
