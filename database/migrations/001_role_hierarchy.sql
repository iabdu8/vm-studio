-- ============================================================
--  VM-STUDIO — ROLE HIERARCHY MIGRATION
--  Run AFTER schema.sql + rls.sql
--
--  Re-scopes the existing roles into a 4-tier chain of command:
--    manager        -> Head VM       (company-wide, campaign ack)
--    area_manager   -> VM Manager    (assigned branches only, view+comment)
--    store_manager  -> VM Controller (own branch, create/approve)
--    vm             -> VM            (executes tasks)
-- ============================================================

-- ============================================================
--  1. MANAGER_BRANCHES  (replaces broken profile.region_id concept)
-- ============================================================
create table public.manager_branches (
  id         uuid primary key default uuid_generate_v4(),
  manager_id uuid not null references public.profiles(id) on delete cascade,
  branch_id  uuid not null references public.branches(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(manager_id, branch_id)
);
create index on public.manager_branches (manager_id);

-- ============================================================
--  2. INVITES  (super_admin-issued, branch-scoped codes for
--     area_manager / store_manager — vm keeps the flat company code)
-- ============================================================
create table public.invites (
  id          uuid primary key default uuid_generate_v4(),
  company_id  uuid not null references public.companies(id) on delete cascade,
  role        text not null check (role in ('area_manager','store_manager')),
  code        text not null unique,
  branch_ids  uuid[] not null,
  created_by  uuid references public.profiles(id),
  used_by     uuid references public.profiles(id),
  used_at     timestamptz,
  created_at  timestamptz not null default now()
);
create index on public.invites (company_id);

-- ============================================================
--  3. TASKS — branch + review target
-- ============================================================
alter table public.tasks add column if not exists branch_id uuid references public.branches(id) on delete set null;
alter table public.tasks add column if not exists target_controller_id uuid references public.profiles(id) on delete set null;
create index on public.tasks (branch_id);

-- ============================================================
--  4. TASK COMMENTS
-- ============================================================
create table public.task_comments (
  id         uuid primary key default uuid_generate_v4(),
  task_id    uuid not null references public.tasks(id) on delete cascade,
  author_id  uuid not null references public.profiles(id),
  body       text not null,
  created_at timestamptz not null default now()
);
create index on public.task_comments (task_id, created_at);

-- ============================================================
--  5. CAMPAIGN ACKNOWLEDGEMENTS  (Head VM sign-off, never blocking)
-- ============================================================
create table public.campaign_acknowledgements (
  id              uuid primary key default uuid_generate_v4(),
  campaign_id     uuid not null references public.campaigns(id) on delete cascade,
  acknowledged_by uuid not null references public.profiles(id),
  acknowledged_at timestamptz not null default now(),
  unique(campaign_id)
);

-- ============================================================
--  6. RLS — enable on new tables
-- ============================================================
alter table public.manager_branches         enable row level security;
alter table public.invites                  enable row level security;
alter table public.task_comments            enable row level security;
alter table public.campaign_acknowledgements enable row level security;

-- ── Helper: is store_manager (VM Controller) ──────────────────
create or replace function public.is_controller()
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'store_manager'
  );
$$;

-- ── Helper: is area_manager (VM Manager) ──────────────────────
create or replace function public.is_area_manager()
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'area_manager'
  );
$$;

-- ── Helper: branch ids assigned to current area_manager ───────
create or replace function public.my_managed_branch_ids()
returns setof uuid language sql security definer stable as $$
  select branch_id from public.manager_branches where manager_id = auth.uid();
$$;

-- ── Redefine is_manager() -> Head VM + super_admin only ────────
-- (was: manager/area_manager/store_manager/super_admin — that made every
--  tier a full company-wide admin, which is exactly the bug we're fixing)
create or replace function public.is_manager()
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('manager','super_admin')
  );
$$;

-- ============================================================
--  MANAGER_BRANCHES policies
-- ============================================================
create policy "super_admin_all_manager_branches" on public.manager_branches
  for all using (public.is_super_admin());

create policy "head_vm_manage_manager_branches" on public.manager_branches
  for all using (
    public.is_manager()
    and exists (select 1 from public.profiles p where p.id = manager_id and p.company_id = public.my_company_id())
  );

