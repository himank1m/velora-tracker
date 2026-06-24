-- Velora OS Phase 10 - Productization, onboarding, team invite, and release metadata
-- Safe and idempotent. No destructive operations.
-- Run after Phase 8/9 migrations for company-aware persistence.

create extension if not exists pgcrypto;

create table if not exists public.workspace_onboarding (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  checklist jsonb not null default '[]'::jsonb,
  sample_data_mode text not null default 'Not enabled',
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, user_id)
);

create table if not exists public.team_invite_drafts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  email text not null,
  role text not null default 'Inventory Manager',
  note text,
  status text not null default 'Draft'
    check (status in ('Draft', 'Ready', 'Sent Manually', 'Cancelled')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.product_release_notes (
  id uuid primary key default gen_random_uuid(),
  version text not null unique,
  title text not null,
  notes jsonb not null default '[]'::jsonb,
  release_date date not null default current_date,
  channel text not null default 'Product readiness',
  created_at timestamptz not null default now()
);

create table if not exists public.product_tour_progress (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  module_name text not null,
  completed boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, user_id, module_name)
);

create index if not exists workspace_onboarding_company_idx
  on public.workspace_onboarding(company_id, user_id);

create index if not exists team_invite_drafts_company_idx
  on public.team_invite_drafts(company_id, created_at desc);

create index if not exists product_tour_progress_user_idx
  on public.product_tour_progress(user_id, company_id);

alter table public.workspace_onboarding enable row level security;
alter table public.team_invite_drafts enable row level security;
alter table public.product_release_notes enable row level security;
alter table public.product_tour_progress enable row level security;

drop policy if exists "Users can manage own onboarding" on public.workspace_onboarding;
create policy "Users can manage own onboarding"
on public.workspace_onboarding
for all
using (
  user_id = auth.uid()
  and (company_id is null or public.is_company_member(company_id))
)
with check (
  user_id = auth.uid()
  and (company_id is null or public.is_company_member(company_id))
);

drop policy if exists "Managers can manage invite drafts" on public.team_invite_drafts;
create policy "Managers can manage invite drafts"
on public.team_invite_drafts
for all
using (
  (company_id is null or public.is_company_member(company_id))
  and exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
      and profiles.role in ('CEO', 'Company Manager')
  )
)
with check (
  (company_id is null or public.is_company_member(company_id))
  and exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
      and profiles.role in ('CEO', 'Company Manager')
  )
);

drop policy if exists "Authenticated users can read release notes" on public.product_release_notes;
create policy "Authenticated users can read release notes"
on public.product_release_notes
for select
using (auth.role() = 'authenticated');

drop policy if exists "Users can manage own tour progress" on public.product_tour_progress;
create policy "Users can manage own tour progress"
on public.product_tour_progress
for all
using (
  user_id = auth.uid()
  and (company_id is null or public.is_company_member(company_id))
)
with check (
  user_id = auth.uid()
  and (company_id is null or public.is_company_member(company_id))
);

insert into public.product_release_notes (version, title, notes, channel)
values (
  '1.0.0',
  'Velora OS product readiness',
  '["Product landing and showcase mode","Onboarding and tour foundations","Launch readiness, backup, settings, notification, documentation, and ecosystem hardening"]'::jsonb,
  'Product readiness'
)
on conflict (version) do nothing;
