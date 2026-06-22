-- Velora OS Phase 2: Enterprise Core
-- Safe, additive migration. This file does not drop, truncate, or rename existing data.

create extension if not exists pgcrypto;

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

-- Existing module extensions -------------------------------------------------

alter table public.procurement_requests add column if not exists supplier_id uuid references public.suppliers(id) on delete set null;
alter table public.procurement_requests add column if not exists item_type text default 'Vehicle';
alter table public.procurement_requests add column if not exists unit_buy_price numeric(14, 2) default 0;
alter table public.procurement_requests add column if not exists approved_purchase_amount numeric(14, 2) default 0;
alter table public.procurement_requests add column if not exists currency text default 'INR';
alter table public.procurement_requests add column if not exists linked_order_id uuid references public.orders(id) on delete set null;
alter table public.procurement_requests add column if not exists expected_delivery_date date;
alter table public.procurement_requests add column if not exists actual_delivery_date date;
alter table public.procurement_requests add column if not exists payment_status text default 'Unpaid';
alter table public.procurement_requests add column if not exists priority text default 'Medium';
alter table public.procurement_requests add column if not exists updated_at timestamptz not null default now();

alter table public.suppliers add column if not exists rating numeric(3, 2);
alter table public.suppliers add column if not exists on_time_delivery_rate numeric(5, 2);
alter table public.suppliers add column if not exists total_orders integer not null default 0;
alter table public.suppliers add column if not exists last_activity_at timestamptz;
alter table public.suppliers add column if not exists updated_at timestamptz not null default now();

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

alter table public.shipments add column if not exists customer_id text references public.customers(id) on delete set null;
alter table public.shipments add column if not exists carrier_id uuid references public.logistics_partners(id) on delete set null;
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
alter table public.vehicles add column if not exists supplier_id uuid references public.suppliers(id) on delete set null;
alter table public.vehicles add column if not exists linked_procurement_id text references public.procurement_requests(procurement_id) on delete set null;
alter table public.vehicles add column if not exists linked_order_id uuid references public.orders(id) on delete set null;
alter table public.vehicles add column if not exists linked_shipment_id text references public.shipments(shipment_id) on delete set null;
alter table public.vehicles add column if not exists arrival_date date;
alter table public.vehicles add column if not exists delivery_date date;
alter table public.vehicles add column if not exists lifecycle_status text default 'In Inventory';
alter table public.vehicles add column if not exists notes text;
alter table public.vehicles add column if not exists updated_at timestamptz not null default now();

-- Finance -------------------------------------------------------------------

