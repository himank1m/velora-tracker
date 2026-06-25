-- Velora OS Phase 20 - Ecosystem Marketplace
-- Safe, additive migration. No drops, truncates, or destructive renames.

create extension if not exists pgcrypto;

create table if not exists public.marketplace_companies (
  id uuid primary key default gen_random_uuid(),
  owner_company_id text,
  name text not null,
  logo text,
  company_type text not null default 'Supplier',
  industry text default 'Automotive',
  description text,
  services text,
  country text,
  region text,
  contact_name text,
  contact_email text,
  contact_phone text,
  status text default 'Prospect',
  rating numeric default 0,
  views integer default 0,
  created_by uuid,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.marketplace_companies add column if not exists owner_company_id text;
alter table public.marketplace_companies add column if not exists logo text;
alter table public.marketplace_companies add column if not exists company_type text not null default 'Supplier';
alter table public.marketplace_companies add column if not exists industry text default 'Automotive';
alter table public.marketplace_companies add column if not exists description text;
alter table public.marketplace_companies add column if not exists services text;
alter table public.marketplace_companies add column if not exists country text;
alter table public.marketplace_companies add column if not exists region text;
alter table public.marketplace_companies add column if not exists contact_name text;
alter table public.marketplace_companies add column if not exists contact_email text;
alter table public.marketplace_companies add column if not exists contact_phone text;
alter table public.marketplace_companies add column if not exists status text default 'Prospect';
alter table public.marketplace_companies add column if not exists rating numeric default 0;
alter table public.marketplace_companies add column if not exists views integer default 0;
alter table public.marketplace_companies add column if not exists created_by uuid;
alter table public.marketplace_companies add column if not exists created_at timestamptz default now();
alter table public.marketplace_companies add column if not exists updated_at timestamptz default now();

create table if not exists public.marketplace_opportunities (
  id uuid primary key default gen_random_uuid(),
  owner_company_id text,
  title text not null,
  opportunity_type text default 'Partnership Opportunity',
  description text,
  region text,
  industry text,
  service_type text,
  budget_range text,
  status text default 'Open',
  priority text default 'Medium',
  posted_by text,
  views integer default 0,
  created_by uuid,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.marketplace_opportunities add column if not exists owner_company_id text;
alter table public.marketplace_opportunities add column if not exists opportunity_type text default 'Partnership Opportunity';
alter table public.marketplace_opportunities add column if not exists description text;
alter table public.marketplace_opportunities add column if not exists region text;
alter table public.marketplace_opportunities add column if not exists industry text;
alter table public.marketplace_opportunities add column if not exists service_type text;
alter table public.marketplace_opportunities add column if not exists budget_range text;
alter table public.marketplace_opportunities add column if not exists status text default 'Open';
alter table public.marketplace_opportunities add column if not exists priority text default 'Medium';
alter table public.marketplace_opportunities add column if not exists posted_by text;
alter table public.marketplace_opportunities add column if not exists views integer default 0;
alter table public.marketplace_opportunities add column if not exists created_by uuid;
alter table public.marketplace_opportunities add column if not exists created_at timestamptz default now();
alter table public.marketplace_opportunities add column if not exists updated_at timestamptz default now();

create table if not exists public.marketplace_relationships (
  id uuid primary key default gen_random_uuid(),
  owner_company_id text,
  source_company_id text,
  target_company_id text,
  relationship_type text default 'Potential Relationship',
  status text default 'Prospect',
  strategic_value text default 'Medium',
  notes text,
  created_by uuid,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.marketplace_relationships add column if not exists owner_company_id text;
alter table public.marketplace_relationships add column if not exists source_company_id text;
alter table public.marketplace_relationships add column if not exists target_company_id text;
alter table public.marketplace_relationships add column if not exists relationship_type text default 'Potential Relationship';
alter table public.marketplace_relationships add column if not exists status text default 'Prospect';
alter table public.marketplace_relationships add column if not exists strategic_value text default 'Medium';
alter table public.marketplace_relationships add column if not exists notes text;
alter table public.marketplace_relationships add column if not exists created_by uuid;
alter table public.marketplace_relationships add column if not exists created_at timestamptz default now();
alter table public.marketplace_relationships add column if not exists updated_at timestamptz default now();

create table if not exists public.marketplace_activity (
  id uuid primary key default gen_random_uuid(),
  owner_company_id text,
  activity_type text default 'Marketplace',
  title text not null,
  detail text,
  linked_record_id text,
  created_by uuid,
  created_at timestamptz default now()
);

alter table public.marketplace_activity add column if not exists owner_company_id text;
alter table public.marketplace_activity add column if not exists activity_type text default 'Marketplace';
alter table public.marketplace_activity add column if not exists detail text;
alter table public.marketplace_activity add column if not exists linked_record_id text;
alter table public.marketplace_activity add column if not exists created_by uuid;
alter table public.marketplace_activity add column if not exists created_at timestamptz default now();

create table if not exists public.marketplace_notifications (
  id uuid primary key default gen_random_uuid(),
  owner_company_id text,
  notification_type text default 'Marketplace',
  title text not null,
  message text,
  priority text default 'Medium',
  resolved boolean default false,
  linked_record_id text,
  created_by uuid,
  created_at timestamptz default now()
);

alter table public.marketplace_notifications add column if not exists owner_company_id text;
alter table public.marketplace_notifications add column if not exists notification_type text default 'Marketplace';
alter table public.marketplace_notifications add column if not exists message text;
alter table public.marketplace_notifications add column if not exists priority text default 'Medium';
alter table public.marketplace_notifications add column if not exists resolved boolean default false;
alter table public.marketplace_notifications add column if not exists linked_record_id text;
alter table public.marketplace_notifications add column if not exists created_by uuid;
alter table public.marketplace_notifications add column if not exists created_at timestamptz default now();

create index if not exists idx_marketplace_companies_owner on public.marketplace_companies(owner_company_id);
create index if not exists idx_marketplace_companies_type on public.marketplace_companies(company_type);
create index if not exists idx_marketplace_companies_industry on public.marketplace_companies(industry);
create index if not exists idx_marketplace_companies_region on public.marketplace_companies(region);
create index if not exists idx_marketplace_companies_status on public.marketplace_companies(status);

create index if not exists idx_marketplace_opportunities_owner on public.marketplace_opportunities(owner_company_id);
create index if not exists idx_marketplace_opportunities_type on public.marketplace_opportunities(opportunity_type);
create index if not exists idx_marketplace_opportunities_status on public.marketplace_opportunities(status);
create index if not exists idx_marketplace_opportunities_region on public.marketplace_opportunities(region);

create index if not exists idx_marketplace_relationships_owner on public.marketplace_relationships(owner_company_id);
create index if not exists idx_marketplace_relationships_source on public.marketplace_relationships(source_company_id);
create index if not exists idx_marketplace_relationships_target on public.marketplace_relationships(target_company_id);
create index if not exists idx_marketplace_relationships_type on public.marketplace_relationships(relationship_type);

create index if not exists idx_marketplace_activity_owner on public.marketplace_activity(owner_company_id);
create index if not exists idx_marketplace_activity_created_at on public.marketplace_activity(created_at desc);

create index if not exists idx_marketplace_notifications_owner on public.marketplace_notifications(owner_company_id);
create index if not exists idx_marketplace_notifications_resolved on public.marketplace_notifications(resolved);

create or replace function public.touch_marketplace_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_marketplace_companies_updated_at on public.marketplace_companies;
create trigger trg_marketplace_companies_updated_at
before update on public.marketplace_companies
for each row execute function public.touch_marketplace_updated_at();

drop trigger if exists trg_marketplace_opportunities_updated_at on public.marketplace_opportunities;
create trigger trg_marketplace_opportunities_updated_at
before update on public.marketplace_opportunities
for each row execute function public.touch_marketplace_updated_at();

drop trigger if exists trg_marketplace_relationships_updated_at on public.marketplace_relationships;
create trigger trg_marketplace_relationships_updated_at
before update on public.marketplace_relationships
for each row execute function public.touch_marketplace_updated_at();

alter table public.marketplace_companies enable row level security;
alter table public.marketplace_opportunities enable row level security;
alter table public.marketplace_relationships enable row level security;
alter table public.marketplace_activity enable row level security;
alter table public.marketplace_notifications enable row level security;

drop policy if exists "marketplace_companies_select_authenticated" on public.marketplace_companies;
create policy "marketplace_companies_select_authenticated"
on public.marketplace_companies for select
to authenticated
using (true);

drop policy if exists "marketplace_companies_insert_authenticated" on public.marketplace_companies;
create policy "marketplace_companies_insert_authenticated"
on public.marketplace_companies for insert
to authenticated
with check (auth.uid() = created_by or created_by is null);

drop policy if exists "marketplace_companies_update_owner_or_management" on public.marketplace_companies;
create policy "marketplace_companies_update_owner_or_management"
on public.marketplace_companies for update
to authenticated
using (
  auth.uid() = created_by
  or exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role in ('CEO', 'Company Manager')
  )
)
with check (
  auth.uid() = created_by
  or exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role in ('CEO', 'Company Manager')
  )
);

drop policy if exists "marketplace_opportunities_select_authenticated" on public.marketplace_opportunities;
create policy "marketplace_opportunities_select_authenticated"
on public.marketplace_opportunities for select
to authenticated
using (true);

drop policy if exists "marketplace_opportunities_insert_authenticated" on public.marketplace_opportunities;
create policy "marketplace_opportunities_insert_authenticated"
on public.marketplace_opportunities for insert
to authenticated
with check (auth.uid() = created_by or created_by is null);

drop policy if exists "marketplace_opportunities_update_owner_or_management" on public.marketplace_opportunities;
create policy "marketplace_opportunities_update_owner_or_management"
on public.marketplace_opportunities for update
to authenticated
using (
  auth.uid() = created_by
  or exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role in ('CEO', 'Company Manager')
  )
)
with check (
  auth.uid() = created_by
  or exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role in ('CEO', 'Company Manager')
  )
);

