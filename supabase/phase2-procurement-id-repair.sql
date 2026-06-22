-- Velora OS Phase 2 procurement identifier repair
-- Safe for partially migrated databases.

create extension if not exists pgcrypto;

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

alter table public.procurement_requests
  add column if not exists procurement_id text;

alter table public.procurement_requests
  add column if not exists created_at timestamptz not null default now();

update public.procurement_requests
set procurement_id = 'PR-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)
where procurement_id is null or procurement_id = '';

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

create unique index if not exists procurement_requests_procurement_id_uidx
  on public.procurement_requests(procurement_id);
