create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  role text not null default 'Sales Executive',
  created_at timestamptz not null default now(),
  constraint profiles_role_check check (role in ('CEO', 'Manager', 'Sales Executive', 'Logistics Officer'))
);

create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    new.email,
    'Sales Executive'
  )
  on conflict (id) do update
  set
    full_name = excluded.full_name,
    email = excluded.email;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create table if not exists vehicles (
  id text primary key,
  brand text not null,
  model text not null,
  category text not null,
  quantity integer not null default 0,
  purchase_price numeric(12, 2) not null default 0,
  selling_price numeric(12, 2) not null default 0,
  status text not null default 'Available',
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists customers (
  id text primary key,
  name text not null,
  phone text,
  email text,
  location text,
  notes text,
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists orders (
  id text primary key,
  customer_name text not null,
  vehicle text not null,
  quantity integer not null default 1,
  order_date date not null default current_date,
  purchase_cost numeric(12, 2) not null default 0,
  selling_price numeric(12, 2) not null default 0,
  status text not null default 'Inquiry',
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table vehicles add column if not exists created_by uuid default auth.uid() references auth.users(id) on delete set null;
alter table customers add column if not exists created_by uuid default auth.uid() references auth.users(id) on delete set null;
alter table orders add column if not exists created_by uuid default auth.uid() references auth.users(id) on delete set null;

alter table profiles enable row level security;
alter table vehicles enable row level security;
alter table customers enable row level security;
alter table orders enable row level security;

drop policy if exists "Users can read own profile and CEO can read all" on profiles;
drop policy if exists "CEO can update profiles" on profiles;

create policy "Users can read own profile and CEO can read all"
on profiles for select
to authenticated
using (id = auth.uid() or public.current_user_role() = 'CEO');

create policy "CEO can update profiles"
on profiles for update
to authenticated
using (public.current_user_role() = 'CEO')
with check (public.current_user_role() = 'CEO');

drop policy if exists "Allow anon read vehicles" on vehicles;
drop policy if exists "Allow anon insert vehicles" on vehicles;
drop policy if exists "Allow anon update vehicles" on vehicles;
drop policy if exists "Allow anon delete vehicles" on vehicles;
drop policy if exists "Users can read own vehicles" on vehicles;
drop policy if exists "Users can insert own vehicles" on vehicles;
drop policy if exists "Users can update own vehicles" on vehicles;
drop policy if exists "Users can delete own vehicles" on vehicles;
drop policy if exists "Staff can view inventory" on vehicles;
drop policy if exists "Managers can insert inventory" on vehicles;
drop policy if exists "Managers can update inventory" on vehicles;
drop policy if exists "Managers can delete inventory" on vehicles;

create policy "Staff can view inventory"
on vehicles for select
to authenticated
using (public.current_user_role() in ('CEO', 'Manager', 'Sales Executive'));

create policy "Managers can insert inventory"
on vehicles for insert
to authenticated
with check (public.current_user_role() in ('CEO', 'Manager'));

create policy "Managers can update inventory"
on vehicles for update
to authenticated
using (public.current_user_role() in ('CEO', 'Manager'))
with check (public.current_user_role() in ('CEO', 'Manager'));

create policy "Managers can delete inventory"
on vehicles for delete
to authenticated
using (public.current_user_role() in ('CEO', 'Manager'));

drop policy if exists "Allow anon read customers" on customers;
drop policy if exists "Allow anon insert customers" on customers;
drop policy if exists "Allow anon update customers" on customers;
drop policy if exists "Allow anon delete customers" on customers;
drop policy if exists "Users can read own customers" on customers;
drop policy if exists "Users can insert own customers" on customers;
drop policy if exists "Users can update own customers" on customers;
drop policy if exists "Users can delete own customers" on customers;
drop policy if exists "Sales staff can view customers" on customers;
drop policy if exists "Sales staff can insert customers" on customers;
drop policy if exists "Sales staff can update customers" on customers;
drop policy if exists "Managers can delete customers" on customers;

create policy "Sales staff can view customers"
on customers for select
to authenticated
using (public.current_user_role() in ('CEO', 'Manager', 'Sales Executive'));

create policy "Sales staff can insert customers"
on customers for insert
to authenticated
with check (public.current_user_role() in ('CEO', 'Manager', 'Sales Executive'));

create policy "Sales staff can update customers"
on customers for update
to authenticated
using (public.current_user_role() in ('CEO', 'Manager', 'Sales Executive'))
with check (public.current_user_role() in ('CEO', 'Manager', 'Sales Executive'));

create policy "Managers can delete customers"
on customers for delete
to authenticated
using (public.current_user_role() in ('CEO', 'Manager'));

drop policy if exists "Allow anon read orders" on orders;
drop policy if exists "Allow anon insert orders" on orders;
drop policy if exists "Allow anon update orders" on orders;
drop policy if exists "Allow anon delete orders" on orders;
drop policy if exists "Users can read own orders" on orders;
drop policy if exists "Users can insert own orders" on orders;
drop policy if exists "Users can update own orders" on orders;
drop policy if exists "Users can delete own orders" on orders;
drop policy if exists "Staff can view orders" on orders;
drop policy if exists "Sales staff can insert orders" on orders;
drop policy if exists "Order staff can update orders" on orders;
drop policy if exists "Managers can delete orders" on orders;

create policy "Staff can view orders"
on orders for select
to authenticated
using (public.current_user_role() in ('CEO', 'Manager', 'Sales Executive', 'Logistics Officer'));

create policy "Sales staff can insert orders"
on orders for insert
to authenticated
with check (public.current_user_role() in ('CEO', 'Manager', 'Sales Executive'));

create policy "Order staff can update orders"
on orders for update
to authenticated
using (public.current_user_role() in ('CEO', 'Manager', 'Sales Executive', 'Logistics Officer'))
with check (public.current_user_role() in ('CEO', 'Manager', 'Sales Executive', 'Logistics Officer'));

create policy "Managers can delete orders"
on orders for delete
to authenticated
using (public.current_user_role() in ('CEO', 'Manager'));

create or replace function public.prevent_logistics_financial_order_edits()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.current_user_role() = 'Logistics Officer' and (
    new.customer_name is distinct from old.customer_name or
    new.vehicle is distinct from old.vehicle or
    new.quantity is distinct from old.quantity or
    new.order_date is distinct from old.order_date or
    new.purchase_cost is distinct from old.purchase_cost or
    new.selling_price is distinct from old.selling_price or
    new.created_by is distinct from old.created_by
  ) then
    raise exception 'Logistics Officer can update order status only.';
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_logistics_order_status_only on orders;
create trigger enforce_logistics_order_status_only
before update on orders
for each row execute function public.prevent_logistics_financial_order_edits();

-- First CEO setup:
-- Replace the email below, run it once in the Supabase SQL editor, then keep future role changes inside the app.
-- update profiles set role = 'CEO' where email = 'ceo@veloramotors.com';
