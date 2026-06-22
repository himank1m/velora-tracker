-- Velora OS Phase 2: Enterprise Core
-- Safe, additive, and idempotent.
-- This migration does not drop tables, truncate tables, delete records, or rename data.

create extension if not exists pgcrypto;

-- ============================================================================
-- PHASE A: CREATE EVERY PHASE 2 TABLE BEFORE ANY REFERENCES
-- Creation order is intentionally explicit.
-- ============================================================================

-- 1. Suppliers
create table if not exists public.suppliers (
  id uuid primary key default gen_random_uuid(),
  supplier_name text not null,
  country text,
  contact_person text,
  phone text,
  email text,
  notes text,
  rating numeric(3, 2),
  on_time_delivery_rate numeric(5, 2),
  total_orders integer not null default 0,
  last_activity_at timestamptz,
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Existing-compatible procurement requests
create table if not exists public.procurement_requests (
  procurement_id text primary key,
  vehicle_brand text not null default '',
  vehicle_model text not null default '',
  quantity integer not null default 1,
  supplier_name text,
  supplier_country text,
  estimated_purchase_cost numeric(14, 2) not null default 0,
  estimated_freight_cost numeric(14, 2) not null default 0,
  requested_by text,
  status text not null default 'Draft',
  notes text,
  supplier_id uuid,
  item_type text default 'Vehicle',
  unit_buy_price numeric(14, 2) default 0,
  approved_purchase_amount numeric(14, 2) default 0,
  currency text default 'INR',
  linked_order_id uuid,
  expected_delivery_date date,
  actual_delivery_date date,
  payment_status text default 'Unpaid',
  priority text default 'Medium',
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. Normalized procurement orders
-- This must exist before finance records, indexes, policies, or foreign keys use it.
create table if not exists public.procurement_orders (
  id uuid primary key default gen_random_uuid(),
  procurement_number text,
  supplier_id uuid,
  item_type text not null default 'Vehicle',
  item_name text not null default '',
  vehicle_brand text,
  vehicle_model text,
  quantity integer not null default 1,
  unit_buy_price numeric(14, 2) not null default 0,
  total_buy_price numeric(14, 2) not null default 0,
  currency text not null default 'INR',
  linked_order_id uuid,
  expected_delivery_date date,
  actual_delivery_date date,
  payment_status text not null default 'Unpaid',
  status text not null default 'Draft',
  priority text not null default 'Medium',
  notes text,
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 4. Finance records
create table if not exists public.finance_records (
  id uuid primary key default gen_random_uuid(),
  order_id uuid,
  customer_id text,
  supplier_id uuid,
  procurement_id text,
  procurement_order_id uuid,
  total_sale_amount numeric(14, 2) not null default 0,
  vehicle_cost numeric(14, 2) not null default 0,
  procurement_cost numeric(14, 2) not null default 0,
  freight_cost numeric(14, 2) not null default 0,
  tax_duty_cost numeric(14, 2) not null default 0,
  other_cost numeric(14, 2) not null default 0,
  amount_paid numeric(14, 2) not null default 0,
  payment_status text not null default 'Unpaid',
  invoice_status text not null default 'Not Generated',
  due_date date,
  notes text,
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 5. Customer contacts
create table if not exists public.customer_contacts (
  id uuid primary key default gen_random_uuid(),
  customer_id text,
  full_name text not null,
  job_title text,
  email text,
  phone text,
  is_primary boolean not null default false,
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 6. Customer notes
create table if not exists public.customer_notes (
  id uuid primary key default gen_random_uuid(),
  customer_id text,
  note text not null,
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 7. Documents
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  file_name text not null,
  file_type text,
  file_size bigint not null default 0,
  category text not null default 'Other',
  linked_module text,
  linked_record_id text,
  storage_path text not null,
  notes text,
  uploaded_by uuid default auth.uid(),
  uploaded_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 8. Vehicle lifecycle events
create table if not exists public.vehicle_lifecycle_events (
  id uuid primary key default gen_random_uuid(),
  vehicle_id text,
  status text not null,
  note text,
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now()
);

-- 9. Shipment events
create table if not exists public.shipment_events (
  id uuid primary key default gen_random_uuid(),
  shipment_id text,
  status text not null,
  note text,
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now()
);

-- ============================================================================
-- PHASE B: ADD MISSING COLUMNS
-- All Phase 2 tables now exist, so these references are safe.
-- ============================================================================

alter table public.suppliers add column if not exists supplier_name text not null default '';
alter table public.suppliers add column if not exists country text;
alter table public.suppliers add column if not exists contact_person text;
alter table public.suppliers add column if not exists phone text;
alter table public.suppliers add column if not exists email text;
alter table public.suppliers add column if not exists notes text;
alter table public.suppliers add column if not exists rating numeric(3, 2);
alter table public.suppliers add column if not exists on_time_delivery_rate numeric(5, 2);
alter table public.suppliers add column if not exists total_orders integer not null default 0;
alter table public.suppliers add column if not exists last_activity_at timestamptz;
alter table public.suppliers add column if not exists created_by uuid default auth.uid();
alter table public.suppliers add column if not exists created_at timestamptz not null default now();
alter table public.suppliers add column if not exists updated_at timestamptz not null default now();

alter table public.procurement_requests add column if not exists procurement_id text;
alter table public.procurement_requests add column if not exists vehicle_brand text not null default '';
alter table public.procurement_requests add column if not exists vehicle_model text not null default '';
alter table public.procurement_requests add column if not exists quantity integer not null default 1;
alter table public.procurement_requests add column if not exists supplier_name text;
alter table public.procurement_requests add column if not exists supplier_country text;
alter table public.procurement_requests add column if not exists estimated_purchase_cost numeric(14, 2) not null default 0;
alter table public.procurement_requests add column if not exists estimated_freight_cost numeric(14, 2) not null default 0;
alter table public.procurement_requests add column if not exists requested_by text;
alter table public.procurement_requests add column if not exists status text not null default 'Draft';
alter table public.procurement_requests add column if not exists notes text;
alter table public.procurement_requests add column if not exists supplier_id uuid;
alter table public.procurement_requests add column if not exists item_type text default 'Vehicle';
alter table public.procurement_requests add column if not exists unit_buy_price numeric(14, 2) default 0;
alter table public.procurement_requests add column if not exists approved_purchase_amount numeric(14, 2) default 0;
alter table public.procurement_requests add column if not exists currency text default 'INR';
alter table public.procurement_requests add column if not exists linked_order_id uuid;
alter table public.procurement_requests add column if not exists expected_delivery_date date;
alter table public.procurement_requests add column if not exists actual_delivery_date date;
alter table public.procurement_requests add column if not exists payment_status text default 'Unpaid';
alter table public.procurement_requests add column if not exists priority text default 'Medium';
alter table public.procurement_requests add column if not exists created_by uuid default auth.uid();
alter table public.procurement_requests add column if not exists created_at timestamptz not null default now();
alter table public.procurement_requests add column if not exists updated_at timestamptz not null default now();

-- Repair older procurement_requests schemas without procedural SQL.
update public.procurement_requests
set procurement_id = 'PR-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)
where procurement_id is null or procurement_id = '';

-- Preserve the first occurrence of any legacy duplicate identifier and give
-- later duplicates a unique suffix so the foreign-key target can be indexed.
with ranked as (
  select
    ctid,
    procurement_id,
    row_number() over (
      partition by procurement_id
      order by created_at nulls last, ctid
    ) as duplicate_number
  from public.procurement_requests
)
update public.procurement_requests as requests
set procurement_id = ranked.procurement_id
  || '-'
  || substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)
from ranked
where requests.ctid = ranked.ctid
  and ranked.duplicate_number > 1;

-- Keep display identifiers unique without requiring fragile cross-version
-- procurement foreign keys.
create unique index if not exists procurement_requests_procurement_id_uidx
  on public.procurement_requests(procurement_id);

alter table public.procurement_orders add column if not exists procurement_number text;
alter table public.procurement_orders add column if not exists supplier_id uuid;
alter table public.procurement_orders add column if not exists item_type text not null default 'Vehicle';
alter table public.procurement_orders add column if not exists item_name text not null default '';
alter table public.procurement_orders add column if not exists vehicle_brand text;
alter table public.procurement_orders add column if not exists vehicle_model text;
alter table public.procurement_orders add column if not exists quantity integer not null default 1;
alter table public.procurement_orders add column if not exists unit_buy_price numeric(14, 2) not null default 0;
alter table public.procurement_orders add column if not exists total_buy_price numeric(14, 2) not null default 0;
alter table public.procurement_orders add column if not exists currency text not null default 'INR';
alter table public.procurement_orders add column if not exists linked_order_id uuid;
alter table public.procurement_orders add column if not exists expected_delivery_date date;
alter table public.procurement_orders add column if not exists actual_delivery_date date;
alter table public.procurement_orders add column if not exists payment_status text not null default 'Unpaid';
alter table public.procurement_orders add column if not exists status text not null default 'Draft';
alter table public.procurement_orders add column if not exists priority text not null default 'Medium';
alter table public.procurement_orders add column if not exists notes text;
alter table public.procurement_orders add column if not exists created_by uuid default auth.uid();
alter table public.procurement_orders add column if not exists created_at timestamptz not null default now();
alter table public.procurement_orders add column if not exists updated_at timestamptz not null default now();

alter table public.finance_records add column if not exists order_id uuid;
alter table public.finance_records add column if not exists customer_id text;
alter table public.finance_records add column if not exists supplier_id uuid;
alter table public.finance_records add column if not exists procurement_id text;
alter table public.finance_records add column if not exists procurement_order_id uuid;
alter table public.finance_records add column if not exists total_sale_amount numeric(14, 2) not null default 0;
alter table public.finance_records add column if not exists vehicle_cost numeric(14, 2) not null default 0;
alter table public.finance_records add column if not exists procurement_cost numeric(14, 2) not null default 0;
alter table public.finance_records add column if not exists freight_cost numeric(14, 2) not null default 0;
alter table public.finance_records add column if not exists tax_duty_cost numeric(14, 2) not null default 0;
alter table public.finance_records add column if not exists other_cost numeric(14, 2) not null default 0;
alter table public.finance_records add column if not exists amount_paid numeric(14, 2) not null default 0;
alter table public.finance_records add column if not exists payment_status text not null default 'Unpaid';
alter table public.finance_records add column if not exists invoice_status text not null default 'Not Generated';
alter table public.finance_records add column if not exists due_date date;
alter table public.finance_records add column if not exists notes text;
alter table public.finance_records add column if not exists created_by uuid default auth.uid();
alter table public.finance_records add column if not exists created_at timestamptz not null default now();
alter table public.finance_records add column if not exists updated_at timestamptz not null default now();
alter table public.finance_records add column if not exists gross_profit numeric(14, 2)
  generated always as (total_sale_amount - vehicle_cost) stored;
alter table public.finance_records add column if not exists net_profit numeric(14, 2)
  generated always as (
    total_sale_amount - vehicle_cost - procurement_cost - freight_cost - tax_duty_cost - other_cost
  ) stored;
alter table public.finance_records add column if not exists margin_percentage numeric(8, 2)
  generated always as (
    case
      when total_sale_amount = 0 then 0
      else (
        (total_sale_amount - vehicle_cost - procurement_cost - freight_cost - tax_duty_cost - other_cost)
        / total_sale_amount
      ) * 100
    end
  ) stored;
alter table public.finance_records add column if not exists amount_pending numeric(14, 2)
  generated always as (greatest(total_sale_amount - amount_paid, 0)) stored;

alter table public.customer_contacts add column if not exists customer_id text;
alter table public.customer_contacts add column if not exists full_name text not null default '';
alter table public.customer_contacts add column if not exists job_title text;
alter table public.customer_contacts add column if not exists email text;
alter table public.customer_contacts add column if not exists phone text;
alter table public.customer_contacts add column if not exists is_primary boolean not null default false;
alter table public.customer_contacts add column if not exists created_by uuid default auth.uid();
alter table public.customer_contacts add column if not exists created_at timestamptz not null default now();
alter table public.customer_contacts add column if not exists updated_at timestamptz not null default now();

alter table public.customer_notes add column if not exists customer_id text;
alter table public.customer_notes add column if not exists note text not null default '';
alter table public.customer_notes add column if not exists created_by uuid default auth.uid();
alter table public.customer_notes add column if not exists created_at timestamptz not null default now();
alter table public.customer_notes add column if not exists updated_at timestamptz not null default now();

alter table public.documents add column if not exists file_name text not null default '';
alter table public.documents add column if not exists file_type text;
alter table public.documents add column if not exists file_size bigint not null default 0;
alter table public.documents add column if not exists category text not null default 'Other';
alter table public.documents add column if not exists linked_module text;
alter table public.documents add column if not exists linked_record_id text;
alter table public.documents add column if not exists storage_path text not null default '';
alter table public.documents add column if not exists notes text;
alter table public.documents add column if not exists uploaded_by uuid default auth.uid();
alter table public.documents add column if not exists uploaded_at timestamptz not null default now();
alter table public.documents add column if not exists updated_at timestamptz not null default now();

alter table public.vehicle_lifecycle_events add column if not exists vehicle_id text;
alter table public.vehicle_lifecycle_events add column if not exists status text not null default 'Planned';
alter table public.vehicle_lifecycle_events add column if not exists note text;
alter table public.vehicle_lifecycle_events add column if not exists created_by uuid default auth.uid();
alter table public.vehicle_lifecycle_events add column if not exists created_at timestamptz not null default now();

alter table public.shipment_events add column if not exists shipment_id text;
alter table public.shipment_events add column if not exists status text not null default 'Planning';
alter table public.shipment_events add column if not exists note text;
alter table public.shipment_events add column if not exists created_by uuid default auth.uid();
alter table public.shipment_events add column if not exists created_at timestamptz not null default now();

alter table public.customers add column if not exists customer_type text default 'Company';
alter table public.customers add column if not exists country text;
alter table public.customers add column if not exists city text;
alter table public.customers add column if not exists contact_person text;
alter table public.customers add column if not exists address text;
alter table public.customers add column if not exists preferred_vehicle_types text;
alter table public.customers add column if not exists preferred_shipping_method text;
alter table public.customers add column if not exists customer_rating text default 'B';
alter table public.customers add column if not exists payment_reliability_score integer default 75;
alter table public.customers add column if not exists active boolean not null default true;
alter table public.customers add column if not exists updated_at timestamptz not null default now();

alter table public.shipments add column if not exists customer_id text;
alter table public.shipments add column if not exists carrier_id uuid;
alter table public.shipments add column if not exists shipping_mode text default 'Sea';
alter table public.shipments add column if not exists origin_country text;
alter table public.shipments add column if not exists origin_city text;
alter table public.shipments add column if not exists destination_city text;
alter table public.shipments add column if not exists actual_delivery_date date;
alter table public.shipments add column if not exists customs_status text default 'Not Started';
alter table public.shipments add column if not exists delay_reason text;
alter table public.shipments add column if not exists tracking_reference text;
alter table public.shipments add column if not exists delivery_proof_path text;
alter table public.shipments add column if not exists updated_at timestamptz not null default now();

alter table public.vehicles add column if not exists variant text;
alter table public.vehicles add column if not exists vin text;
alter table public.vehicles add column if not exists engine_number text;
alter table public.vehicles add column if not exists color text;
alter table public.vehicles add column if not exists model_year integer;
alter table public.vehicles add column if not exists supplier_id uuid;
alter table public.vehicles add column if not exists linked_procurement_id text;
alter table public.vehicles add column if not exists linked_order_id uuid;
alter table public.vehicles add column if not exists linked_shipment_id text;
alter table public.vehicles add column if not exists arrival_date date;
alter table public.vehicles add column if not exists delivery_date date;
alter table public.vehicles add column if not exists lifecycle_status text default 'In Inventory';
alter table public.vehicles add column if not exists notes text;
alter table public.vehicles add column if not exists updated_at timestamptz not null default now();

-- ============================================================================
-- PHASE C: ADD FOREIGN KEYS ONLY AFTER EVERY TABLE EXISTS
-- Each constraint is guarded by pg_constraint for idempotency.
-- ============================================================================

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'procurement_requests_supplier_id_fkey' and conrelid = 'public.procurement_requests'::regclass) then
    alter table public.procurement_requests
      add constraint procurement_requests_supplier_id_fkey
      foreign key (supplier_id) references public.suppliers(id) on delete set null not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'procurement_requests_linked_order_id_fkey' and conrelid = 'public.procurement_requests'::regclass) then
    alter table public.procurement_requests
      add constraint procurement_requests_linked_order_id_fkey
      foreign key (linked_order_id) references public.orders(id) on delete set null not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'procurement_orders_supplier_id_fkey' and conrelid = 'public.procurement_orders'::regclass) then
    alter table public.procurement_orders
      add constraint procurement_orders_supplier_id_fkey
      foreign key (supplier_id) references public.suppliers(id) on delete set null not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'procurement_orders_linked_order_id_fkey' and conrelid = 'public.procurement_orders'::regclass) then
    alter table public.procurement_orders
      add constraint procurement_orders_linked_order_id_fkey
      foreign key (linked_order_id) references public.orders(id) on delete set null not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'finance_records_order_id_fkey' and conrelid = 'public.finance_records'::regclass) then
    alter table public.finance_records
      add constraint finance_records_order_id_fkey
      foreign key (order_id) references public.orders(id) on delete set null not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'finance_records_customer_id_fkey' and conrelid = 'public.finance_records'::regclass) then
    alter table public.finance_records
      add constraint finance_records_customer_id_fkey
      foreign key (customer_id) references public.customers(id) on delete set null not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'finance_records_supplier_id_fkey' and conrelid = 'public.finance_records'::regclass) then
    alter table public.finance_records
      add constraint finance_records_supplier_id_fkey
      foreign key (supplier_id) references public.suppliers(id) on delete set null not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'finance_records_procurement_order_id_fkey' and conrelid = 'public.finance_records'::regclass) then
    alter table public.finance_records
      add constraint finance_records_procurement_order_id_fkey
      foreign key (procurement_order_id) references public.procurement_orders(id) on delete set null not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'customer_contacts_customer_id_fkey' and conrelid = 'public.customer_contacts'::regclass) then
    alter table public.customer_contacts
      add constraint customer_contacts_customer_id_fkey
      foreign key (customer_id) references public.customers(id) on delete cascade not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'customer_notes_customer_id_fkey' and conrelid = 'public.customer_notes'::regclass) then
    alter table public.customer_notes
      add constraint customer_notes_customer_id_fkey
      foreign key (customer_id) references public.customers(id) on delete cascade not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'vehicle_lifecycle_events_vehicle_id_fkey' and conrelid = 'public.vehicle_lifecycle_events'::regclass) then
    alter table public.vehicle_lifecycle_events
      add constraint vehicle_lifecycle_events_vehicle_id_fkey
      foreign key (vehicle_id) references public.vehicles(id) on delete cascade not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'shipment_events_shipment_id_fkey' and conrelid = 'public.shipment_events'::regclass) then
    alter table public.shipment_events
      add constraint shipment_events_shipment_id_fkey
      foreign key (shipment_id) references public.shipments(shipment_id) on delete cascade not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'shipments_customer_id_fkey' and conrelid = 'public.shipments'::regclass) then
    alter table public.shipments
      add constraint shipments_customer_id_fkey
      foreign key (customer_id) references public.customers(id) on delete set null not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'shipments_carrier_id_fkey' and conrelid = 'public.shipments'::regclass) then
    alter table public.shipments
      add constraint shipments_carrier_id_fkey
      foreign key (carrier_id) references public.logistics_partners(id) on delete set null not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'vehicles_supplier_id_fkey' and conrelid = 'public.vehicles'::regclass) then
    alter table public.vehicles
      add constraint vehicles_supplier_id_fkey
      foreign key (supplier_id) references public.suppliers(id) on delete set null not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'vehicles_linked_order_id_fkey' and conrelid = 'public.vehicles'::regclass) then
    alter table public.vehicles
      add constraint vehicles_linked_order_id_fkey
      foreign key (linked_order_id) references public.orders(id) on delete set null not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'vehicles_linked_shipment_id_fkey' and conrelid = 'public.vehicles'::regclass) then
    alter table public.vehicles
      add constraint vehicles_linked_shipment_id_fkey
      foreign key (linked_shipment_id) references public.shipments(shipment_id) on delete set null not valid;
  end if;
