-- Velora OS Phase 12: Advanced Payroll & Compensation Center
-- Safe, idempotent migration. No drops, truncates, or destructive renames.

create extension if not exists pgcrypto;

create table if not exists public.payroll_records (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid,
  employee_code text,
  base_salary numeric default 0,
  bonus numeric default 0,
  deductions numeric default 0,
  net_salary numeric default 0,
  payment_date date,
  payment_status text default 'Pending',
  notes text,
  company_id uuid,
  created_by uuid,
  created_at timestamptz default now()
);

alter table public.payroll_records add column if not exists payroll_cycle_id uuid;
alter table public.payroll_records add column if not exists company_id uuid;
alter table public.payroll_records add column if not exists created_by uuid;
alter table public.payroll_records add column if not exists created_at timestamptz default now();

create table if not exists public.payroll_cycles (
  id uuid primary key default gen_random_uuid(),
  cycle_name text not null,
  period_start date not null,
  period_end date not null,
  run_status text not null default 'Draft',
  approval_status text not null default 'Draft',
  approved_by uuid,
  approved_at timestamptz,
  locked_at timestamptz,
  notes text,
  company_id uuid,
  created_by uuid,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.salary_history (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null,
  previous_salary numeric default 0,
  new_salary numeric not null default 0,
  effective_date date not null default current_date,
  reason text,
  approved_by text,
  notes text,
  company_id uuid,
  created_by uuid,
  created_at timestamptz default now()
);

create table if not exists public.employee_bonuses (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null,
  department text,
  payroll_cycle_id uuid,
  performance_note_id uuid,
  bonus_type text not null default 'Performance Bonus',
  amount numeric not null default 0,
  payment_date date,
  status text not null default 'Pending',
  notes text,
  company_id uuid,
  created_by uuid,
  created_at timestamptz default now()
);

create table if not exists public.employee_deductions (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null,
  department text,
  payroll_cycle_id uuid,
  deduction_type text not null default 'Tax Deduction',
  amount numeric not null default 0,
  deduction_date date,
  status text not null default 'Pending',
  notes text,
  company_id uuid,
  created_by uuid,
  created_at timestamptz default now()
);

create table if not exists public.payslips (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null,
  payroll_cycle_id uuid,
  payroll_month text,
  base_salary numeric default 0,
  bonuses numeric default 0,
  deductions numeric default 0,
  net_salary numeric default 0,
  payment_status text default 'Pending',
  generated_at timestamptz default now(),
  notes text,
  company_id uuid,
  created_by uuid,
  created_at timestamptz default now()
);

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'payroll_cycles_status_check'
      and conrelid = 'public.payroll_cycles'::regclass
  ) then
    alter table public.payroll_cycles
      add constraint payroll_cycles_status_check
      check (run_status in ('Draft', 'Calculating', 'Pending Approval', 'Approved', 'Paid', 'Locked', 'Cancelled'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'payroll_cycles_approval_check'
      and conrelid = 'public.payroll_cycles'::regclass
  ) then
    alter table public.payroll_cycles
      add constraint payroll_cycles_approval_check
      check (approval_status in ('Draft', 'Review', 'Pending Approval', 'Approved', 'Rejected', 'Paid', 'Locked', 'Cancelled'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'employee_bonuses_status_check'
      and conrelid = 'public.employee_bonuses'::regclass
  ) then
    alter table public.employee_bonuses
      add constraint employee_bonuses_status_check
      check (status in ('Pending', 'Approved', 'Paid', 'Cancelled'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'employee_deductions_status_check'
      and conrelid = 'public.employee_deductions'::regclass
  ) then
    alter table public.employee_deductions
      add constraint employee_deductions_status_check
      check (status in ('Pending', 'Applied', 'Cancelled'));
  end if;
end $$;

create index if not exists payroll_records_cycle_idx on public.payroll_records(payroll_cycle_id);
create index if not exists payroll_records_employee_idx on public.payroll_records(employee_id);
create index if not exists payroll_cycles_period_idx on public.payroll_cycles(period_start, period_end);
create index if not exists payroll_cycles_status_idx on public.payroll_cycles(run_status, approval_status);
create index if not exists salary_history_employee_idx on public.salary_history(employee_id, effective_date desc);
create index if not exists employee_bonuses_employee_idx on public.employee_bonuses(employee_id, payment_date desc);
create index if not exists employee_bonuses_cycle_idx on public.employee_bonuses(payroll_cycle_id);
create index if not exists employee_deductions_employee_idx on public.employee_deductions(employee_id, deduction_date desc);
create index if not exists employee_deductions_cycle_idx on public.employee_deductions(payroll_cycle_id);
create index if not exists payslips_employee_idx on public.payslips(employee_id, generated_at desc);
create index if not exists payslips_cycle_idx on public.payslips(payroll_cycle_id);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists payroll_cycles_touch_updated_at on public.payroll_cycles;
create trigger payroll_cycles_touch_updated_at
before update on public.payroll_cycles
for each row
execute function public.touch_updated_at();

create or replace function public.is_payroll_viewer()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role in ('CEO', 'Company Manager', 'Finance Manager')
  );
$$;

create or replace function public.is_payroll_manager()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role in ('CEO', 'Company Manager', 'Finance Manager')
  );
$$;

alter table public.payroll_records enable row level security;
alter table public.payroll_cycles enable row level security;
alter table public.salary_history enable row level security;
alter table public.employee_bonuses enable row level security;
alter table public.employee_deductions enable row level security;
alter table public.payslips enable row level security;

drop policy if exists "Payroll viewers can read payroll records" on public.payroll_records;
create policy "Payroll viewers can read payroll records"
on public.payroll_records for select
to authenticated
using (public.is_payroll_viewer());

drop policy if exists "Payroll managers can manage payroll records" on public.payroll_records;
create policy "Payroll managers can manage payroll records"
on public.payroll_records for all
to authenticated
using (public.is_payroll_manager())
with check (public.is_payroll_manager());

drop policy if exists "Payroll viewers can read payroll cycles" on public.payroll_cycles;
create policy "Payroll viewers can read payroll cycles"
on public.payroll_cycles for select
to authenticated
using (public.is_payroll_viewer());

drop policy if exists "Payroll managers can manage payroll cycles" on public.payroll_cycles;
create policy "Payroll managers can manage payroll cycles"
on public.payroll_cycles for all
to authenticated
using (public.is_payroll_manager())
with check (public.is_payroll_manager());

drop policy if exists "Payroll viewers can read salary history" on public.salary_history;
create policy "Payroll viewers can read salary history"
on public.salary_history for select
to authenticated
using (public.is_payroll_viewer());

drop policy if exists "Payroll managers can manage salary history" on public.salary_history;
create policy "Payroll managers can manage salary history"
on public.salary_history for all
to authenticated
using (public.is_payroll_manager())
with check (public.is_payroll_manager());

drop policy if exists "Payroll viewers can read employee bonuses" on public.employee_bonuses;
create policy "Payroll viewers can read employee bonuses"
on public.employee_bonuses for select
to authenticated
using (public.is_payroll_viewer());

drop policy if exists "Payroll managers can manage employee bonuses" on public.employee_bonuses;
create policy "Payroll managers can manage employee bonuses"
on public.employee_bonuses for all
to authenticated
using (public.is_payroll_manager())
with check (public.is_payroll_manager());

drop policy if exists "Payroll viewers can read employee deductions" on public.employee_deductions;
create policy "Payroll viewers can read employee deductions"
on public.employee_deductions for select
to authenticated
using (public.is_payroll_viewer());

drop policy if exists "Payroll managers can manage employee deductions" on public.employee_deductions;
create policy "Payroll managers can manage employee deductions"
on public.employee_deductions for all
to authenticated
using (public.is_payroll_manager())
with check (public.is_payroll_manager());

drop policy if exists "Payroll viewers can read payslips" on public.payslips;
create policy "Payroll viewers can read payslips"
on public.payslips for select
to authenticated
using (public.is_payroll_viewer());

drop policy if exists "Payroll managers can manage payslips" on public.payslips;
create policy "Payroll managers can manage payslips"
on public.payslips for all
to authenticated
using (public.is_payroll_manager())
with check (public.is_payroll_manager());

grant select, insert, update, delete on public.payroll_records to authenticated;
grant select, insert, update, delete on public.payroll_cycles to authenticated;
grant select, insert, update, delete on public.salary_history to authenticated;
grant select, insert, update, delete on public.employee_bonuses to authenticated;
grant select, insert, update, delete on public.employee_deductions to authenticated;
grant select, insert, update, delete on public.payslips to authenticated;
