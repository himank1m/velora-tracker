-- VELOLA OS PHASE 18 - COMPANY KNOWLEDGE HUB & AI KNOWLEDGE BASE
-- Safe, idempotent migration. No destructive statements.

create extension if not exists pgcrypto;

create table if not exists public.knowledge_articles (
  id uuid primary key default gen_random_uuid(),
  company_id uuid,
  title text not null,
  category text not null default 'Operations',
  summary text,
  content text not null,
  author text,
  department text,
  status text not null default 'Draft',
  tags text[] not null default '{}',
  visibility text not null default 'Internal',
  linked_document_id uuid,
  created_by uuid,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create table if not exists public.knowledge_sops (
  id uuid primary key default gen_random_uuid(),
  company_id uuid,
  title text not null,
  purpose text,
  steps text not null,
  responsible_department text not null default 'Operations',
  required_documents text,
  related_modules text[] not null default '{}',
  revision_notes text,
  linked_document_id uuid,
  created_by uuid,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create table if not exists public.knowledge_training (
  id uuid primary key default gen_random_uuid(),
  company_id uuid,
  training_title text not null,
  department text not null default 'Operations',
  difficulty text not null default 'Beginner',
  estimated_time text,
  completion_status text not null default 'Not Started',
  summary text,
  linked_document_id uuid,
  created_by uuid,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create table if not exists public.knowledge_decisions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid,
  decision_title text not null,
  reason text not null,
  decision_date date,
  impact text,
  related_department text,
  related_project text,
  linked_document_id uuid,
  created_by uuid,
  created_at timestamp with time zone not null default now()
);

create table if not exists public.knowledge_revisions (
  id uuid primary key default gen_random_uuid(),
  article_id uuid,
  updated_by text,
  change_notes text not null,
  snapshot text,
  created_by uuid,
  created_at timestamp with time zone not null default now()
);

alter table public.knowledge_articles add column if not exists company_id uuid;
alter table public.knowledge_articles add column if not exists title text;
alter table public.knowledge_articles add column if not exists category text not null default 'Operations';
alter table public.knowledge_articles add column if not exists summary text;
alter table public.knowledge_articles add column if not exists content text;
alter table public.knowledge_articles add column if not exists author text;
alter table public.knowledge_articles add column if not exists department text;
alter table public.knowledge_articles add column if not exists status text not null default 'Draft';
alter table public.knowledge_articles add column if not exists tags text[] not null default '{}';
alter table public.knowledge_articles add column if not exists visibility text not null default 'Internal';
alter table public.knowledge_articles add column if not exists linked_document_id uuid;
alter table public.knowledge_articles add column if not exists created_by uuid;
alter table public.knowledge_articles add column if not exists created_at timestamp with time zone not null default now();
alter table public.knowledge_articles add column if not exists updated_at timestamp with time zone not null default now();

alter table public.knowledge_sops add column if not exists company_id uuid;
alter table public.knowledge_sops add column if not exists title text;
alter table public.knowledge_sops add column if not exists purpose text;
alter table public.knowledge_sops add column if not exists steps text;
alter table public.knowledge_sops add column if not exists responsible_department text not null default 'Operations';
alter table public.knowledge_sops add column if not exists required_documents text;
alter table public.knowledge_sops add column if not exists related_modules text[] not null default '{}';
alter table public.knowledge_sops add column if not exists revision_notes text;
alter table public.knowledge_sops add column if not exists linked_document_id uuid;
alter table public.knowledge_sops add column if not exists created_by uuid;
alter table public.knowledge_sops add column if not exists created_at timestamp with time zone not null default now();
alter table public.knowledge_sops add column if not exists updated_at timestamp with time zone not null default now();

alter table public.knowledge_training add column if not exists company_id uuid;
alter table public.knowledge_training add column if not exists training_title text;
alter table public.knowledge_training add column if not exists department text not null default 'Operations';
alter table public.knowledge_training add column if not exists difficulty text not null default 'Beginner';
alter table public.knowledge_training add column if not exists estimated_time text;
alter table public.knowledge_training add column if not exists completion_status text not null default 'Not Started';
alter table public.knowledge_training add column if not exists summary text;
alter table public.knowledge_training add column if not exists linked_document_id uuid;
alter table public.knowledge_training add column if not exists created_by uuid;
alter table public.knowledge_training add column if not exists created_at timestamp with time zone not null default now();
alter table public.knowledge_training add column if not exists updated_at timestamp with time zone not null default now();

alter table public.knowledge_decisions add column if not exists company_id uuid;
alter table public.knowledge_decisions add column if not exists decision_title text;
alter table public.knowledge_decisions add column if not exists reason text;
alter table public.knowledge_decisions add column if not exists decision_date date;
alter table public.knowledge_decisions add column if not exists impact text;
alter table public.knowledge_decisions add column if not exists related_department text;
alter table public.knowledge_decisions add column if not exists related_project text;
alter table public.knowledge_decisions add column if not exists linked_document_id uuid;
alter table public.knowledge_decisions add column if not exists created_by uuid;
alter table public.knowledge_decisions add column if not exists created_at timestamp with time zone not null default now();

alter table public.knowledge_revisions add column if not exists article_id uuid;
alter table public.knowledge_revisions add column if not exists updated_by text;
alter table public.knowledge_revisions add column if not exists change_notes text;
alter table public.knowledge_revisions add column if not exists snapshot text;
alter table public.knowledge_revisions add column if not exists created_by uuid;
alter table public.knowledge_revisions add column if not exists created_at timestamp with time zone not null default now();

create index if not exists idx_knowledge_articles_company on public.knowledge_articles(company_id);
create index if not exists idx_knowledge_articles_category on public.knowledge_articles(category);
create index if not exists idx_knowledge_articles_status on public.knowledge_articles(status);
create index if not exists idx_knowledge_articles_updated_at on public.knowledge_articles(updated_at desc);
create index if not exists idx_knowledge_sops_department on public.knowledge_sops(responsible_department);
create index if not exists idx_knowledge_training_department on public.knowledge_training(department);
create index if not exists idx_knowledge_decisions_date on public.knowledge_decisions(decision_date desc);
create index if not exists idx_knowledge_revisions_article on public.knowledge_revisions(article_id);

create or replace function public.velora_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_knowledge_articles_updated_at on public.knowledge_articles;
create trigger trg_knowledge_articles_updated_at before update on public.knowledge_articles
for each row execute function public.velora_touch_updated_at();

drop trigger if exists trg_knowledge_sops_updated_at on public.knowledge_sops;
create trigger trg_knowledge_sops_updated_at before update on public.knowledge_sops
for each row execute function public.velora_touch_updated_at();

drop trigger if exists trg_knowledge_training_updated_at on public.knowledge_training;
create trigger trg_knowledge_training_updated_at before update on public.knowledge_training
for each row execute function public.velora_touch_updated_at();

alter table public.knowledge_articles enable row level security;
alter table public.knowledge_sops enable row level security;
alter table public.knowledge_training enable row level security;
alter table public.knowledge_decisions enable row level security;
alter table public.knowledge_revisions enable row level security;

drop policy if exists "knowledge_articles_select_authenticated" on public.knowledge_articles;
create policy "knowledge_articles_select_authenticated" on public.knowledge_articles for select to authenticated using (true);
drop policy if exists "knowledge_articles_insert_authenticated" on public.knowledge_articles;
create policy "knowledge_articles_insert_authenticated" on public.knowledge_articles for insert to authenticated with check (auth.uid() is not null);
drop policy if exists "knowledge_articles_update_creator" on public.knowledge_articles;
create policy "knowledge_articles_update_creator" on public.knowledge_articles for update to authenticated using (created_by = auth.uid() or created_by is null) with check (created_by = auth.uid() or created_by is null);

drop policy if exists "knowledge_sops_select_authenticated" on public.knowledge_sops;
create policy "knowledge_sops_select_authenticated" on public.knowledge_sops for select to authenticated using (true);
drop policy if exists "knowledge_sops_insert_authenticated" on public.knowledge_sops;
create policy "knowledge_sops_insert_authenticated" on public.knowledge_sops for insert to authenticated with check (auth.uid() is not null);

drop policy if exists "knowledge_training_select_authenticated" on public.knowledge_training;
create policy "knowledge_training_select_authenticated" on public.knowledge_training for select to authenticated using (true);
drop policy if exists "knowledge_training_insert_authenticated" on public.knowledge_training;
create policy "knowledge_training_insert_authenticated" on public.knowledge_training for insert to authenticated with check (auth.uid() is not null);

drop policy if exists "knowledge_decisions_select_authenticated" on public.knowledge_decisions;
create policy "knowledge_decisions_select_authenticated" on public.knowledge_decisions for select to authenticated using (true);
drop policy if exists "knowledge_decisions_insert_authenticated" on public.knowledge_decisions;
create policy "knowledge_decisions_insert_authenticated" on public.knowledge_decisions for insert to authenticated with check (auth.uid() is not null);

drop policy if exists "knowledge_revisions_select_authenticated" on public.knowledge_revisions;
create policy "knowledge_revisions_select_authenticated" on public.knowledge_revisions for select to authenticated using (true);
drop policy if exists "knowledge_revisions_insert_authenticated" on public.knowledge_revisions;
create policy "knowledge_revisions_insert_authenticated" on public.knowledge_revisions for insert to authenticated with check (auth.uid() is not null);

grant select, insert, update on public.knowledge_articles to authenticated;
grant select, insert on public.knowledge_sops to authenticated;
grant select, insert on public.knowledge_training to authenticated;
grant select, insert on public.knowledge_decisions to authenticated;
grant select, insert on public.knowledge_revisions to authenticated;