end $$;

-- ============================================================================
-- PHASE D: FUNCTIONS AND TRIGGERS
-- ============================================================================

create or replace function public.set_updated_at()
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

create or replace function public.sync_vehicle_lifecycle_from_shipment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  next_status text;
begin
  next_status := case new.status
    when 'Planning' then 'Assigned to Shipment'
    when 'Booked' then 'Assigned to Shipment'
    when 'Awaiting Pickup' then 'Assigned to Shipment'
    when 'In Transit' then 'Shipped'
    when 'At Port' then 'Shipped'
    when 'Customs Clearance' then 'Shipped'
    when 'Out for Delivery' then 'Shipped'
    when 'Delivered' then 'Delivered'
    else null
  end;

  if next_status is not null then
    update public.vehicles
    set lifecycle_status = next_status,
        delivery_date = case
          when new.status = 'Delivered' then coalesce(new.actual_delivery_date, current_date)
          else delivery_date
        end
    where linked_shipment_id = new.shipment_id;
  end if;

  return new;
end;
$$;

create or replace function public.sync_vehicle_lifecycle_from_order()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  next_status text;
begin
  next_status := case new.status
    when 'Confirmed' then 'Reserved'
    when 'Ready' then 'Sold'
    when 'Shipped' then 'Shipped'
    when 'Delivered' then 'Delivered'
    when 'Completed' then 'Delivered'
    else null
  end;

  if next_status is not null then
    update public.vehicles
    set lifecycle_status = next_status
    where linked_order_id = new.id;
  end if;

  return new;
