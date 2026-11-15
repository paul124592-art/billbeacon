-- BillBeacon schema — run this in the Supabase SQL editor (Dashboard → SQL Editor → New query).
-- It creates the tables, enables Row Level Security, and adds policies so each
-- user can only read and write their own rows.

-- Profiles: one row per user, holds the Premium flag and reminder preference.
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  is_premium boolean not null default false,
  reminder_days int not null default 3,
  created_at timestamptz not null default now()
);

-- Bills: every bill or subscription a user tracks.
create table if not exists public.bills (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  amount numeric(12, 2) not null,
  currency text not null default 'USD',
  cycle text not null default 'monthly'
    check (cycle in ('weekly', 'monthly', 'quarterly', 'yearly')),
  interval_count int not null default 1,
  next_due_date date not null,
  category text not null default 'other',
  payment_method text,
  notes text,
  url text,
  color text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Payments: history of every "mark as paid".
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  bill_id uuid not null references public.bills (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  amount numeric(12, 2) not null,
  paid_date date not null default current_date,
  due_date date,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.bills enable row level security;
alter table public.payments enable row level security;

-- Profiles: users read/update their own row; insert their own row on signup.
create policy "Users can read their own profile"
  on public.profiles for select using (auth.uid() = id);
create policy "Users can insert their own profile"
  on public.profiles for insert with check (auth.uid() = id);
create policy "Users can update their own profile"
  on public.profiles for update using (auth.uid() = id);

-- Bills: full access to your own bills only.
create policy "Users can read their own bills"
  on public.bills for select using (auth.uid() = user_id);
create policy "Users can insert their own bills"
  on public.bills for insert with check (auth.uid() = user_id);
create policy "Users can update their own bills"
  on public.bills for update using (auth.uid() = user_id);
create policy "Users can delete their own bills"
  on public.bills for delete using (auth.uid() = user_id);

-- Payments: full access to your own payment history only.
create policy "Users can read their own payments"
  on public.payments for select using (auth.uid() = user_id);
create policy "Users can insert their own payments"
  on public.payments for insert with check (auth.uid() = user_id);
create policy "Users can delete their own payments"
  on public.payments for delete using (auth.uid() = user_id);
