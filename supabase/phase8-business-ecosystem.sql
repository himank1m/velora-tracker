-- Velora OS Phase 8: Business Ecosystem & Multi-Company Foundation
-- Safe, additive, and idempotent. No operational rows are deleted or renamed.

create extension if not exists pgcrypto;

create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  logo_url text,
  industry text,
  country text,
  email text,
  phone text,
  status text not null default 'Active',
  is_primary boolean not null default false,
  settings jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists companies_single_primary_idx
  on public.companies (is_primary)
  where is_primary = true;

insert into public.companies (
  name, slug, industry, country, status, is_primary
)
values (
  'Velora Motors',
  'velora-motors',
  'Automotive Dealership & Export',
  'India',
  'Active',
  not exists (select 1 from public.companies where is_primary = true)
)
on conflict (slug) do update
set updated_at = now();

update public.companies
set is_primary = true,
    updated_at = now()
where slug = 'velora-motors'
  and not exists (
    select 1 from public.companies where is_primary = true
  );

create or replace function public.velora_primary_company_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id
  from public.companies
  where is_primary = true
  order by created_at
  limit 1
$$;

create table if not exists public.company_memberships (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  membership_role text not null default 'Member',
  status text not null default 'Active',
  invited_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, user_id)
);

create index if not exists company_memberships_user_idx
  on public.company_memberships (user_id, status, company_id);

insert into public.company_memberships (
  company_id,
  user_id,
  membership_role,
  status
)
select
  public.velora_primary_company_id(),
  profiles.id,
  case
    when profiles.role = 'CEO' then 'Owner'
    when profiles.role = 'Company Manager' then 'Admin'
    else 'Member'
  end,
  'Active'
from public.profiles
where public.velora_primary_company_id() is not null
on conflict (company_id, user_id) do update
set membership_role = excluded.membership_role,
    status = 'Active',
    updated_at = now();

create or replace function public.is_company_member(target_company_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.company_memberships
    where company_id = target_company_id
      and user_id = auth.uid()
      and status = 'Active'
  )
$$;

create or replace function public.can_manage_company(target_company_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.company_memberships
    where company_id = target_company_id
      and user_id = auth.uid()
      and status = 'Active'
      and membership_role in ('Owner', 'Admin', 'Manager')
  )
$$;

create or replace function public.add_company_creator_membership()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null then
    insert into public.company_memberships (
      company_id, user_id, membership_role, status, invited_by
    )
    values (
      new.id, auth.uid(), 'Owner', 'Active', auth.uid()
    )
    on conflict (company_id, user_id) do update
    set membership_role = 'Owner',
        status = 'Active',
        updated_at = now();
  end if;
  return new;
end;
$$;

drop trigger if exists create_company_creator_membership on public.companies;
create trigger create_company_creator_membership
after insert on public.companies
for each row execute function public.add_company_creator_membership();

create table if not exists public.ecosystem_relationships (
  id uuid primary key default gen_random_uuid(),
  source_company_id uuid not null references public.companies(id) on delete cascade,
  target_company_id uuid references public.companies(id) on delete set null,
  external_name text,
  relationship_type text not null,
  status text not null default 'Active',
  score numeric(5,2) not null default 0,
  notes text,
  shared_data jsonb not null default '{}'::jsonb,
  started_at date not null default current_date,
  created_by uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (target_company_id is not null or nullif(trim(external_name), '') is not null)
);

create index if not exists ecosystem_relationships_source_idx
  on public.ecosystem_relationships (source_company_id, status, created_at desc);

create index if not exists ecosystem_relationships_target_idx
  on public.ecosystem_relationships (target_company_id, status)
  where target_company_id is not null;

create table if not exists public.intercompany_transactions (
  id uuid primary key default gen_random_uuid(),
  transaction_number text not null,
  source_company_id uuid not null references public.companies(id) on delete cascade,
  target_company_id uuid references public.companies(id) on delete set null,
  relationship_id uuid references public.ecosystem_relationships(id) on delete set null,
  transaction_type text not null,
  amount numeric(18,2) not null default 0,
  cost numeric(18,2) not null default 0,
  profit numeric(18,2) not null default 0,
  status text not null default 'Planned',
  transaction_date date not null default current_date,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source_company_id, transaction_number)
);

create index if not exists intercompany_transactions_company_idx
  on public.intercompany_transactions (source_company_id, target_company_id, transaction_date desc);

