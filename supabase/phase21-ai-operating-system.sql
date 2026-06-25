-- Velora OS Phase 21 - AI Operating System Foundation
-- Safe, additive migration. No destructive operations.

create extension if not exists pgcrypto;

create table if not exists public.ai_executive_recommendations (
  id uuid primary key default gen_random_uuid(),
  owner_company_id text,
  executive_name text not null,
  recommendation_type text default 'Recommendation',
  severity text default 'Medium',
  title text not null,
  reasoning text,
  data_used jsonb default '[]'::jsonb,
  expected_impact text,
  confidence_score integer default 50,
  confidence_label text default 'Developing',
  linked_module text default 'Command Center',
  linked_record_id text,
  approval_required boolean default true,
  status text default 'Open',
  created_by uuid,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.ai_executive_recommendations add column if not exists owner_company_id text;
alter table public.ai_executive_recommendations add column if not exists executive_name text;
alter table public.ai_executive_recommendations add column if not exists recommendation_type text default 'Recommendation';
alter table public.ai_executive_recommendations add column if not exists severity text default 'Medium';
alter table public.ai_executive_recommendations add column if not exists reasoning text;
alter table public.ai_executive_recommendations add column if not exists data_used jsonb default '[]'::jsonb;
alter table public.ai_executive_recommendations add column if not exists expected_impact text;
alter table public.ai_executive_recommendations add column if not exists confidence_score integer default 50;
alter table public.ai_executive_recommendations add column if not exists confidence_label text default 'Developing';
alter table public.ai_executive_recommendations add column if not exists linked_module text default 'Command Center';
alter table public.ai_executive_recommendations add column if not exists linked_record_id text;
alter table public.ai_executive_recommendations add column if not exists approval_required boolean default true;
alter table public.ai_executive_recommendations add column if not exists status text default 'Open';
alter table public.ai_executive_recommendations add column if not exists created_by uuid;
alter table public.ai_executive_recommendations add column if not exists created_at timestamptz default now();
alter table public.ai_executive_recommendations add column if not exists updated_at timestamptz default now();

create table if not exists public.ai_executive_briefings (
  id uuid primary key default gen_random_uuid(),
  owner_company_id text,
  briefing_type text default 'Daily',
  headline text not null,
  summary jsonb default '{}'::jsonb,
  risks jsonb default '[]'::jsonb,
  opportunities jsonb default '[]'::jsonb,
  recommendations jsonb default '[]'::jsonb,
  generated_by text default 'Velora AIOS',
  created_by uuid,
  created_at timestamptz default now()
);

alter table public.ai_executive_briefings add column if not exists owner_company_id text;
alter table public.ai_executive_briefings add column if not exists briefing_type text default 'Daily';
alter table public.ai_executive_briefings add column if not exists summary jsonb default '{}'::jsonb;
alter table public.ai_executive_briefings add column if not exists risks jsonb default '[]'::jsonb;
alter table public.ai_executive_briefings add column if not exists opportunities jsonb default '[]'::jsonb;
alter table public.ai_executive_briefings add column if not exists recommendations jsonb default '[]'::jsonb;
alter table public.ai_executive_briefings add column if not exists generated_by text default 'Velora AIOS';
alter table public.ai_executive_briefings add column if not exists created_by uuid;
alter table public.ai_executive_briefings add column if not exists created_at timestamptz default now();

create table if not exists public.ai_executive_activity (
  id uuid primary key default gen_random_uuid(),
  owner_company_id text,
  executive_name text not null,
  activity_type text default 'Insight',
  title text not null,
  detail text,
  linked_module text,
  linked_record_id text,
  confidence_score integer default 50,
  created_by uuid,
  created_at timestamptz default now()
);

alter table public.ai_executive_activity add column if not exists owner_company_id text;
alter table public.ai_executive_activity add column if not exists executive_name text;
alter table public.ai_executive_activity add column if not exists activity_type text default 'Insight';
alter table public.ai_executive_activity add column if not exists detail text;
alter table public.ai_executive_activity add column if not exists linked_module text;
alter table public.ai_executive_activity add column if not exists linked_record_id text;
alter table public.ai_executive_activity add column if not exists confidence_score integer default 50;
alter table public.ai_executive_activity add column if not exists created_by uuid;
alter table public.ai_executive_activity add column if not exists created_at timestamptz default now();

create index if not exists idx_ai_exec_recommendations_owner on public.ai_executive_recommendations(owner_company_id);
create index if not exists idx_ai_exec_recommendations_status on public.ai_executive_recommendations(status);
create index if not exists idx_ai_exec_recommendations_module on public.ai_executive_recommendations(linked_module);
create index if not exists idx_ai_exec_recommendations_created_at on public.ai_executive_recommendations(created_at desc);

create index if not exists idx_ai_exec_briefings_owner on public.ai_executive_briefings(owner_company_id);
create index if not exists idx_ai_exec_briefings_type on public.ai_executive_briefings(briefing_type);
create index if not exists idx_ai_exec_briefings_created_at on public.ai_executive_briefings(created_at desc);

create index if not exists idx_ai_exec_activity_owner on public.ai_executive_activity(owner_company_id);
create index if not exists idx_ai_exec_activity_executive on public.ai_executive_activity(executive_name);
create index if not exists idx_ai_exec_activity_created_at on public.ai_executive_activity(created_at desc);

create or replace function public.touch_ai_executive_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_ai_executive_recommendations_updated_at on public.ai_executive_recommendations;
create trigger trg_ai_executive_recommendations_updated_at
before update on public.ai_executive_recommendations
for each row execute function public.touch_ai_executive_updated_at();

alter table public.ai_executive_recommendations enable row level security;
alter table public.ai_executive_briefings enable row level security;
alter table public.ai_executive_activity enable row level security;

drop policy if exists "ai_exec_recommendations_select_authenticated" on public.ai_executive_recommendations;
create policy "ai_exec_recommendations_select_authenticated"
on public.ai_executive_recommendations for select
to authenticated
using (true);

drop policy if exists "ai_exec_recommendations_insert_authenticated" on public.ai_executive_recommendations;
create policy "ai_exec_recommendations_insert_authenticated"
on public.ai_executive_recommendations for insert
to authenticated
with check (auth.uid() = created_by or created_by is null);

drop policy if exists "ai_exec_recommendations_update_management" on public.ai_executive_recommendations;
create policy "ai_exec_recommendations_update_management"
on public.ai_executive_recommendations for update
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

drop policy if exists "ai_exec_briefings_select_authenticated" on public.ai_executive_briefings;
create policy "ai_exec_briefings_select_authenticated"
on public.ai_executive_briefings for select
to authenticated
using (true);

drop policy if exists "ai_exec_briefings_insert_authenticated" on public.ai_executive_briefings;
create policy "ai_exec_briefings_insert_authenticated"
on public.ai_executive_briefings for insert
to authenticated
with check (auth.uid() = created_by or created_by is null);

drop policy if exists "ai_exec_activity_select_authenticated" on public.ai_executive_activity;
create policy "ai_exec_activity_select_authenticated"
on public.ai_executive_activity for select
to authenticated
using (true);

drop policy if exists "ai_exec_activity_insert_authenticated" on public.ai_executive_activity;
create policy "ai_exec_activity_insert_authenticated"
on public.ai_executive_activity for insert
to authenticated
with check (auth.uid() = created_by or created_by is null);

grant select, insert, update on public.ai_executive_recommendations to authenticated;
grant select, insert on public.ai_executive_briefings to authenticated;
grant select, insert on public.ai_executive_activity to authenticated;
