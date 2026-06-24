-- VELOLA OS PHASE 11 - HR & Workforce Management
-- Safe, idempotent migration. No destructive operations.

create extension if not exists pgcrypto;

create table if not exists public.hr_departments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid,
  name text not null,
  description text,
  manager_employee_id uuid,
  status text not null default 'Active',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.employees (
  id uuid primary key default gen_random_uuid(),
  company_id uuid,
  employee_id text not null,
  full_name text not null,
  profile_photo_url text,
  email text,
  phone text,
  department text,
  role text,
  date_of_joining date,
  employment_type text not null default 'Full Time',
  reporting_manager_id uuid references public.employees(id) on delete set null,
  status text not null default 'Active',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.hr_departments
  add column if not exists company_id uuid,
  add column if not exists manager_employee_id uuid,
  add column if not exists status text not null default 'Active',
  add column if not exists updated_at timestamptz not null default now();

alter table public.employees
  add column if not exists company_id uuid,
  add column if not exists profile_photo_url text,
  add column if not exists reporting_manager_id uuid references public.employees(id) on delete set null,
  add column if not exists updated_at timestamptz not null default now();

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'employees_status_check'
  ) then
    alter table public.employees
      add constraint employees_status_check
      check (status in ('Active', 'On Leave', 'Suspended', 'Resigned', 'Terminated'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'employees_employment_type_check'
  ) then
    alter table public.employees
      add constraint employees_employment_type_check
      check (employment_type in ('Full Time', 'Part Time', 'Contract', 'Internship', 'Consultant'));
  end if;
end $$;

create table if not exists public.payroll_records (
  id uuid primary key default gen_random_uuid(),
  company_id uuid,
  employee_id uuid references public.employees(id) on delete cascade,
  employee_code text,
  base_salary numeric not null default 0,
  bonus numeric not null default 0,
  deductions numeric not null default 0,
  net_salary numeric not null default 0,
  payment_date date,
  payment_status text not null default 'Pending',
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.attendance_records (
  id uuid primary key default gen_random_uuid(),
  company_id uuid,
  employee_id uuid references public.employees(id) on delete cascade,
  attendance_date date not null default current_date,
  status text not null default 'Present',
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.leave_requests (
  id uuid primary key default gen_random_uuid(),
  company_id uuid,
  employee_id uuid references public.employees(id) on delete cascade,
  leave_type text not null default 'Annual Leave',
  start_date date,
  end_date date,
  days numeric not null default 1,
  status text not null default 'Requested',
  reason text,
  approved_by uuid references auth.users(id) on delete set null,
  approved_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.performance_notes (
  id uuid primary key default gen_random_uuid(),
  company_id uuid,
  employee_id uuid references public.employees(id) on delete cascade,
  note_type text not null default 'Performance Note',
  title text not null,
  note text,
  rating numeric,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.payroll_records
  add column if not exists company_id uuid,
  add column if not exists employee_code text,
  add column if not exists updated_at timestamptz not null default now();

alter table public.attendance_records
  add column if not exists company_id uuid,
  add column if not exists updated_at timestamptz not null default now();

alter table public.leave_requests
  add column if not exists company_id uuid,
  add column if not exists approved_by uuid references auth.users(id) on delete set null,
  add column if not exists approved_at timestamptz,
  add column if not exists updated_at timestamptz not null default now();

alter table public.performance_notes
  add column if not exists company_id uuid,
  add column if not exists updated_at timestamptz not null default now();

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'payroll_records_status_check') then
    alter table public.payroll_records
      add constraint payroll_records_status_check
      check (payment_status in ('Pending', 'Paid', 'Overdue'));
  end if;

  if not exists (select 1 from pg_constraint where conname = 'attendance_records_status_check') then
    alter table public.attendance_records
      add constraint attendance_records_status_check
      check (status in ('Present', 'Absent', 'Leave', 'Half Day'));
  end if;

  if not exists (select 1 from pg_constraint where conname = 'leave_requests_status_check') then
    alter table public.leave_requests
      add constraint leave_requests_status_check
      check (status in ('Requested', 'Approved', 'Rejected', 'Cancelled'));
  end if;

  if not exists (select 1 from pg_constraint where conname = 'performance_notes_type_check') then
    alter table public.performance_notes
      add constraint performance_notes_type_check
      check (note_type in ('Review', 'Achievement', 'Warning', 'Performance Note'));
  end if;
end $$;

create unique index if not exists employees_company_employee_id_key
  on public.employees (coalesce(company_id, '00000000-0000-0000-0000-000000000000'::uuid), employee_id);

create unique index if not exists hr_departments_company_name_key
  on public.hr_departments (coalesce(company_id, '00000000-0000-0000-0000-000000000000'::uuid), lower(name));

create index if not exists employees_department_status_idx
  on public.employees (company_id, department, status);

create index if not exists payroll_records_employee_date_idx
  on public.payroll_records (employee_id, payment_date desc);

create index if not exists attendance_records_employee_date_idx
  on public.attendance_records (employee_id, attendance_date desc);

create index if not exists leave_requests_employee_status_idx
  on public.leave_requests (employee_id, status, start_date desc);

create index if not exists performance_notes_employee_idx
  on public.performance_notes (employee_id, created_at desc);

insert into public.hr_departments (name, description, status)
select seed.name, seed.description, 'Active'
from (
  values
    ('Management', 'Executive leadership and company control'),
    ('Sales', 'Customer acquisition and order management'),
    ('Logistics', 'Shipment, freight, customs, and delivery operations'),
    ('Procurement', 'Vehicle sourcing and supplier management'),
    ('Finance', 'Payroll, invoicing, payments, and profitability'),
    ('HR', 'People operations and workforce management'),
    ('Operations', 'Cross-functional operational execution'),
    ('IT', 'Systems, access, and technical operations')
) as seed(name, description)
where not exists (
  select 1 from public.hr_departments existing
  where lower(existing.name) = lower(seed.name)
    and existing.company_id is null
);

alter table public.hr_departments enable row level security;
alter table public.employees enable row level security;
alter table public.payroll_records enable row level security;
alter table public.attendance_records enable row level security;
alter table public.leave_requests enable row level security;
alter table public.performance_notes enable row level security;

drop policy if exists "Authenticated users can read HR departments" on public.hr_departments;
create policy "Authenticated users can read HR departments"
  on public.hr_departments for select to authenticated
  using (true);

drop policy if exists "Executives can manage HR departments" on public.hr_departments;
create policy "Executives can manage HR departments"
  on public.hr_departments for all to authenticated
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and profiles.role in ('CEO', 'Company Manager')
    )
  )
  with check (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and profiles.role in ('CEO', 'Company Manager')
    )
  );

drop policy if exists "Executives can read employees" on public.employees;
create policy "Executives can read employees"
  on public.employees for select to authenticated
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and profiles.role in ('CEO', 'Company Manager')
    )
  );

