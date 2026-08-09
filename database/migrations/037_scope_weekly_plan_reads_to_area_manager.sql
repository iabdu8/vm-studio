-- ============================================================
--  Scope weekly_plans / weekly_plan_items reads for VM Manager
--  (area_manager) to their assigned branches only — matches the
--  same pattern already applied to tasks/submissions in
--  001_role_hierarchy.sql. Everyone else (manager, store_manager,
--  vm, super_admin) keeps company-wide read.
-- ============================================================

drop policy if exists "company_read_weekly_plans" on public.weekly_plans;
create policy "company_read_weekly_plans" on public.weekly_plans
  for select using (
    company_id = public.my_company_id()
    and (
      not public.is_area_manager()
      or branch_id in (select public.my_managed_branch_ids())
    )
  );

drop policy if exists "company_read_weekly_plan_items" on public.weekly_plan_items;
create policy "company_read_weekly_plan_items" on public.weekly_plan_items
  for select using (
    exists (
      select 1 from public.weekly_plans p
      where p.id = plan_id
        and p.company_id = public.my_company_id()
        and (
          not public.is_area_manager()
          or p.branch_id in (select public.my_managed_branch_ids())
        )
    )
  );