end;
$$;

do $$
declare
  target_table text;
begin
  foreach target_table in array array[
    'suppliers',
    'procurement_requests',
    'procurement_orders',
    'finance_records',
    'customer_contacts',
    'customer_notes',
    'documents',
    'customers',
    'shipments',
    'vehicles'
  ]
  loop
    if to_regclass(format('public.%I', target_table)) is not null
      and not exists (
        select 1
        from pg_trigger
        where tgname = format('set_%s_updated_at', target_table)
          and tgrelid = to_regclass(format('public.%I', target_table))
          and not tgisinternal
      )
    then
      execute format(
        'create trigger set_%I_updated_at before update on public.%I for each row execute function public.set_updated_at()',
        target_table,
        target_table
      );
    end if;
  end loop;

  if to_regclass('public.shipments') is not null
    and not exists (
      select 1 from pg_trigger
      where tgname = 'sync_vehicle_lifecycle_after_shipment'
        and tgrelid = 'public.shipments'::regclass
        and not tgisinternal
    )
  then
    create trigger sync_vehicle_lifecycle_after_shipment
      after insert or update of status, actual_delivery_date on public.shipments
      for each row execute function public.sync_vehicle_lifecycle_from_shipment();
  end if;

  if to_regclass('public.orders') is not null
    and not exists (
      select 1 from pg_trigger
      where tgname = 'sync_vehicle_lifecycle_after_order'
        and tgrelid = 'public.orders'::regclass
        and not tgisinternal
    )
  then
    create trigger sync_vehicle_lifecycle_after_order
      after insert or update of status on public.orders
      for each row execute function public.sync_vehicle_lifecycle_from_order();
  end if;