drop policy if exists "Executives can manage employees" on public.employees;
create policy "Executives can manage employees"
  on public.employees for all to authenticated
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and profiles.role in ('CEO', 'Company Manager')
    )
  )
  with check (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and profiles.role in ('CEO', 'Company Manager')
    )
  );

drop policy if exists "Executives can manage payroll" on public.payroll_records;
create policy "Executives can manage payroll"
  on public.payroll_records for all to authenticated
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and profiles.role in ('CEO', 'Company Manager')
    )
  )
  with check (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and profiles.role in ('CEO', 'Company Manager')
    )
  );

drop policy if exists "Executives can manage attendance" on public.attendance_records;
create policy "Executives can manage attendance"
  on public.attendance_records for all to authenticated
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and profiles.role in ('CEO', 'Company Manager')
    )
  )
  with check (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and profiles.role in ('CEO', 'Company Manager')
    )
  );

drop policy if exists "Executives can manage leave requests" on public.leave_requests;
create policy "Executives can manage leave requests"
  on public.leave_requests for all to authenticated
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and profiles.role in ('CEO', 'Company Manager')
    )
  )
  with check (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and profiles.role in ('CEO', 'Company Manager')
    )
  );

drop policy if exists "Executives can manage performance notes" on public.performance_notes;
create policy "Executives can manage performance notes"
  on public.performance_notes for all to authenticated
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and profiles.role in ('CEO', 'Company Manager')
    )
  )
  with check (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and profiles.role in ('CEO', 'Company Manager')
    )
  );

grant select, insert, update, delete on public.hr_departments to authenticated;
grant select, insert, update, delete on public.employees to authenticated;
grant select, insert, update, delete on public.payroll_records to authenticated;
grant select, insert, update, delete on public.attendance_records to authenticated;
grant select, insert, update, delete on public.leave_requests to authenticated;
grant select, insert, update, delete on public.performance_notes to authenticated;

comment on table public.employees is 'Velora OS Phase 11 employee master data for workforce management.';
comment on table public.payroll_records is 'Velora OS Phase 11 payroll history linked to employees.';
comment on table public.attendance_records is 'Velora OS Phase 11 attendance foundation.';
comment on table public.leave_requests is 'Velora OS Phase 11 leave management records.';
comment on table public.performance_notes is 'Velora OS Phase 11 performance review and note history.';
