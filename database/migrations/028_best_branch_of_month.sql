-- ============================================================
--  BEST BRANCH OF THE MONTH — Head VM editable pick
--  Run AFTER 027_floor_walk_comments.sql
-- ============================================================

create table public.best_branch_of_month (
  id         uuid primary key default uuid_generate_v4(),
  company_id uuid not null references public.companies(id) on delete cascade,
  month      text not null, -- 'YYYY-MM'
  branch_id  uuid references public.branches(id) on delete set null,
  note       text,
  set_by     uuid references public.profiles(id),
  updated_at timestamptz not null default now(),
  unique (company_id, month)
);
alter table public.best_branch_of_month enable row level security;

create policy "super_admin_all_best_branch" on public.best_branch_of_month
  for all using (public.is_super_admin());

create policy "company_read_best_branch" on public.best_branch_of_month
  for select using (company_id = public.my_company_id());

create policy "head_vm_manage_best_branch" on public.best_branch_of_month
  for all using (company_id = public.my_company_id() and public.is_manager());