end $$;

-- ============================================================================
-- PHASE E: INDEXES
-- ============================================================================

create unique index if not exists procurement_orders_number_uidx
  on public.procurement_orders(procurement_number)
  where procurement_number is not null;
create index if not exists procurement_orders_status_idx on public.procurement_orders(status);
create index if not exists procurement_orders_supplier_id_idx on public.procurement_orders(supplier_id);
create index if not exists procurement_orders_linked_order_id_idx on public.procurement_orders(linked_order_id);
create index if not exists procurement_orders_created_at_idx on public.procurement_orders(created_at);

create index if not exists procurement_requests_status_idx on public.procurement_requests(status);
create index if not exists procurement_requests_supplier_id_idx on public.procurement_requests(supplier_id);
create index if not exists procurement_requests_linked_order_id_idx on public.procurement_requests(linked_order_id);
create index if not exists procurement_requests_dates_idx on public.procurement_requests(created_at, updated_at);

create index if not exists customers_rating_idx on public.customers(customer_rating);
create index if not exists customers_updated_at_idx on public.customers(updated_at);
create index if not exists shipments_status_idx on public.shipments(status);
create index if not exists shipments_customer_id_idx on public.shipments(customer_id);
create index if not exists shipments_updated_at_idx on public.shipments(updated_at);
create index if not exists vehicles_lifecycle_status_idx on public.vehicles(lifecycle_status);
create index if not exists vehicles_supplier_id_idx on public.vehicles(supplier_id);
create index if not exists vehicles_linked_order_id_idx on public.vehicles(linked_order_id);

