-- Velora OS Phase 6: Strategic War Room
-- Safe, additive, and idempotent. Operational company records are never modified.

create extension if not exists pgcrypto;

create table if not exists public.strategic_scenarios (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  horizon text not null default 'Monthly',
  assumptions jsonb not null default '{}'::jsonb,
  results jsonb not null default '{}'::jsonb,
  status text not null default 'Active',
  access_scope text not null,
  created_by uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.strategic_scenarios
  add column if not exists name text;

alter table public.strategic_scenarios
  add column if not exists description text default '';

alter table public.strategic_scenarios
  add column if not exists horizon text default 'Monthly';

alter table public.strategic_scenarios
  add column if not exists assumptions jsonb default '{}'::jsonb;

alter table public.strategic_scenarios
  add column if not exists results jsonb default '{}'::jsonb;

alter table public.strategic_scenarios
  add column if not exists status text default 'Active';

alter table public.strategic_scenarios
  add column if not exists access_scope text;

alter table public.strategic_scenarios
  add column if not exists created_by uuid default auth.uid() references auth.users(id) on delete cascade;

alter table public.strategic_scenarios
  add column if not exists created_at timestamptz default now();

alter table public.strategic_scenarios
  add column if not exists updated_at timestamptz default now();

create index if not exists strategic_scenarios_owner_scope_idx
  on public.strategic_scenarios (created_by, access_scope, updated_at desc);

create index if not exists strategic_scenarios_status_idx
  on public.strategic_scenarios (status, updated_at desc);

alter table public.strategic_scenarios enable row level security;

drop policy if exists "Users can read their scoped strategic scenarios" on public.strategic_scenarios;
create policy "Users can read their scoped strategic scenarios"
  on public.strategic_scenarios
  for select
  to authenticated
  using (
    created_by = auth.uid()
    and exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
        and profiles.role = strategic_scenarios.access_scope
    )
  );

drop policy if exists "Users can create scoped strategic scenarios" on public.strategic_scenarios;
create policy "Users can create scoped strategic scenarios"
  on public.strategic_scenarios
  for insert
  to authenticated
  with check (
    created_by = auth.uid()
    and exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
        and profiles.role = strategic_scenarios.access_scope
    )
  );

drop policy if exists "Users can update their scoped strategic scenarios" on public.strategic_scenarios;
create policy "Users can update their scoped strategic scenarios"
  on public.strategic_scenarios
  for update
  to authenticated
  using (
    created_by = auth.uid()
    and exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
        and profiles.role = strategic_scenarios.access_scope
    )
  )
  with check (
    created_by = auth.uid()
    and exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
        and profiles.role = strategic_scenarios.access_scope
    )
  );

grant select, insert, update on public.strategic_scenarios to authenticated;

comment on table public.strategic_scenarios is
  'Role-scoped future business simulations created in the Velora OS Strategic War Room.';

comment on column public.strategic_scenarios.assumptions is
  'Explicit user-controlled simulation variables; never applied to live operational records.';

comment on column public.strategic_scenarios.results is
  'Cached deterministic projection output for auditability and cross-device review.';

