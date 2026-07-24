-- ============================================================
--  VM CAN SET THEIR OWN WEEKLY PLAN TASK STATUS
--  Run AFTER 001_role_hierarchy.sql (safe to run even if
--  weekly_plans / weekly_plan_items already have RLS enabled)
-- ============================================================

alter table public.weekly_plans      enable row level security;
alter table public.weekly_plan_items enable row level security;

-- Read: anyone in the same company (VM needs to see their own plan)
drop policy if exists "company_read_weekly_plans" on public.weekly_plans;
create policy "company_read_weekly_plans" on public.weekly_plans
  for select using (company_id = public.my_company_id());

drop policy if exists "company_read_weekly_plan_items" on public.weekly_plan_items;
create policy "company_read_weekly_plan_items" on public.weekly_plan_items
  for select using (
    exists (
      select 1 from public.weekly_plans p
      where p.id = plan_id and p.company_id = public.my_company_id()
    )
  );

-- Manage (create/edit/delete plan + items): Head VM or the VM Controller of that branch
drop policy if exists "controller_manage_weekly_plans" on public.weekly_plans;
create policy "controller_manage_weekly_plans" on public.weekly_plans
  for all using (
    company_id = public.my_company_id()
    and (
      public.is_manager()
      or (public.is_controller() and branch_id = (select branch_id from public.profiles where id = auth.uid()))
    )
  );

drop policy if exists "controller_manage_weekly_plan_items" on public.weekly_plan_items;
create policy "controller_manage_weekly_plan_items" on public.weekly_plan_items
  for all using (
    exists (
      select 1 from public.weekly_plans p
      where p.id = plan_id
        and p.company_id = public.my_company_id()
        and (
          public.is_manager()
          or (public.is_controller() and p.branch_id = (select branch_id from public.profiles where id = auth.uid()))
        )
    )
  );

-- VM: can update the status of their own assigned items only (nothing else)
drop policy if exists "vm_update_own_weekly_plan_item_status" on public.weekly_plan_items;
create policy "vm_update_own_weekly_plan_item_status" on public.weekly_plan_items
  for update using (
    assigned_staff_id = auth.uid()
    and exists (
      select 1 from public.weekly_plans p
      where p.id = plan_id and p.company_id = public.my_company_id()
    )
  );
