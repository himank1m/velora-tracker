-- Velora OS Phase 9 - Launch readiness, safety, preferences, and notifications
-- Safe and idempotent. No destructive operations.
-- Run after supabase/phase8-business-ecosystem.sql because company scoping is used.

create extension if not exists pgcrypto;

create table if not exists public.user_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  company_id uuid references public.companies(id) on delete cascade,
  theme text not null default 'dark',
  currency text not null default 'INR',
  notification_density text not null default 'Priority',
  ai_response_style text not null default 'Executive',
  preferences jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, company_id)
);

create table if not exists public.system_notifications (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  recipient_id uuid references auth.users(id) on delete cascade,
  notification_type text not null default 'System',
  severity text not null default 'Medium'
    check (severity in ('Low', 'Medium', 'High', 'Critical')),
  title text not null,
  message text not null,
  linked_module text,
  linked_record_id text,
  read_at timestamptz,
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.backup_exports (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  exported_by uuid not null references auth.users(id) on delete cascade,
  export_format text not null check (export_format in ('JSON', 'CSV')),
  export_scope text not null default 'Role scoped',
  record_counts jsonb not null default '{}'::jsonb,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.launch_audit_checks (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  checked_by uuid references auth.users(id) on delete set null,
  check_area text not null,
  check_name text not null,
  status text not null,
  detail text,
  created_at timestamptz not null default now()
);

create index if not exists user_preferences_user_idx
  on public.user_preferences(user_id);

create index if not exists system_notifications_recipient_idx
  on public.system_notifications(recipient_id, created_at desc);

create index if not exists system_notifications_company_idx
  on public.system_notifications(company_id, created_at desc);

create index if not exists backup_exports_company_idx
  on public.backup_exports(company_id, created_at desc);

create index if not exists launch_audit_checks_company_idx
  on public.launch_audit_checks(company_id, created_at desc);

alter table public.user_preferences enable row level security;
alter table public.system_notifications enable row level security;
alter table public.backup_exports enable row level security;
alter table public.launch_audit_checks enable row level security;

drop policy if exists "Users can manage own preferences" on public.user_preferences;
create policy "Users can manage own preferences"
on public.user_preferences
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can read own notifications" on public.system_notifications;
create policy "Users can read own notifications"
on public.system_notifications
for select
using (
  recipient_id = auth.uid()
  or (
    recipient_id is null
    and (
      company_id is null
      or public.is_company_member(company_id)
    )
  )
);

drop policy if exists "Users can update own notifications" on public.system_notifications;
create policy "Users can update own notifications"
on public.system_notifications
for update
using (recipient_id = auth.uid())
with check (recipient_id = auth.uid());

drop policy if exists "Managers can create notifications" on public.system_notifications;
create policy "Managers can create notifications"
on public.system_notifications
for insert
with check (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role in ('CEO', 'Company Manager')
  )
  and (
    company_id is null
    or public.is_company_member(company_id)
  )
);

drop policy if exists "Users can create backup export audit rows" on public.backup_exports;
create policy "Users can create backup export audit rows"
on public.backup_exports
for insert
with check (exported_by = auth.uid());

drop policy if exists "Executives can read backup export audit rows" on public.backup_exports;
create policy "Executives can read backup export audit rows"
on public.backup_exports
for select
using (
  exported_by = auth.uid()
  or (
    (
      company_id is null
      or public.is_company_member(company_id)
    )
    and exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
        and profiles.role in ('CEO', 'Company Manager', 'Finance Manager')
    )
  )
);

drop policy if exists "Executives can manage launch checks" on public.launch_audit_checks;
create policy "Executives can manage launch checks"
on public.launch_audit_checks
for all
using (
  (
    company_id is null
    or public.is_company_member(company_id)
  )
  and
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role in ('CEO', 'Company Manager')
  )
)
with check (
  (
    company_id is null
    or public.is_company_member(company_id)
  )
  and
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role in ('CEO', 'Company Manager')
  )
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_user_preferences_updated_at on public.user_preferences;
create trigger set_user_preferences_updated_at
before update on public.user_preferences
for each row
execute function public.set_updated_at();
