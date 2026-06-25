-- VELOLA OS PHASE 15 - MULTI-SERVER NETWORK & INFRASTRUCTURE UNIVERSE
-- Safe, idempotent migration. No destructive statements.

create extension if not exists pgcrypto;

create table if not exists public.server_links (
  id uuid primary key default gen_random_uuid(),
  source_server_id uuid,
  target_server_id uuid,
  link_type text not null default 'Sync',
  status text not null default 'Online',
  latency_ms integer not null default 0,
  notes text,
  created_by uuid,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create table if not exists public.server_groups (
  id uuid primary key default gen_random_uuid(),
  group_name text not null,
  group_type text not null default 'Production Cluster',
  region text default 'Global',
  environment text not null default 'Production',
  server_ids uuid[] not null default '{}',
  notes text,
  created_by uuid,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create table if not exists public.server_status_history (
  id uuid primary key default gen_random_uuid(),
  server_id uuid,
  status text not null default 'Unknown',
  response_time_ms integer not null default 0,
  uptime_percentage numeric not null default 0,
  error_count integer not null default 0,
  checked_at timestamp with time zone not null default now(),
  notes text,
  created_by uuid,
  created_at timestamp with time zone not null default now()
);

create table if not exists public.network_incidents (
  id uuid primary key default gen_random_uuid(),
  incident_type text not null default 'Infrastructure',
  severity text not null default 'Medium',
  title text not null,
  message text,
  linked_server_id uuid,
  linked_group_id uuid,
  resolved boolean not null default false,
  created_by uuid,
  created_at timestamp with time zone not null default now(),
  resolved_at timestamp with time zone
);

alter table public.server_links add column if not exists source_server_id uuid;
alter table public.server_links add column if not exists target_server_id uuid;
alter table public.server_links add column if not exists link_type text not null default 'Sync';
alter table public.server_links add column if not exists status text not null default 'Online';
alter table public.server_links add column if not exists latency_ms integer not null default 0;
alter table public.server_links add column if not exists notes text;
alter table public.server_links add column if not exists created_by uuid;
alter table public.server_links add column if not exists created_at timestamp with time zone not null default now();
alter table public.server_links add column if not exists updated_at timestamp with time zone not null default now();

alter table public.server_groups add column if not exists group_name text;
alter table public.server_groups add column if not exists group_type text not null default 'Production Cluster';
alter table public.server_groups add column if not exists region text default 'Global';
alter table public.server_groups add column if not exists environment text not null default 'Production';
alter table public.server_groups add column if not exists server_ids uuid[] not null default '{}';
alter table public.server_groups add column if not exists notes text;
alter table public.server_groups add column if not exists created_by uuid;
alter table public.server_groups add column if not exists created_at timestamp with time zone not null default now();
alter table public.server_groups add column if not exists updated_at timestamp with time zone not null default now();

alter table public.server_status_history add column if not exists server_id uuid;
alter table public.server_status_history add column if not exists status text not null default 'Unknown';
alter table public.server_status_history add column if not exists response_time_ms integer not null default 0;
alter table public.server_status_history add column if not exists uptime_percentage numeric not null default 0;
alter table public.server_status_history add column if not exists error_count integer not null default 0;
alter table public.server_status_history add column if not exists checked_at timestamp with time zone not null default now();
alter table public.server_status_history add column if not exists notes text;
alter table public.server_status_history add column if not exists created_by uuid;
alter table public.server_status_history add column if not exists created_at timestamp with time zone not null default now();

alter table public.network_incidents add column if not exists incident_type text not null default 'Infrastructure';
alter table public.network_incidents add column if not exists severity text not null default 'Medium';
alter table public.network_incidents add column if not exists title text;
alter table public.network_incidents add column if not exists message text;
alter table public.network_incidents add column if not exists linked_server_id uuid;
alter table public.network_incidents add column if not exists linked_group_id uuid;
alter table public.network_incidents add column if not exists resolved boolean not null default false;
alter table public.network_incidents add column if not exists created_by uuid;
alter table public.network_incidents add column if not exists created_at timestamp with time zone not null default now();
alter table public.network_incidents add column if not exists resolved_at timestamp with time zone;

create index if not exists idx_server_links_source on public.server_links(source_server_id);
create index if not exists idx_server_links_target on public.server_links(target_server_id);
create index if not exists idx_server_links_status on public.server_links(status);
create index if not exists idx_server_links_created_at on public.server_links(created_at desc);

create index if not exists idx_server_groups_region on public.server_groups(region);
create index if not exists idx_server_groups_environment on public.server_groups(environment);
create index if not exists idx_server_groups_created_at on public.server_groups(created_at desc);

create index if not exists idx_server_status_history_server on public.server_status_history(server_id);
create index if not exists idx_server_status_history_checked_at on public.server_status_history(checked_at desc);

create index if not exists idx_network_incidents_severity on public.network_incidents(severity);
create index if not exists idx_network_incidents_resolved on public.network_incidents(resolved);
create index if not exists idx_network_incidents_created_at on public.network_incidents(created_at desc);

create or replace function public.velora_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_server_links_updated_at on public.server_links;
create trigger trg_server_links_updated_at
before update on public.server_links
for each row execute function public.velora_touch_updated_at();

drop trigger if exists trg_server_groups_updated_at on public.server_groups;
create trigger trg_server_groups_updated_at
before update on public.server_groups
for each row execute function public.velora_touch_updated_at();

alter table public.server_links enable row level security;
alter table public.server_groups enable row level security;
alter table public.server_status_history enable row level security;
alter table public.network_incidents enable row level security;

drop policy if exists "server_links_select_authenticated" on public.server_links;
create policy "server_links_select_authenticated"
on public.server_links
for select
to authenticated
using (true);

drop policy if exists "server_links_insert_authenticated" on public.server_links;
create policy "server_links_insert_authenticated"
on public.server_links
for insert
to authenticated
with check (auth.uid() is not null);

drop policy if exists "server_links_update_creator" on public.server_links;
create policy "server_links_update_creator"
on public.server_links
for update
to authenticated
using (created_by = auth.uid() or created_by is null)
with check (created_by = auth.uid() or created_by is null);

drop policy if exists "server_groups_select_authenticated" on public.server_groups;
create policy "server_groups_select_authenticated"
on public.server_groups
for select
to authenticated
using (true);

drop policy if exists "server_groups_insert_authenticated" on public.server_groups;
create policy "server_groups_insert_authenticated"
on public.server_groups
for insert
to authenticated
with check (auth.uid() is not null);

drop policy if exists "server_groups_update_creator" on public.server_groups;
create policy "server_groups_update_creator"
on public.server_groups
for update
to authenticated
using (created_by = auth.uid() or created_by is null)
with check (created_by = auth.uid() or created_by is null);

drop policy if exists "server_status_history_select_authenticated" on public.server_status_history;
create policy "server_status_history_select_authenticated"
on public.server_status_history
for select
to authenticated
using (true);

drop policy if exists "server_status_history_insert_authenticated" on public.server_status_history;
create policy "server_status_history_insert_authenticated"
on public.server_status_history
for insert
to authenticated
with check (auth.uid() is not null);

drop policy if exists "network_incidents_select_authenticated" on public.network_incidents;
create policy "network_incidents_select_authenticated"
on public.network_incidents
for select
to authenticated
using (true);

drop policy if exists "network_incidents_insert_authenticated" on public.network_incidents;
create policy "network_incidents_insert_authenticated"
on public.network_incidents
for insert
to authenticated
with check (auth.uid() is not null);

drop policy if exists "network_incidents_update_creator" on public.network_incidents;
create policy "network_incidents_update_creator"
on public.network_incidents
for update
to authenticated
using (created_by = auth.uid() or created_by is null)
with check (created_by = auth.uid() or created_by is null);

grant select, insert, update on public.server_links to authenticated;
grant select, insert, update on public.server_groups to authenticated;
grant select, insert on public.server_status_history to authenticated;
grant select, insert, update on public.network_incidents to authenticated;