create table if not exists public.finance_records (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete set null,
  customer_id text references public.customers(id) on delete set null,
  supplier_id uuid references public.suppliers(id) on delete set null,
  procurement_id text references public.procurement_requests(procurement_id) on delete set null,
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
  created_by uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.finance_records add column if not exists supplier_id uuid references public.suppliers(id) on delete set null;
alter table public.finance_records add column if not exists procurement_id text references public.procurement_requests(procurement_id) on delete set null;
alter table public.finance_records add column if not exists gross_profit numeric(14, 2)
  generated always as (total_sale_amount - vehicle_cost) stored;
alter table public.finance_records add column if not exists net_profit numeric(14, 2)
  generated always as (total_sale_amount - vehicle_cost - procurement_cost - freight_cost - tax_duty_cost - other_cost) stored;
alter table public.finance_records add column if not exists margin_percentage numeric(8, 2)
  generated always as (
    case
      when total_sale_amount = 0 then 0
      else ((total_sale_amount - vehicle_cost - procurement_cost - freight_cost - tax_duty_cost - other_cost) / total_sale_amount) * 100
    end
  ) stored;
alter table public.finance_records add column if not exists amount_pending numeric(14, 2)
  generated always as (greatest(total_sale_amount - amount_paid, 0)) stored;

-- CRM support ----------------------------------------------------------------

create table if not exists public.customer_contacts (
  id uuid primary key default gen_random_uuid(),
  customer_id text not null references public.customers(id) on delete cascade,
  full_name text not null,
  job_title text,
  email text,
  phone text,
  is_primary boolean not null default false,
  created_by uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.customer_notes (
  id uuid primary key default gen_random_uuid(),
  customer_id text not null references public.customers(id) on delete cascade,
  note text not null,
  created_by uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Documents ------------------------------------------------------------------

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
  uploaded_by uuid not null default auth.uid() references auth.users(id) on delete cascade,
  uploaded_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Operational timelines ------------------------------------------------------

create table if not exists public.vehicle_lifecycle_events (
  id uuid primary key default gen_random_uuid(),
  vehicle_id text not null references public.vehicles(id) on delete cascade,
  status text not null,
  note text,
  created_by uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.shipment_events (
  id uuid primary key default gen_random_uuid(),
  shipment_id text not null references public.shipments(shipment_id) on delete cascade,
  status text not null,
  note text,
  created_by uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- Keep vehicle lifecycle aligned with linked operational records where links exist.
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
          delivery_date = case when new.status = 'Delivered' then coalesce(new.actual_delivery_date, current_date) else delivery_date end
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
    update public.vehicles set lifecycle_status = next_status where linked_order_id = new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists sync_vehicle_lifecycle_after_shipment on public.shipments;
create trigger sync_vehicle_lifecycle_after_shipment
after insert or update of status, actual_delivery_date on public.shipments
for each row execute function public.sync_vehicle_lifecycle_from_shipment();

drop trigger if exists sync_vehicle_lifecycle_after_order on public.orders;
create trigger sync_vehicle_lifecycle_after_order
after insert or update of status on public.orders
for each row execute function public.sync_vehicle_lifecycle_from_order();

-- Timestamp triggers ---------------------------------------------------------

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'procurement_requests', 'suppliers', 'customers', 'shipments', 'vehicles',
    'finance_records', 'customer_contacts', 'customer_notes', 'documents'
  ]
  loop
    execute format('drop trigger if exists set_%I_updated_at on public.%I', table_name, table_name);
    execute format(
      'create trigger set_%I_updated_at before update on public.%I for each row execute function public.set_updated_at()',
      table_name,
      table_name
    );
  end loop;
end $$;

-- Search and reporting indexes ----------------------------------------------

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
create index if not exists finance_records_payment_status_idx on public.finance_records(payment_status);
create index if not exists finance_records_due_date_idx on public.finance_records(due_date);
create index if not exists documents_link_idx on public.documents(linked_module, linked_record_id);
create index if not exists documents_category_idx on public.documents(category);
create index if not exists documents_uploaded_at_idx on public.documents(uploaded_at);
create index if not exists vehicle_lifecycle_events_vehicle_id_idx on public.vehicle_lifecycle_events(vehicle_id, created_at);
create index if not exists shipment_events_shipment_id_idx on public.shipment_events(shipment_id, created_at);
create index if not exists customer_contacts_customer_id_idx on public.customer_contacts(customer_id);
create index if not exists customer_notes_customer_id_idx on public.customer_notes(customer_id, created_at);

-- Row level security ---------------------------------------------------------

alter table public.finance_records enable row level security;
alter table public.customer_contacts enable row level security;
alter table public.customer_notes enable row level security;
alter table public.documents enable row level security;
alter table public.vehicle_lifecycle_events enable row level security;
alter table public.shipment_events enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'finance_records' and policyname = 'Finance roles can read finance records') then
    create policy "Finance roles can read finance records" on public.finance_records
      for select to authenticated using (
        exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('CEO', 'Company Manager', 'Finance Manager'))
      );
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'finance_records' and policyname = 'Finance roles can manage finance records') then
    create policy "Finance roles can manage finance records" on public.finance_records
      for all to authenticated using (
        exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('CEO', 'Company Manager', 'Finance Manager'))
      ) with check (
        exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('CEO', 'Company Manager', 'Finance Manager'))
      );
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'customer_contacts' and policyname = 'Business roles can read customer contacts') then
    create policy "Business roles can read customer contacts" on public.customer_contacts
      for select to authenticated using (
        exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('CEO', 'Company Manager', 'Finance Manager'))
      );
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'customer_contacts' and policyname = 'Managers can manage customer contacts') then
    create policy "Managers can manage customer contacts" on public.customer_contacts
      for all to authenticated using (
        exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('CEO', 'Company Manager'))
      ) with check (
        exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('CEO', 'Company Manager'))
      );
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'customer_notes' and policyname = 'Business roles can read customer notes') then
    create policy "Business roles can read customer notes" on public.customer_notes
      for select to authenticated using (
        exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('CEO', 'Company Manager', 'Finance Manager'))
      );
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'customer_notes' and policyname = 'Managers can manage customer notes') then
    create policy "Managers can manage customer notes" on public.customer_notes
      for all to authenticated using (
        exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('CEO', 'Company Manager'))
      ) with check (
        exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('CEO', 'Company Manager'))
      );
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'documents' and policyname = 'Authenticated roles can read documents') then
    create policy "Authenticated roles can read documents" on public.documents
      for select to authenticated using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'documents' and policyname = 'Managers can manage documents') then
    create policy "Managers can manage documents" on public.documents
      for all to authenticated using (
        exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('CEO', 'Company Manager', 'Logistics Manager', 'Inventory Manager', 'Finance Manager'))
      ) with check (uploaded_by = auth.uid());
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'vehicle_lifecycle_events' and policyname = 'Inventory roles can read lifecycle events') then
    create policy "Inventory roles can read lifecycle events" on public.vehicle_lifecycle_events
      for select to authenticated using (
        exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('CEO', 'Company Manager', 'Inventory Manager', 'Finance Manager'))
      );
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'vehicle_lifecycle_events' and policyname = 'Inventory roles can manage lifecycle events') then
    create policy "Inventory roles can manage lifecycle events" on public.vehicle_lifecycle_events
      for all to authenticated using (
        exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('CEO', 'Company Manager', 'Inventory Manager'))
      ) with check (
        exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('CEO', 'Company Manager', 'Inventory Manager'))
      );
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'shipment_events' and policyname = 'Logistics roles can read shipment events') then
    create policy "Logistics roles can read shipment events" on public.shipment_events
      for select to authenticated using (
        exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('CEO', 'Company Manager', 'Logistics Manager', 'Finance Manager'))
      );
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'shipment_events' and policyname = 'Logistics roles can manage shipment events') then
    create policy "Logistics roles can manage shipment events" on public.shipment_events
      for all to authenticated using (
        exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('CEO', 'Company Manager', 'Logistics Manager'))
      ) with check (
        exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('CEO', 'Company Manager', 'Logistics Manager'))
      );
  end if;
end $$;

-- Document storage -----------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'velora-documents',
  'velora-documents',
  false,
  10485760,
  array['application/pdf', 'image/png', 'image/jpeg', 'text/csv', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'Authenticated users can read Velora documents') then
    create policy "Authenticated users can read Velora documents" on storage.objects
      for select to authenticated using (bucket_id = 'velora-documents');
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'Authenticated users can upload Velora documents') then
    create policy "Authenticated users can upload Velora documents" on storage.objects
      for insert to authenticated with check (bucket_id = 'velora-documents' and (storage.foldername(name))[1] = auth.uid()::text);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'Owners can delete Velora documents') then
    create policy "Owners can delete Velora documents" on storage.objects
      for delete to authenticated using (bucket_id = 'velora-documents' and owner_id = auth.uid()::text);
  end if;
end $$;
