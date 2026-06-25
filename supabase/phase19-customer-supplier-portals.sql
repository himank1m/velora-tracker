-- VELOLA OS PHASE 19 - CUSTOMER & SUPPLIER PORTALS
-- Safe, idempotent migration. No destructive statements.

create extension if not exists pgcrypto;

create table if not exists public.portal_users (
  id uuid primary key default gen_random_uuid(),
  company_id uuid,
  portal_type text not null default 'Customer',
  display_name text not null,
  email text not null,
  linked_record_id uuid,
  status text not null default 'Pending Setup',
  last_login_at timestamp with time zone,
  notes text,
  created_by uuid,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create table if not exists public.portal_notices (
  id uuid primary key default gen_random_uuid(),
  company_id uuid,
  portal_type text not null default 'Customer',
  linked_record_id uuid,
  title text not null,
  message text not null,
  notice_type text not null default 'General Notice',
  priority text not null default 'Medium',
  created_by uuid,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create table if not exists public.portal_activity (
  id uuid primary key default gen_random_uuid(),
  company_id uuid,
  portal_type text not null default 'Customer',
  portal_user_id uuid,
  linked_record_id uuid,
  activity_type text not null default 'Viewed Item',
  title text not null,
  detail text,
  created_by uuid,
  created_at timestamp with time zone not null default now()
);

create table if not exists public.portal_shared_documents (
  id uuid primary key default gen_random_uuid(),
  company_id uuid,
  portal_type text not null default 'Customer',
  linked_record_id uuid,
  document_id uuid,
  access_level text not null default 'View',
  shared_by uuid,
  created_at timestamp with time zone not null default now()
);

create table if not exists public.portal_access_rules (
  id uuid primary key default gen_random_uuid(),
  company_id uuid,
  portal_type text not null default 'Customer',
  rule_name text not null,
  module_name text not null,
  access_scope text not null default 'Linked Records Only',
  enabled boolean not null default true,
  created_by uuid,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

alter table public.portal_users add column if not exists company_id uuid;
alter table public.portal_users add column if not exists portal_type text not null default 'Customer';
alter table public.portal_users add column if not exists display_name text;
alter table public.portal_users add column if not exists email text;
alter table public.portal_users add column if not exists linked_record_id uuid;
alter table public.portal_users add column if not exists status text not null default 'Pending Setup';
alter table public.portal_users add column if not exists last_login_at timestamp with time zone;
alter table public.portal_users add column if not exists notes text;
alter table public.portal_users add column if not exists created_by uuid;
alter table public.portal_users add column if not exists created_at timestamp with time zone not null default now();
alter table public.portal_users add column if not exists updated_at timestamp with time zone not null default now();

alter table public.portal_notices add column if not exists company_id uuid;
alter table public.portal_notices add column if not exists portal_type text not null default 'Customer';
alter table public.portal_notices add column if not exists linked_record_id uuid;
alter table public.portal_notices add column if not exists title text;
alter table public.portal_notices add column if not exists message text;
alter table public.portal_notices add column if not exists notice_type text not null default 'General Notice';
alter table public.portal_notices add column if not exists priority text not null default 'Medium';
alter table public.portal_notices add column if not exists created_by uuid;
alter table public.portal_notices add column if not exists created_at timestamp with time zone not null default now();
alter table public.portal_notices add column if not exists updated_at timestamp with time zone not null default now();

alter table public.portal_activity add column if not exists company_id uuid;
alter table public.portal_activity add column if not exists portal_type text not null default 'Customer';
alter table public.portal_activity add column if not exists portal_user_id uuid;
alter table public.portal_activity add column if not exists linked_record_id uuid;
alter table public.portal_activity add column if not exists activity_type text not null default 'Viewed Item';
alter table public.portal_activity add column if not exists title text;
alter table public.portal_activity add column if not exists detail text;
alter table public.portal_activity add column if not exists created_by uuid;
alter table public.portal_activity add column if not exists created_at timestamp with time zone not null default now();

alter table public.portal_shared_documents add column if not exists company_id uuid;
alter table public.portal_shared_documents add column if not exists portal_type text not null default 'Customer';
alter table public.portal_shared_documents add column if not exists linked_record_id uuid;
alter table public.portal_shared_documents add column if not exists document_id uuid;
alter table public.portal_shared_documents add column if not exists access_level text not null default 'View';
alter table public.portal_shared_documents add column if not exists shared_by uuid;
alter table public.portal_shared_documents add column if not exists created_at timestamp with time zone not null default now();

alter table public.portal_access_rules add column if not exists company_id uuid;
alter table public.portal_access_rules add column if not exists portal_type text not null default 'Customer';
alter table public.portal_access_rules add column if not exists rule_name text;
alter table public.portal_access_rules add column if not exists module_name text;
alter table public.portal_access_rules add column if not exists access_scope text not null default 'Linked Records Only';
alter table public.portal_access_rules add column if not exists enabled boolean not null default true;
alter table public.portal_access_rules add column if not exists created_by uuid;
alter table public.portal_access_rules add column if not exists created_at timestamp with time zone not null default now();
alter table public.portal_access_rules add column if not exists updated_at timestamp with time zone not null default now();

create index if not exists idx_portal_users_company on public.portal_users(company_id);
create index if not exists idx_portal_users_type on public.portal_users(portal_type);
create index if not exists idx_portal_users_linked_record on public.portal_users(linked_record_id);
create index if not exists idx_portal_notices_type on public.portal_notices(portal_type);
create index if not exists idx_portal_notices_linked_record on public.portal_notices(linked_record_id);
create index if not exists idx_portal_activity_created_at on public.portal_activity(created_at desc);
create index if not exists idx_portal_activity_user on public.portal_activity(portal_user_id);
create index if not exists idx_portal_shared_documents_record on public.portal_shared_documents(linked_record_id);
create index if not exists idx_portal_access_rules_type on public.portal_access_rules(portal_type);

create or replace function public.velora_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_portal_users_updated_at on public.portal_users;
create trigger trg_portal_users_updated_at before update on public.portal_users
for each row execute function public.velora_touch_updated_at();

drop trigger if exists trg_portal_notices_updated_at on public.portal_notices;
create trigger trg_portal_notices_updated_at before update on public.portal_notices
for each row execute function public.velora_touch_updated_at();

drop trigger if exists trg_portal_access_rules_updated_at on public.portal_access_rules;
create trigger trg_portal_access_rules_updated_at before update on public.portal_access_rules
for each row execute function public.velora_touch_updated_at();

alter table public.portal_users enable row level security;
alter table public.portal_notices enable row level security;
alter table public.portal_activity enable row level security;
alter table public.portal_shared_documents enable row level security;
alter table public.portal_access_rules enable row level security;

drop policy if exists "portal_users_select_authenticated" on public.portal_users;
create policy "portal_users_select_authenticated" on public.portal_users for select to authenticated using (true);
drop policy if exists "portal_users_insert_authenticated" on public.portal_users;
create policy "portal_users_insert_authenticated" on public.portal_users for insert to authenticated with check (auth.uid() is not null);
drop policy if exists "portal_users_update_creator" on public.portal_users;
create policy "portal_users_update_creator" on public.portal_users for update to authenticated using (created_by = auth.uid() or created_by is null) with check (created_by = auth.uid() or created_by is null);

drop policy if exists "portal_notices_select_authenticated" on public.portal_notices;
create policy "portal_notices_select_authenticated" on public.portal_notices for select to authenticated using (true);
drop policy if exists "portal_notices_insert_authenticated" on public.portal_notices;
create policy "portal_notices_insert_authenticated" on public.portal_notices for insert to authenticated with check (auth.uid() is not null);

drop policy if exists "portal_activity_select_authenticated" on public.portal_activity;
create policy "portal_activity_select_authenticated" on public.portal_activity for select to authenticated using (true);
drop policy if exists "portal_activity_insert_authenticated" on public.portal_activity;
create policy "portal_activity_insert_authenticated" on public.portal_activity for insert to authenticated with check (auth.uid() is not null);

drop policy if exists "portal_shared_documents_select_authenticated" on public.portal_shared_documents;
create policy "portal_shared_documents_select_authenticated" on public.portal_shared_documents for select to authenticated using (true);
drop policy if exists "portal_shared_documents_insert_authenticated" on public.portal_shared_documents;
create policy "portal_shared_documents_insert_authenticated" on public.portal_shared_documents for insert to authenticated with check (auth.uid() is not null);

drop policy if exists "portal_access_rules_select_authenticated" on public.portal_access_rules;
create policy "portal_access_rules_select_authenticated" on public.portal_access_rules for select to authenticated using (true);
drop policy if exists "portal_access_rules_insert_authenticated" on public.portal_access_rules;
create policy "portal_access_rules_insert_authenticated" on public.portal_access_rules for insert to authenticated with check (auth.uid() is not null);

grant select, insert, update on public.portal_users to authenticated;
grant select, insert on public.portal_notices to authenticated;
grant select, insert on public.portal_activity to authenticated;
grant select, insert on public.portal_shared_documents to authenticated;
grant select, insert on public.portal_access_rules to authenticated;