create table if not exists public.company_events (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  event_type text not null,
  title text not null,
  description text,
  linked_module text,
  linked_record_id text,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  created_by uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists company_events_timeline_idx
  on public.company_events (company_id, occurred_at desc);

-- Add a company boundary to existing operational and intelligence tables.
do $$
declare
  table_name text;
  tenant_tables text[] := array[
    'vehicles',
    'orders',
    'quotes',
    'customers',
    'shipments',
    'logistics_partners',
    'order_timeline_events',
    'procurement_requests',
    'procurement_orders',
    'suppliers',
    'procurement_timeline',
    'finance_records',
    'documents',
    'vehicle_lifecycle_events',
    'shipment_events',
    'customer_contacts',
    'customer_notes',
    'company_snapshots',
    'strategic_scenarios',
    'ai_coo_tasks'
  ];
begin
  foreach table_name in array tenant_tables loop
    if to_regclass('public.' || table_name) is not null then
      execute format(
        'alter table public.%I add column if not exists company_id uuid references public.companies(id) on delete restrict',
        table_name
      );
      execute format(
        'update public.%I set company_id = public.velora_primary_company_id() where company_id is null',
        table_name
      );
      execute format(
        'alter table public.%I alter column company_id set default public.velora_primary_company_id()',
        table_name
      );
      execute format(
        'create index if not exists %I on public.%I (company_id)',
        table_name || '_company_id_idx',
        table_name
      );
      execute format('alter table public.%I enable row level security', table_name);

      -- A permissive membership policy ensures tables without an older policy
      -- remain usable. The restrictive policy forms an AND boundary underneath
      -- every existing role policy, preventing cross-company access.
      execute format('drop policy if exists %I on public.%I', 'Tenant member access', table_name);
      execute format(
        'create policy %I on public.%I as permissive for all to authenticated using (public.is_company_member(company_id)) with check (public.is_company_member(company_id))',
        'Tenant member access',
        table_name
      );
      execute format('drop policy if exists %I on public.%I', 'Tenant isolation boundary', table_name);
      execute format(
        'create policy %I on public.%I as restrictive for all to authenticated using (public.is_company_member(company_id)) with check (public.is_company_member(company_id))',
        'Tenant isolation boundary',
        table_name
      );
    end if;
  end loop;
end
$$;

do $$
begin
  if to_regclass('public.company_snapshots') is not null then
    drop index if exists public.company_snapshots_user_day_scope_key;
    create unique index if not exists company_snapshots_company_user_day_scope_key
      on public.company_snapshots (company_id, created_by, snapshot_date, access_scope)
      where company_id is not null;
  end if;
  if to_regclass('public.ai_coo_tasks') is not null then
    drop index if exists public.ai_coo_tasks_owner_scope_source_key;
    create unique index if not exists ai_coo_tasks_company_owner_scope_source_key
      on public.ai_coo_tasks (company_id, created_by, access_scope, source_key)
      where company_id is not null;
  end if;
end
$$;

alter table public.companies enable row level security;
alter table public.company_memberships enable row level security;
alter table public.ecosystem_relationships enable row level security;
alter table public.intercompany_transactions enable row level security;
alter table public.company_events enable row level security;

drop policy if exists "Members can read accessible companies" on public.companies;
create policy "Members can read accessible companies"
  on public.companies for select to authenticated
  using (public.is_company_member(id));

drop policy if exists "Executives can create companies" on public.companies;
create policy "Executives can create companies"
  on public.companies for insert to authenticated
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
        and role in ('CEO', 'Company Manager')
    )
  );

drop policy if exists "Company admins can update companies" on public.companies;
create policy "Company admins can update companies"
  on public.companies for update to authenticated
  using (public.can_manage_company(id))
  with check (public.can_manage_company(id));

drop policy if exists "Members can read their memberships" on public.company_memberships;
create policy "Members can read their memberships"
  on public.company_memberships for select to authenticated
  using (
    user_id = auth.uid()
    or public.can_manage_company(company_id)
  );

drop policy if exists "Company admins can manage memberships" on public.company_memberships;
create policy "Company admins can manage memberships"
  on public.company_memberships for all to authenticated
  using (public.can_manage_company(company_id))
  with check (public.can_manage_company(company_id));

drop policy if exists "Members can read ecosystem relationships" on public.ecosystem_relationships;
create policy "Members can read ecosystem relationships"
  on public.ecosystem_relationships for select to authenticated
  using (
    public.is_company_member(source_company_id)
    or public.is_company_member(target_company_id)
  );

drop policy if exists "Company admins can manage relationships" on public.ecosystem_relationships;
create policy "Company admins can manage relationships"
  on public.ecosystem_relationships for all to authenticated
  using (public.can_manage_company(source_company_id))
  with check (public.can_manage_company(source_company_id));

drop policy if exists "Members can read intercompany transactions" on public.intercompany_transactions;
create policy "Members can read intercompany transactions"
  on public.intercompany_transactions for select to authenticated
  using (
    public.is_company_member(source_company_id)
    or public.is_company_member(target_company_id)
  );

drop policy if exists "Company admins can manage intercompany transactions" on public.intercompany_transactions;
create policy "Company admins can manage intercompany transactions"
  on public.intercompany_transactions for all to authenticated
  using (public.can_manage_company(source_company_id))
  with check (public.can_manage_company(source_company_id));

drop policy if exists "Members can read company events" on public.company_events;
create policy "Members can read company events"
  on public.company_events for select to authenticated
  using (public.is_company_member(company_id));

drop policy if exists "Company members can create events" on public.company_events;
create policy "Company members can create events"
  on public.company_events for insert to authenticated
  with check (public.is_company_member(company_id));

grant select, insert, update on public.companies to authenticated;
grant select, insert, update on public.company_memberships to authenticated;
grant select, insert, update on public.ecosystem_relationships to authenticated;
grant select, insert, update on public.intercompany_transactions to authenticated;
grant select, insert on public.company_events to authenticated;

comment on table public.companies is
  'Top-level Velora OS tenants: internal companies, partner companies, and future portal organizations.';

comment on table public.company_memberships is
  'User access boundary for companies. External portal accounts can be introduced through memberships later.';

comment on table public.ecosystem_relationships is
  'Scored customer, supplier, logistics, finance, affiliate, and strategic relationships across the ecosystem.';

comment on table public.intercompany_transactions is
  'Explicit cross-company commercial and operational activity without modifying source operational records.';