create index if not exists finance_records_order_id_idx on public.finance_records(order_id);
create index if not exists finance_records_customer_id_idx on public.finance_records(customer_id);
create index if not exists finance_records_supplier_id_idx on public.finance_records(supplier_id);
create index if not exists finance_records_procurement_id_idx on public.finance_records(procurement_id);
create index if not exists finance_records_procurement_order_id_idx on public.finance_records(procurement_order_id);
create index if not exists finance_records_payment_status_idx on public.finance_records(payment_status);
create index if not exists finance_records_due_date_idx on public.finance_records(due_date);

create index if not exists documents_link_idx on public.documents(linked_module, linked_record_id);
create index if not exists documents_category_idx on public.documents(category);
create index if not exists documents_uploaded_at_idx on public.documents(uploaded_at);
create index if not exists vehicle_lifecycle_events_vehicle_id_idx on public.vehicle_lifecycle_events(vehicle_id, created_at);
create index if not exists shipment_events_shipment_id_idx on public.shipment_events(shipment_id, created_at);
create index if not exists customer_contacts_customer_id_idx on public.customer_contacts(customer_id);
create index if not exists customer_notes_customer_id_idx on public.customer_notes(customer_id, created_at);

-- ============================================================================
-- PHASE F: ROW LEVEL SECURITY AND POLICIES
-- ============================================================================