drop policy if exists "marketplace_relationships_select_authenticated" on public.marketplace_relationships;
create policy "marketplace_relationships_select_authenticated"
on public.marketplace_relationships for select
to authenticated
using (true);

drop policy if exists "marketplace_relationships_insert_authenticated" on public.marketplace_relationships;
create policy "marketplace_relationships_insert_authenticated"
on public.marketplace_relationships for insert
to authenticated
with check (auth.uid() = created_by or created_by is null);

drop policy if exists "marketplace_relationships_update_owner_or_management" on public.marketplace_relationships;
create policy "marketplace_relationships_update_owner_or_management"
on public.marketplace_relationships for update
to authenticated
using (
  auth.uid() = created_by
  or exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role in ('CEO', 'Company Manager')
  )
)
with check (
  auth.uid() = created_by
  or exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role in ('CEO', 'Company Manager')
  )
);

drop policy if exists "marketplace_activity_select_authenticated" on public.marketplace_activity;
create policy "marketplace_activity_select_authenticated"
on public.marketplace_activity for select
to authenticated
using (true);

drop policy if exists "marketplace_activity_insert_authenticated" on public.marketplace_activity;
create policy "marketplace_activity_insert_authenticated"
on public.marketplace_activity for insert
to authenticated
with check (auth.uid() = created_by or created_by is null);

drop policy if exists "marketplace_notifications_select_authenticated" on public.marketplace_notifications;
create policy "marketplace_notifications_select_authenticated"
on public.marketplace_notifications for select
to authenticated
using (true);

drop policy if exists "marketplace_notifications_insert_authenticated" on public.marketplace_notifications;
create policy "marketplace_notifications_insert_authenticated"
on public.marketplace_notifications for insert
to authenticated
with check (auth.uid() = created_by or created_by is null);

drop policy if exists "marketplace_notifications_update_owner_or_management" on public.marketplace_notifications;
create policy "marketplace_notifications_update_owner_or_management"
on public.marketplace_notifications for update
to authenticated
using (
  auth.uid() = created_by
  or exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role in ('CEO', 'Company Manager')
  )
)
with check (
  auth.uid() = created_by
  or exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role in ('CEO', 'Company Manager')
  )
);

grant select, insert, update on public.marketplace_companies to authenticated;
grant select, insert, update on public.marketplace_opportunities to authenticated;
grant select, insert, update on public.marketplace_relationships to authenticated;
grant select, insert on public.marketplace_activity to authenticated;
grant select, insert, update on public.marketplace_notifications to authenticated;
