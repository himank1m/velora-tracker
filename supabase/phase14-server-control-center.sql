-- Velora OS Phase 14: Infrastructure & Server Control Center
-- Safe, idempotent migration. No destructive operations.
-- Do not store API keys, passwords, service-role keys, or secrets in these tables.

create extension if not exists pgcrypto;

create table if not exists public.server_configurations (
  id uuid primary key default gen_random_uuid(),
  server_name text not null,
  server_type text not null default 'Regional',
  region text,
  environment text not null default 'Production',
  api_url text,
  database_reference text,
  storage_url text,
  status text not null default 'Unknown',
  response_time_ms integer default 0,
  uptime_percentage numeric default 0,
  last_checked_at timestamptz,
  error_message text,
  linked_services text[] default '{}',
  notes text,
  company_id uuid,
  created_by uuid,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.server_activity_logs (
  id uuid primary key default gen_random_uuid(),
  server_id uuid,
  activity_type text not null,
  title text not null,
  message text,
  severity text default 'Info',
  created_by uuid,
  created_at timestamptz default now()
);

create table if not exists public.infrastructure_alerts (
  id uuid primary key default gen_random_uuid(),
  server_id uuid,
  alert_type text not null,
  severity text not null default 'Medium',
  title text not null,
  message text,
  resolved boolean default false,
  created_by uuid,
  created_at timestamptz default now()
);

create table if not exists public.connected_services (
  id uuid primary key default gen_random_uuid(),
  server_id uuid,
  service_name text not null,
  service_type text,
  status text default 'Unknown',
  notes text,
  created_by uuid,
  created_at timestamptz default now()
);

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'server_configurations_type_check'
      and conrelid = 'public.server_configurations'::regclass
  ) then
    alter table public.server_configurations
      add constraint server_configurations_type_check
      check (server_type in ('Primary', 'Backup', 'Regional', 'Analytics', 'Storage', 'AI Function', 'Development'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'server_configurations_environment_check'
      and conrelid = 'public.server_configurations'::regclass
  ) then
    alter table public.server_configurations
      add constraint server_configurations_environment_check
      check (environment in ('Production', 'Staging', 'Development', 'Testing'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'server_configurations_status_check'
      and conrelid = 'public.server_configurations'::regclass
  ) then
    alter table public.server_configurations
      add constraint server_configurations_status_check
      check (status in ('Online', 'Offline', 'Warning', 'Maintenance', 'Unknown'));
  end if;
end $$;

create index if not exists server_configurations_type_idx on public.server_configurations(server_type);
create index if not exists server_configurations_status_idx on public.server_configurations(status);
create index if not exists server_configurations_environment_idx on public.server_configurations(environment);
create index if not exists server_activity_logs_server_idx on public.server_activity_logs(server_id, created_at desc);
create index if not exists infrastructure_alerts_server_idx on public.infrastructure_alerts(server_id, resolved, created_at desc);
create index if not exists connected_services_server_idx on public.connected_services(server_id);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists server_configurations_touch_updated_at on public.server_configurations;
create trigger server_configurations_touch_updated_at
before update on public.server_configurations
for each row
execute function public.touch_updated_at();

alter table public.server_configurations enable row level security;
alter table public.server_activity_logs enable row level security;
alter table public.infrastructure_alerts enable row level security;
alter table public.connected_services enable row level security;

drop policy if exists "Authenticated users can read server configurations" on public.server_configurations;
create policy "Authenticated users can read server configurations"
on public.server_configurations for select
to authenticated
using (true);

drop policy if exists "Executives can manage server configurations" on public.server_configurations;
create policy "Executives can manage server configurations"
on public.server_configurations for all
to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role in ('CEO', 'Company Manager')
  )
)
with check (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role in ('CEO', 'Company Manager')
  )
);

drop policy if exists "Authenticated users can read infrastructure activity" on public.server_activity_logs;
create policy "Authenticated users can read infrastructure activity"
on public.server_activity_logs for select
to authenticated
using (true);

drop policy if exists "Executives can write infrastructure activity" on public.server_activity_logs;
create policy "Executives can write infrastructure activity"
on public.server_activity_logs for insert
to authenticated
with check (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role in ('CEO', 'Company Manager')
  )
);

drop policy if exists "Authenticated users can read infrastructure alerts" on public.infrastructure_alerts;
create policy "Authenticated users can read infrastructure alerts"
on public.infrastructure_alerts for select
to authenticated
using (true);

drop policy if exists "Executives can manage infrastructure alerts" on public.infrastructure_alerts;
create policy "Executives can manage infrastructure alerts"
on public.infrastructure_alerts for all
to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role in ('CEO', 'Company Manager')
  )
)
with check (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role in ('CEO', 'Company Manager')
  )
);

drop policy if exists "Authenticated users can read connected services" on public.connected_services;
create policy "Authenticated users can read connected services"
on public.connected_services for select
to authenticated
using (true);

drop policy if exists "Executives can manage connected services" on public.connected_services;
create policy "Executives can manage connected services"
on public.connected_services for all
to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role in ('CEO', 'Company Manager')
  )
)
with check (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role in ('CEO', 'Company Manager')
  )
);

grant select, insert, update on public.server_configurations to authenticated;
grant select, insert on public.server_activity_logs to authenticated;
grant select, insert, update on public.infrastructure_alerts to authenticated;
grant select, insert, update on public.connected_services to authenticated;
