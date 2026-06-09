create table if not exists vehicles (
  id text primary key,
  brand text not null,
  model text not null,
  category text not null,
  quantity integer not null default 0,
  purchase_price numeric(12, 2) not null default 0,
  selling_price numeric(12, 2) not null default 0,
  status text not null default 'Available',
  created_at timestamptz not null default now()
);

create table if not exists customers (
  id text primary key,
  name text not null,
  phone text,
  email text,
  location text,
  notes text,
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
  created_at timestamptz not null default now()
);

alter table vehicles enable row level security;
alter table customers enable row level security;
alter table orders enable row level security;

create policy "Allow anon read vehicles"
on vehicles for select
to anon
using (true);

create policy "Allow anon insert vehicles"
on vehicles for insert
to anon
with check (true);

create policy "Allow anon update vehicles"
on vehicles for update
to anon
using (true)
with check (true);

create policy "Allow anon delete vehicles"
on vehicles for delete
to anon
using (true);

create policy "Allow anon read customers"
on customers for select
to anon
using (true);

create policy "Allow anon insert customers"
on customers for insert
to anon
with check (true);

create policy "Allow anon update customers"
on customers for update
to anon
using (true)
with check (true);

create policy "Allow anon delete customers"
on customers for delete
to anon
using (true);

create policy "Allow anon read orders"
on orders for select
to anon
using (true);

create policy "Allow anon insert orders"
on orders for insert
to anon
with check (true);

create policy "Allow anon update orders"
on orders for update
to anon
using (true)
with check (true);

create policy "Allow anon delete orders"
on orders for delete
to anon
using (true);
