-- Velora OS Phase 2 procurement_orders bootstrap
-- Run this once before the full Phase 2 migration when an older migration copy
-- reports: relation "public.procurement_orders" does not exist.

create extension if not exists pgcrypto;

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
