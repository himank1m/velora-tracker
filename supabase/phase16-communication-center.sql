-- VELOLA OS PHASE 16 - COMMUNICATION CENTER & COMPANY COLLABORATION HUB
-- Safe, idempotent migration. No destructive statements.

create extension if not exists pgcrypto;

create table if not exists public.communication_announcements (
  id uuid primary key default gen_random_uuid(),
  company_id uuid,
  title text not null,
  message text not null,
  author text,
  priority text not null default 'Medium',
  department text not null default 'Company-wide',
  category text not null default 'Notice',
  publish_date date,
  expiry_date date,
  linked_document_id uuid,
  source text not null default 'Manual',
  created_by uuid,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create table if not exists public.communication_messages (
  id uuid primary key default gen_random_uuid(),
  company_id uuid,
  subject text not null,
  body text not null,
  sender text,
  audience_type text not null default 'Department Message',
  target_department text,
  recipient text,
  priority text not null default 'Medium',
  created_by uuid,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create table if not exists public.communication_events (
  id uuid primary key default gen_random_uuid(),
  company_id uuid,
  title text not null,
  event_type text not null default 'Meeting',
  department text not null default 'Company-wide',
  event_date date,
  event_time time,
  notes text,
  created_by uuid,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create table if not exists public.communication_receipts (
  id uuid primary key default gen_random_uuid(),
  announcement_id uuid not null,
  user_id uuid not null,
  viewed boolean not null default false,
  acknowledged boolean not null default false,
  viewed_at timestamp with time zone,
  acknowledged_at timestamp with time zone,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  unique (announcement_id, user_id)
);

alter table public.communication_announcements add column if not exists company_id uuid;
alter table public.communication_announcements add column if not exists title text;
alter table public.communication_announcements add column if not exists message text;
alter table public.communication_announcements add column if not exists author text;
alter table public.communication_announcements add column if not exists priority text not null default 'Medium';
alter table public.communication_announcements add column if not exists department text not null default 'Company-wide';
alter table public.communication_announcements add column if not exists category text not null default 'Notice';
alter table public.communication_announcements add column if not exists publish_date date;
alter table public.communication_announcements add column if not exists expiry_date date;
alter table public.communication_announcements add column if not exists linked_document_id uuid;
alter table public.communication_announcements add column if not exists source text not null default 'Manual';
alter table public.communication_announcements add column if not exists created_by uuid;
alter table public.communication_announcements add column if not exists created_at timestamp with time zone not null default now();
alter table public.communication_announcements add column if not exists updated_at timestamp with time zone not null default now();

alter table public.communication_messages add column if not exists company_id uuid;
alter table public.communication_messages add column if not exists subject text;
alter table public.communication_messages add column if not exists body text;
alter table public.communication_messages add column if not exists sender text;
alter table public.communication_messages add column if not exists audience_type text not null default 'Department Message';
alter table public.communication_messages add column if not exists target_department text;
alter table public.communication_messages add column if not exists recipient text;
alter table public.communication_messages add column if not exists priority text not null default 'Medium';
alter table public.communication_messages add column if not exists created_by uuid;
alter table public.communication_messages add column if not exists created_at timestamp with time zone not null default now();
alter table public.communication_messages add column if not exists updated_at timestamp with time zone not null default now();

alter table public.communication_events add column if not exists company_id uuid;
alter table public.communication_events add column if not exists title text;
alter table public.communication_events add column if not exists event_type text not null default 'Meeting';
alter table public.communication_events add column if not exists department text not null default 'Company-wide';
alter table public.communication_events add column if not exists event_date date;
alter table public.communication_events add column if not exists event_time time;
alter table public.communication_events add column if not exists notes text;
alter table public.communication_events add column if not exists created_by uuid;
alter table public.communication_events add column if not exists created_at timestamp with time zone not null default now();
alter table public.communication_events add column if not exists updated_at timestamp with time zone not null default now();

alter table public.communication_receipts add column if not exists announcement_id uuid;
alter table public.communication_receipts add column if not exists user_id uuid;
alter table public.communication_receipts add column if not exists viewed boolean not null default false;
alter table public.communication_receipts add column if not exists acknowledged boolean not null default false;
alter table public.communication_receipts add column if not exists viewed_at timestamp with time zone;
alter table public.communication_receipts add column if not exists acknowledged_at timestamp with time zone;
alter table public.communication_receipts add column if not exists created_at timestamp with time zone not null default now();
alter table public.communication_receipts add column if not exists updated_at timestamp with time zone not null default now();

create unique index if not exists idx_communication_receipts_unique
on public.communication_receipts(announcement_id, user_id);

create index if not exists idx_communication_announcements_company on public.communication_announcements(company_id);
create index if not exists idx_communication_announcements_department on public.communication_announcements(department);
create index if not exists idx_communication_announcements_priority on public.communication_announcements(priority);
create index if not exists idx_communication_announcements_created_at on public.communication_announcements(created_at desc);

create index if not exists idx_communication_messages_company on public.communication_messages(company_id);
create index if not exists idx_communication_messages_department on public.communication_messages(target_department);
create index if not exists idx_communication_messages_created_at on public.communication_messages(created_at desc);

create index if not exists idx_communication_events_company on public.communication_events(company_id);
create index if not exists idx_communication_events_date on public.communication_events(event_date);

create or replace function public.velora_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_communication_announcements_updated_at on public.communication_announcements;
create trigger trg_communication_announcements_updated_at
before update on public.communication_announcements
for each row execute function public.velora_touch_updated_at();

drop trigger if exists trg_communication_messages_updated_at on public.communication_messages;
create trigger trg_communication_messages_updated_at
before update on public.communication_messages
for each row execute function public.velora_touch_updated_at();

drop trigger if exists trg_communication_events_updated_at on public.communication_events;
create trigger trg_communication_events_updated_at
before update on public.communication_events
for each row execute function public.velora_touch_updated_at();

drop trigger if exists trg_communication_receipts_updated_at on public.communication_receipts;
create trigger trg_communication_receipts_updated_at
before update on public.communication_receipts
for each row execute function public.velora_touch_updated_at();

alter table public.communication_announcements enable row level security;
alter table public.communication_messages enable row level security;
alter table public.communication_events enable row level security;
alter table public.communication_receipts enable row level security;

drop policy if exists "communication_announcements_select_authenticated" on public.communication_announcements;
create policy "communication_announcements_select_authenticated"
on public.communication_announcements
for select
to authenticated
using (true);

drop policy if exists "communication_announcements_insert_authenticated" on public.communication_announcements;
create policy "communication_announcements_insert_authenticated"
on public.communication_announcements
for insert
to authenticated
with check (auth.uid() is not null);

drop policy if exists "communication_announcements_update_creator" on public.communication_announcements;
create policy "communication_announcements_update_creator"
on public.communication_announcements
for update
to authenticated
using (created_by = auth.uid() or created_by is null)
with check (created_by = auth.uid() or created_by is null);

drop policy if exists "communication_messages_select_authenticated" on public.communication_messages;
create policy "communication_messages_select_authenticated"
on public.communication_messages
for select
to authenticated
using (true);

drop policy if exists "communication_messages_insert_authenticated" on public.communication_messages;
create policy "communication_messages_insert_authenticated"
on public.communication_messages
for insert
to authenticated
with check (auth.uid() is not null);

drop policy if exists "communication_events_select_authenticated" on public.communication_events;
create policy "communication_events_select_authenticated"
on public.communication_events
for select
to authenticated
using (true);

drop policy if exists "communication_events_insert_authenticated" on public.communication_events;
create policy "communication_events_insert_authenticated"
on public.communication_events
for insert
to authenticated
with check (auth.uid() is not null);

drop policy if exists "communication_receipts_select_own" on public.communication_receipts;
create policy "communication_receipts_select_own"
on public.communication_receipts
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "communication_receipts_upsert_own" on public.communication_receipts;
create policy "communication_receipts_upsert_own"
on public.communication_receipts
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "communication_receipts_update_own" on public.communication_receipts;
create policy "communication_receipts_update_own"
on public.communication_receipts
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

grant select, insert, update on public.communication_announcements to authenticated;
grant select, insert on public.communication_messages to authenticated;
grant select, insert on public.communication_events to authenticated;
grant select, insert, update on public.communication_receipts to authenticated;