alter table public.procurement_orders enable row level security;
alter table public.finance_records enable row level security;
alter table public.customer_contacts enable row level security;
alter table public.customer_notes enable row level security;
alter table public.documents enable row level security;
alter table public.vehicle_lifecycle_events enable row level security;
alter table public.shipment_events enable row level security;

drop policy if exists "Role read procurement orders" on public.procurement_orders;
create policy "Role read procurement orders"
on public.procurement_orders for select to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role in ('CEO', 'Company Manager', 'Inventory Manager', 'Finance Manager')
  )
);

drop policy if exists "Role manage procurement orders" on public.procurement_orders;
create policy "Role manage procurement orders"
on public.procurement_orders for all to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role in ('CEO', 'Company Manager', 'Inventory Manager')
  )
)
with check (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role in ('CEO', 'Company Manager', 'Inventory Manager')
  )
);

drop policy if exists "Finance roles can read finance records" on public.finance_records;
create policy "Finance roles can read finance records"
on public.finance_records for select to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role in ('CEO', 'Company Manager', 'Finance Manager')
  )
);

drop policy if exists "Finance roles can manage finance records" on public.finance_records;
create policy "Finance roles can manage finance records"
on public.finance_records for all to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role in ('CEO', 'Company Manager', 'Finance Manager')
  )
)
with check (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role in ('CEO', 'Company Manager', 'Finance Manager')
  )
);