create policy "area_manager_read_own_branches" on public.manager_branches
  for select using (manager_id = auth.uid());

-- ============================================================
--  INVITES policies — super_admin only, per client's decision
-- ============================================================
create policy "super_admin_all_invites" on public.invites
  for all using (public.is_super_admin());

-- ============================================================
--  TASK COMMENTS policies
-- ============================================================
create policy "super_admin_all_task_comments" on public.task_comments
  for all using (public.is_super_admin());

-- Read: anyone in the same company as the task
create policy "company_read_task_comments" on public.task_comments
  for select using (
    exists (
      select 1 from public.tasks t
      where t.id = task_id and t.company_id = public.my_company_id()
    )
  );

-- Insert: Head VM / VM Manager / VM Controller, or the VM the task is assigned to
create policy "allowed_roles_insert_task_comments" on public.task_comments
  for insert with check (
    author_id = auth.uid()
    and exists (
      select 1 from public.tasks t
      where t.id = task_id and t.company_id = public.my_company_id()
      and (
        public.my_role() in ('manager','area_manager','store_manager','super_admin')
        or t.assigned_to = 'all' or t.assigned_to = auth.uid()::text
      )
    )
  );

-- ============================================================
--  CAMPAIGN ACKNOWLEDGEMENTS policies
-- ============================================================
create policy "super_admin_all_campaign_acks" on public.campaign_acknowledgements
  for all using (public.is_super_admin());

create policy "company_read_campaign_acks" on public.campaign_acknowledgements
  for select using (
    exists (
      select 1 from public.campaigns c
      where c.id = campaign_id and c.company_id = public.my_company_id()
    )
  );

create policy "head_vm_insert_campaign_acks" on public.campaign_acknowledgements
  for insert with check (
    acknowledged_by = auth.uid()
    and public.is_manager()
    and exists (
      select 1 from public.campaigns c
      where c.id = campaign_id and c.company_id = public.my_company_id()
    )
  );

-- ============================================================
--  7. TASKS — branch-scoped policy for VM Controller
--     (existing "manager_manage_tasks" now only covers Head VM/super_admin
--      because is_manager() was redefined above)
-- ============================================================
create policy "controller_manage_own_branch_tasks" on public.tasks
  for all using (
    company_id = public.my_company_id()
    and public.is_controller()
    and branch_id = (select branch_id from public.profiles where id = auth.uid())
  );

-- ============================================================
--  8. SUBMISSIONS — branch-scoped review policy for VM Controller
--     (existing "manager_review_submissions" now only covers Head VM/super_admin)
-- ============================================================
create policy "controller_review_own_branch_submissions" on public.submissions
  for update using (
    company_id = public.my_company_id()
    and public.is_controller()
    and branch_id = (select branch_id from public.profiles where id = auth.uid())
  );

-- ============================================================
--  9. TASKS / SUBMISSIONS / CAMPAIGN_BRANCHES —
--     scope area_manager reads to their assigned branches only.
--     Company-wide "company_read_*" policies stay in place for
--     everyone else (manager, store_manager, vm, super_admin);
--     we tighten area_manager specifically since Postgres RLS
--     policies are OR'd, so we replace the blanket read policies
--     with role-aware versions.
-- ============================================================
drop policy if exists "company_read_tasks" on public.tasks;
create policy "company_read_tasks" on public.tasks
  for select using (
    company_id = public.my_company_id()
    and (
      not public.is_area_manager()
      or branch_id in (select public.my_managed_branch_ids())
    )
  );

drop policy if exists "company_read_submissions" on public.submissions;
create policy "company_read_submissions" on public.submissions
  for select using (
    company_id = public.my_company_id()
    and (
      not public.is_area_manager()
      or branch_id in (select public.my_managed_branch_ids())
    )
  );

drop policy if exists "company_read_campaign_branches" on public.campaign_branches;
create policy "company_read_campaign_branches" on public.campaign_branches
  for select using (
    exists (
      select 1 from public.campaigns c
      where c.id = campaign_id and c.company_id = public.my_company_id()
    )
    and (
      not public.is_area_manager()
      or branch_id in (select public.my_managed_branch_ids())
    )
  );
