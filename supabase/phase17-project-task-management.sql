-- VELOLA OS PHASE 17 - PROJECT & TASK MANAGEMENT
-- Safe, idempotent migration. No destructive statements.

create extension if not exists pgcrypto;

create table if not exists public.project_records (
  id uuid primary key default gen_random_uuid(),
  company_id uuid,
  project_id text not null,
  project_name text not null,
  description text,
  department text not null default 'Operations',
  priority text not null default 'Medium',
  status text not null default 'Planning',
  start_date date,
  due_date date,
  budget numeric not null default 0,
  project_manager text,
  team_members text[] not null default '{}',
  linked_document_id uuid,
  created_by uuid,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create table if not exists public.project_tasks (
  id uuid primary key default gen_random_uuid(),
  company_id uuid,
  task_id text not null,
  project_record_id uuid,
  task_name text not null,
  description text,
  assigned_employee text,
  assigned_department text not null default 'Operations',
  priority text not null default 'Medium',
  due_date date,
  status text not null default 'Not Started',
  progress integer not null default 0,
  linked_document_id uuid,
  created_by uuid,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create table if not exists public.project_task_comments (
  id uuid primary key default gen_random_uuid(),
  task_record_id uuid,
  author text,
  note text not null,
  created_by uuid,
  created_at timestamp with time zone not null default now()
);

create table if not exists public.project_milestones (
  id uuid primary key default gen_random_uuid(),
  project_record_id uuid,
  milestone_name text not null,
  due_date date,
  status text not null default 'Planned',
  progress integer not null default 0,
  notes text,
  created_by uuid,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create table if not exists public.project_dependencies (
  id uuid primary key default gen_random_uuid(),
  project_record_id uuid,
  source_task_id uuid,
  target_task_id uuid,
  dependency_type text not null default 'Finish-to-start',
  notes text,
  created_by uuid,
  created_at timestamp with time zone not null default now()
);

alter table public.project_records add column if not exists company_id uuid;
alter table public.project_records add column if not exists project_id text;
alter table public.project_records add column if not exists project_name text;
alter table public.project_records add column if not exists description text;
alter table public.project_records add column if not exists department text not null default 'Operations';
alter table public.project_records add column if not exists priority text not null default 'Medium';
alter table public.project_records add column if not exists status text not null default 'Planning';
alter table public.project_records add column if not exists start_date date;
alter table public.project_records add column if not exists due_date date;
alter table public.project_records add column if not exists budget numeric not null default 0;
alter table public.project_records add column if not exists project_manager text;
alter table public.project_records add column if not exists team_members text[] not null default '{}';
alter table public.project_records add column if not exists linked_document_id uuid;
alter table public.project_records add column if not exists created_by uuid;
alter table public.project_records add column if not exists created_at timestamp with time zone not null default now();
alter table public.project_records add column if not exists updated_at timestamp with time zone not null default now();

alter table public.project_tasks add column if not exists company_id uuid;
alter table public.project_tasks add column if not exists task_id text;
alter table public.project_tasks add column if not exists project_record_id uuid;
alter table public.project_tasks add column if not exists task_name text;
alter table public.project_tasks add column if not exists description text;
alter table public.project_tasks add column if not exists assigned_employee text;
alter table public.project_tasks add column if not exists assigned_department text not null default 'Operations';
alter table public.project_tasks add column if not exists priority text not null default 'Medium';
alter table public.project_tasks add column if not exists due_date date;
alter table public.project_tasks add column if not exists status text not null default 'Not Started';
alter table public.project_tasks add column if not exists progress integer not null default 0;
alter table public.project_tasks add column if not exists linked_document_id uuid;
alter table public.project_tasks add column if not exists created_by uuid;
alter table public.project_tasks add column if not exists created_at timestamp with time zone not null default now();
alter table public.project_tasks add column if not exists updated_at timestamp with time zone not null default now();

alter table public.project_task_comments add column if not exists task_record_id uuid;
alter table public.project_task_comments add column if not exists author text;
alter table public.project_task_comments add column if not exists note text;
alter table public.project_task_comments add column if not exists created_by uuid;
alter table public.project_task_comments add column if not exists created_at timestamp with time zone not null default now();

alter table public.project_milestones add column if not exists project_record_id uuid;
alter table public.project_milestones add column if not exists milestone_name text;
alter table public.project_milestones add column if not exists due_date date;
alter table public.project_milestones add column if not exists status text not null default 'Planned';
alter table public.project_milestones add column if not exists progress integer not null default 0;
alter table public.project_milestones add column if not exists notes text;
alter table public.project_milestones add column if not exists created_by uuid;
alter table public.project_milestones add column if not exists created_at timestamp with time zone not null default now();
alter table public.project_milestones add column if not exists updated_at timestamp with time zone not null default now();

alter table public.project_dependencies add column if not exists project_record_id uuid;
alter table public.project_dependencies add column if not exists source_task_id uuid;
alter table public.project_dependencies add column if not exists target_task_id uuid;
alter table public.project_dependencies add column if not exists dependency_type text not null default 'Finish-to-start';
alter table public.project_dependencies add column if not exists notes text;
alter table public.project_dependencies add column if not exists created_by uuid;
alter table public.project_dependencies add column if not exists created_at timestamp with time zone not null default now();

create unique index if not exists idx_project_records_project_id on public.project_records(project_id);
create index if not exists idx_project_records_company on public.project_records(company_id);
create index if not exists idx_project_records_status on public.project_records(status);
create index if not exists idx_project_records_department on public.project_records(department);
create index if not exists idx_project_records_due_date on public.project_records(due_date);

create unique index if not exists idx_project_tasks_task_id on public.project_tasks(task_id);
create index if not exists idx_project_tasks_project on public.project_tasks(project_record_id);
create index if not exists idx_project_tasks_status on public.project_tasks(status);
create index if not exists idx_project_tasks_department on public.project_tasks(assigned_department);
create index if not exists idx_project_tasks_due_date on public.project_tasks(due_date);

create index if not exists idx_project_task_comments_task on public.project_task_comments(task_record_id);
create index if not exists idx_project_milestones_project on public.project_milestones(project_record_id);
create index if not exists idx_project_dependencies_project on public.project_dependencies(project_record_id);

create or replace function public.velora_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_project_records_updated_at on public.project_records;
create trigger trg_project_records_updated_at
before update on public.project_records
for each row execute function public.velora_touch_updated_at();

drop trigger if exists trg_project_tasks_updated_at on public.project_tasks;
create trigger trg_project_tasks_updated_at
before update on public.project_tasks
for each row execute function public.velora_touch_updated_at();

drop trigger if exists trg_project_milestones_updated_at on public.project_milestones;
create trigger trg_project_milestones_updated_at
before update on public.project_milestones
for each row execute function public.velora_touch_updated_at();

alter table public.project_records enable row level security;
alter table public.project_tasks enable row level security;
alter table public.project_task_comments enable row level security;
alter table public.project_milestones enable row level security;
alter table public.project_dependencies enable row level security;

drop policy if exists "project_records_select_authenticated" on public.project_records;
create policy "project_records_select_authenticated" on public.project_records
for select to authenticated using (true);

drop policy if exists "project_records_insert_authenticated" on public.project_records;
create policy "project_records_insert_authenticated" on public.project_records
for insert to authenticated with check (auth.uid() is not null);

drop policy if exists "project_records_update_creator" on public.project_records;
create policy "project_records_update_creator" on public.project_records
for update to authenticated
using (created_by = auth.uid() or created_by is null)
with check (created_by = auth.uid() or created_by is null);

drop policy if exists "project_tasks_select_authenticated" on public.project_tasks;
create policy "project_tasks_select_authenticated" on public.project_tasks
for select to authenticated using (true);

drop policy if exists "project_tasks_insert_authenticated" on public.project_tasks;
create policy "project_tasks_insert_authenticated" on public.project_tasks
for insert to authenticated with check (auth.uid() is not null);

drop policy if exists "project_tasks_update_creator" on public.project_tasks;
create policy "project_tasks_update_creator" on public.project_tasks
for update to authenticated
using (created_by = auth.uid() or created_by is null)
with check (created_by = auth.uid() or created_by is null);

drop policy if exists "project_task_comments_select_authenticated" on public.project_task_comments;
create policy "project_task_comments_select_authenticated" on public.project_task_comments
for select to authenticated using (true);

drop policy if exists "project_task_comments_insert_authenticated" on public.project_task_comments;
create policy "project_task_comments_insert_authenticated" on public.project_task_comments
for insert to authenticated with check (auth.uid() is not null);

drop policy if exists "project_milestones_select_authenticated" on public.project_milestones;
create policy "project_milestones_select_authenticated" on public.project_milestones
for select to authenticated using (true);

drop policy if exists "project_milestones_insert_authenticated" on public.project_milestones;
create policy "project_milestones_insert_authenticated" on public.project_milestones
for insert to authenticated with check (auth.uid() is not null);

drop policy if exists "project_dependencies_select_authenticated" on public.project_dependencies;
create policy "project_dependencies_select_authenticated" on public.project_dependencies
for select to authenticated using (true);

drop policy if exists "project_dependencies_insert_authenticated" on public.project_dependencies;
create policy "project_dependencies_insert_authenticated" on public.project_dependencies
for insert to authenticated with check (auth.uid() is not null);

grant select, insert, update on public.project_records to authenticated;
grant select, insert, update on public.project_tasks to authenticated;
grant select, insert on public.project_task_comments to authenticated;
grant select, insert, update on public.project_milestones to authenticated;
grant select, insert on public.project_dependencies to authenticated;