drop policy if exists "Business roles can read customer contacts" on public.customer_contacts;
create policy "Business roles can read customer contacts"
on public.customer_contacts for select to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role in ('CEO', 'Company Manager', 'Finance Manager')
  )
);

drop policy if exists "Managers can manage customer contacts" on public.customer_contacts;
create policy "Managers can manage customer contacts"
on public.customer_contacts for all to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role in ('CEO', 'Company Manager')
  )
)
with check (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role in ('CEO', 'Company Manager')
  )
);

drop policy if exists "Business roles can read customer notes" on public.customer_notes;
create policy "Business roles can read customer notes"
on public.customer_notes for select to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role in ('CEO', 'Company Manager', 'Finance Manager')
  )
);

drop policy if exists "Managers can manage customer notes" on public.customer_notes;
create policy "Managers can manage customer notes"
on public.customer_notes for all to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role in ('CEO', 'Company Manager')
  )
)
with check (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role in ('CEO', 'Company Manager')
  )
);

drop policy if exists "Authenticated roles can read documents" on public.documents;
create policy "Authenticated roles can read documents"
on public.documents for select to authenticated
using (true);

drop policy if exists "Managers can manage documents" on public.documents;
create policy "Managers can manage documents"
on public.documents for all to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role in ('CEO', 'Company Manager', 'Logistics Manager', 'Inventory Manager', 'Finance Manager')
  )
)
with check (uploaded_by = auth.uid());

