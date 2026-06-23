-- Velora OS Phase 5: Time Machine
-- Safe, additive, and idempotent. This migration does not alter operational records.

create extension if not exists pgcrypto;

create table if not exists public.company_snapshots (
  id uuid primary key default gen_random_uuid(),
  snapshot_date date not null,
  schema_version integer not null default 1,
  state jsonb not null default '{}'::jsonb,
  metrics jsonb not null default '{}'::jsonb,
  record_counts jsonb not null default '{}'::jsonb,
  created_by uuid not null default auth.uid() references auth.users(id) on delete cascade,
  access_scope text not null,
  created_at timestamptz not null default now()
);

alter table public.company_snapshots
  add column if not exists snapshot_date date;

alter table public.company_snapshots
  add column if not exists schema_version integer default 1;

alter table public.company_snapshots
  add column if not exists state jsonb default '{}'::jsonb;

alter table public.company_snapshots
  add column if not exists metrics jsonb default '{}'::jsonb;

alter table public.company_snapshots
  add column if not exists record_counts jsonb default '{}'::jsonb;

alter table public.company_snapshots
  add column if not exists created_by uuid default auth.uid() references auth.users(id) on delete cascade;

alter table public.company_snapshots
  add column if not exists access_scope text;

alter table public.company_snapshots
  add column if not exists created_at timestamptz default now();

create unique index if not exists company_snapshots_user_day_scope_key
  on public.company_snapshots (created_by, snapshot_date, access_scope);

create index if not exists company_snapshots_snapshot_date_idx
  on public.company_snapshots (snapshot_date desc);

create index if not exists company_snapshots_created_by_idx
  on public.company_snapshots (created_by, created_at desc);

alter table public.company_snapshots enable row level security;

drop policy if exists "Users can read their company snapshots" on public.company_snapshots;
create policy "Users can read their company snapshots"
  on public.company_snapshots
  for select
  to authenticated
  using (
    created_by = auth.uid()
    and exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
        and profiles.role = company_snapshots.access_scope
    )
  );

drop policy if exists "Users can create their company snapshots" on public.company_snapshots;
create policy "Users can create their company snapshots"
  on public.company_snapshots
  for insert
  to authenticated
  with check (
    created_by = auth.uid()
    and exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
        and profiles.role = company_snapshots.access_scope
    )
  );

drop policy if exists "Users can refresh their company snapshots" on public.company_snapshots;
create policy "Users can refresh their company snapshots"
  on public.company_snapshots
  for update
  to authenticated
  using (
    created_by = auth.uid()
    and exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
        and profiles.role = company_snapshots.access_scope
    )
  )
  with check (
    created_by = auth.uid()
    and exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
        and profiles.role = company_snapshots.access_scope
    )
  );

grant select, insert, update on public.company_snapshots to authenticated;

comment on table public.company_snapshots is
  'Compact, permission-scoped daily company states used by Velora OS Time Machine.';

comment on column public.company_snapshots.state is
  'Operational state available to the creating user at the end of the snapshot day.';

comment on column public.company_snapshots.metrics is
  'Precomputed historical KPIs and company health factors for fast comparisons.';

comment on column public.company_snapshots.access_scope is
  'The RBAC role active when the snapshot was captured; RLS requires the current role to match.';
