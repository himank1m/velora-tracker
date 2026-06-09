create table if not exists vehicles (
  id text primary key,
  brand text not null,
  model text not null,
  category text not null,
  quantity integer not null default 0,
  purchase_price numeric(12, 2) not null default 0,
  selling_price numeric(12, 2) not null default 0,
  status text not null default 'Available',
  created_by uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists customers (
  id text primary key,
  name text not null,
  phone text,
  email text,
  location text,
  notes text,
  created_by uuid not null default auth.uid() references auth.users(id) on delete cascade,
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
  created_by uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table vehicles add column if not exists created_by uuid default auth.uid() references auth.users(id) on delete cascade;
alter table customers add column if not exists created_by uuid default auth.uid() references auth.users(id) on delete cascade;
alter table orders add column if not exists created_by uuid default auth.uid() references auth.users(id) on delete cascade;

alter table vehicles enable row level security;
alter table customers enable row level security;
alter table orders enable row level security;

drop policy if exists "Allow anon read vehicles" on vehicles;
drop policy if exists "Allow anon insert vehicles" on vehicles;
drop policy if exists "Allow anon update vehicles" on vehicles;
drop policy if exists "Allow anon delete vehicles" on vehicles;
drop policy if exists "Users can read own vehicles" on vehicles;
drop policy if exists "Users can insert own vehicles" on vehicles;
drop policy if exists "Users can update own vehicles" on vehicles;
drop policy if exists "Users can delete own vehicles" on vehicles;

create policy "Users can read own vehicles"
on vehicles for select
to authenticated
using (created_by = auth.uid());

create policy "Users can insert own vehicles"
on vehicles for insert
to authenticated
with check (created_by = auth.uid());

create policy "Users can update own vehicles"
on vehicles for update
to authenticated
using (created_by = auth.uid())
with check (created_by = auth.uid());

create policy "Users can delete own vehicles"
on vehicles for delete
to authenticated
using (created_by = auth.uid());

drop policy if exists "Allow anon read customers" on customers;
drop policy if exists "Allow anon insert customers" on customers;
drop policy if exists "Allow anon update customers" on customers;
drop policy if exists "Allow anon delete customers" on customers;
drop policy if exists "Users can read own customers" on customers;
drop policy if exists "Users can insert own customers" on customers;
drop policy if exists "Users can update own customers" on customers;
drop policy if exists "Users can delete own customers" on customers;

create policy "Users can read own customers"
on customers for select
to authenticated
using (created_by = auth.uid());

create policy "Users can insert own customers"
on customers for insert
to authenticated
with check (created_by = auth.uid());

create policy "Users can update own customers"
on customers for update
to authenticated
using (created_by = auth.uid())
with check (created_by = auth.uid());

create policy "Users can delete own customers"
on customers for delete
to authenticated
using (created_by = auth.uid());

drop policy if exists "Allow anon read orders" on orders;
drop policy if exists "Allow anon insert orders" on orders;
drop policy if exists "Allow anon update orders" on orders;
drop policy if exists "Allow anon delete orders" on orders;
drop policy if exists "Users can read own orders" on orders;
drop policy if exists "Users can insert own orders" on orders;
drop policy if exists "Users can update own orders" on orders;
drop policy if exists "Users can delete own orders" on orders;

create policy "Users can read own orders"
on orders for select
to authenticated
using (created_by = auth.uid());

create policy "Users can insert own orders"
on orders for insert
to authenticated
with check (created_by = auth.uid());

create policy "Users can update own orders"
on orders for update
to authenticated
using (created_by = auth.uid())
with check (created_by = auth.uid());

create policy "Users can delete own orders"
on orders for delete
to authenticated
using (created_by = auth.uid());