drop policy if exists "Inventory roles can read lifecycle events" on public.vehicle_lifecycle_events;
create policy "Inventory roles can read lifecycle events"
on public.vehicle_lifecycle_events for select to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role in ('CEO', 'Company Manager', 'Inventory Manager', 'Finance Manager')
  )
);

drop policy if exists "Inventory roles can manage lifecycle events" on public.vehicle_lifecycle_events;
create policy "Inventory roles can manage lifecycle events"
on public.vehicle_lifecycle_events for all to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role in ('CEO', 'Company Manager', 'Inventory Manager')
  )
)
with check (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role in ('CEO', 'Company Manager', 'Inventory Manager')
  )
);

drop policy if exists "Logistics roles can read shipment events" on public.shipment_events;
create policy "Logistics roles can read shipment events"
on public.shipment_events for select to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role in ('CEO', 'Company Manager', 'Logistics Manager', 'Finance Manager')
  )
);

drop policy if exists "Logistics roles can manage shipment events" on public.shipment_events;
create policy "Logistics roles can manage shipment events"
on public.shipment_events for all to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role in ('CEO', 'Company Manager', 'Logistics Manager')
  )
)
with check (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role in ('CEO', 'Company Manager', 'Logistics Manager')
  )
);

-- ============================================================================
-- PHASE G: PRIVATE DOCUMENT STORAGE
-- ============================================================================

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'velora-documents',
  'velora-documents',
  false,
  10485760,
  array[
    'application/pdf',
    'image/png',
    'image/jpeg',
    'text/csv',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Authenticated users can read Velora documents" on storage.objects;
create policy "Authenticated users can read Velora documents"
on storage.objects for select to authenticated
using (bucket_id = 'velora-documents');

drop policy if exists "Authenticated users can upload Velora documents" on storage.objects;
create policy "Authenticated users can upload Velora documents"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'velora-documents'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Owners can delete Velora documents" on storage.objects;
create policy "Owners can delete Velora documents"
on storage.objects for delete to authenticated
using (
  bucket_id = 'velora-documents'
  and owner_id = auth.uid()::text
);
