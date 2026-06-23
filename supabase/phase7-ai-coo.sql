-- Velora OS Phase 7: AI COO
-- Safe, additive, and idempotent. This table tracks recommendations only.
-- It never writes to operational orders, inventory, shipments, procurement,
-- finance, customer, supplier, or document tables.

create extension if not exists pgcrypto;

create table if not exists public.ai_coo_tasks (
  id uuid primary key default gen_random_uuid(),
  source_key text not null,
  title text not null,
  description text not null default '',
  reason text not null default '',
  priority text not null default 'Planned',
  status text not null default 'Open',
  linked_module text not null default 'Command Center',
  linked_record_id text not null default '',
  expected_impact text not null default '',
  confidence jsonb not null default '{}'::jsonb,
  rank integer not null default 99,
  generated_on date not null default current_date,
  access_scope text not null,
  created_by uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.ai_coo_tasks
  add column if not exists source_key text;

alter table public.ai_coo_tasks
  add column if not exists title text;

alter table public.ai_coo_tasks
  add column if not exists description text default '';

alter table public.ai_coo_tasks
  add column if not exists reason text default '';

alter table public.ai_coo_tasks
  add column if not exists priority text default 'Planned';

alter table public.ai_coo_tasks
  add column if not exists status text default 'Open';

alter table public.ai_coo_tasks
  add column if not exists linked_module text default 'Command Center';

alter table public.ai_coo_tasks
  add column if not exists linked_record_id text default '';

alter table public.ai_coo_tasks
  add column if not exists expected_impact text default '';

alter table public.ai_coo_tasks
  add column if not exists confidence jsonb default '{}'::jsonb;

alter table public.ai_coo_tasks
  add column if not exists rank integer default 99;

alter table public.ai_coo_tasks
  add column if not exists generated_on date default current_date;

alter table public.ai_coo_tasks
  add column if not exists access_scope text;

alter table public.ai_coo_tasks
  add column if not exists created_by uuid default auth.uid() references auth.users(id) on delete cascade;

alter table public.ai_coo_tasks
  add column if not exists created_at timestamptz default now();

alter table public.ai_coo_tasks
  add column if not exists updated_at timestamptz default now();

create unique index if not exists ai_coo_tasks_owner_scope_source_key
  on public.ai_coo_tasks (created_by, access_scope, source_key);

create index if not exists ai_coo_tasks_priority_status_idx
  on public.ai_coo_tasks (created_by, access_scope, status, priority, rank);

alter table public.ai_coo_tasks enable row level security;

drop policy if exists "Users can read their scoped AI COO tasks" on public.ai_coo_tasks;
create policy "Users can read their scoped AI COO tasks"
  on public.ai_coo_tasks
  for select
  to authenticated
  using (
    created_by = auth.uid()
    and exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
        and profiles.role = ai_coo_tasks.access_scope
    )
  );

drop policy if exists "Users can create scoped AI COO tasks" on public.ai_coo_tasks;
create policy "Users can create scoped AI COO tasks"
  on public.ai_coo_tasks
  for insert
  to authenticated
  with check (
    created_by = auth.uid()
    and exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
        and profiles.role = ai_coo_tasks.access_scope
    )
  );

drop policy if exists "Users can update their scoped AI COO tasks" on public.ai_coo_tasks;
create policy "Users can update their scoped AI COO tasks"
  on public.ai_coo_tasks
  for update
  to authenticated
  using (
    created_by = auth.uid()
    and exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
        and profiles.role = ai_coo_tasks.access_scope
    )
  )
  with check (
    created_by = auth.uid()
    and exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
        and profiles.role = ai_coo_tasks.access_scope
    )
  );

grant select, insert, update on public.ai_coo_tasks to authenticated;

comment on table public.ai_coo_tasks is
  'Explainable, role-scoped AI COO recommendations and task progress. No autonomous operational execution.';

comment on column public.ai_coo_tasks.source_key is
  'Stable deterministic insight identifier used to refresh a recommendation without creating duplicates.';

comment on column public.ai_coo_tasks.confidence is
  'Structured confidence label and score generated from the available operational evidence.';

