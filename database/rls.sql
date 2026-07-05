-- ============================================================
--  VM-STUDIO — ROW LEVEL SECURITY POLICIES
--  Run AFTER schema.sql
-- ============================================================

-- ── Enable RLS on all tables ─────────────────────────────────
alter table public.companies         enable row level security;
alter table public.company_settings  enable row level security;
alter table public.branches          enable row level security;
alter table public.profiles          enable row level security;
alter table public.categories        enable row level security;
alter table public.subcategories     enable row level security;
alter table public.tasks             enable row level security;
alter table public.submissions       enable row level security;
alter table public.submission_photos enable row level security;
alter table public.guidelines        enable row level security;
alter table public.chat_messages     enable row level security;
alter table public.activity_log      enable row level security;

-- ── Helper: get current user's company_id ────────────────────
create or replace function public.my_company_id()
returns uuid language sql security definer stable as $$
  select company_id from public.profiles where id = auth.uid();
$$;

-- ── Helper: get current user's role ──────────────────────────
create or replace function public.my_role()
returns text language sql security definer stable as $$
  select role from public.profiles where id = auth.uid();
$$;

-- ── Helper: is super_admin ────────────────────────────────────
create or replace function public.is_super_admin()
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'super_admin'
  );
$$;

-- ── Helper: is manager or super_admin (includes all manager-level roles) ─
create or replace function public.is_manager()
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and role in ('manager','area_manager','store_manager','super_admin')
  );
$$;

-- ============================================================
--  COMPANIES
-- ============================================================
-- Super admin: full access
create policy "super_admin_all_companies" on public.companies
  for all using (public.is_super_admin());

-- Any logged-in user: read their own company
create policy "user_read_own_company" on public.companies
  for select using (id = public.my_company_id());

-- ============================================================
--  COMPANY SETTINGS
-- ============================================================
create policy "super_admin_all_settings" on public.company_settings
  for all using (public.is_super_admin());

create policy "user_read_own_settings" on public.company_settings
  for select using (company_id = public.my_company_id());

-- Manager can update their own company settings
create policy "manager_update_own_settings" on public.company_settings
  for update using (
    company_id = public.my_company_id() and public.is_manager()
  );

-- ============================================================
--  BRANCHES
-- ============================================================
create policy "super_admin_all_branches" on public.branches
  for all using (public.is_super_admin());

create policy "company_read_branches" on public.branches
  for select using (company_id = public.my_company_id());

create policy "manager_manage_branches" on public.branches
  for all using (
    company_id = public.my_company_id() and public.is_manager()
  );

-- ============================================================
--  PROFILES
-- ============================================================
create policy "super_admin_all_profiles" on public.profiles
  for all using (public.is_super_admin());

-- Users can read profiles in same company
create policy "company_read_profiles" on public.profiles
  for select using (company_id = public.my_company_id());

-- Users can update their own profile
create policy "user_update_own_profile" on public.profiles
  for update using (id = auth.uid());

-- Managers can manage profiles in their company
create policy "manager_manage_profiles" on public.profiles
  for all using (
    company_id = public.my_company_id() and public.is_manager()
  );

-- ============================================================
--  CATEGORIES
-- ============================================================
create policy "super_admin_all_categories" on public.categories
  for all using (public.is_super_admin());

-- All company users can read their categories
create policy "company_read_categories" on public.categories
  for select using (company_id = public.my_company_id());

-- Only manager/super_admin can create/update/delete
create policy "manager_manage_categories" on public.categories
  for all using (
    company_id = public.my_company_id() and public.is_manager()
  );

-- ============================================================
--  SUBCATEGORIES
-- ============================================================
create policy "super_admin_all_subcategories" on public.subcategories
  for all using (public.is_super_admin());

create policy "company_read_subcategories" on public.subcategories
  for select using (company_id = public.my_company_id());

create policy "manager_manage_subcategories" on public.subcategories
  for all using (
    company_id = public.my_company_id() and public.is_manager()
  );

-- ============================================================
--  TASKS
-- ============================================================
create policy "super_admin_all_tasks" on public.tasks
  for all using (public.is_super_admin());

create policy "company_read_tasks" on public.tasks
  for select using (company_id = public.my_company_id());

create policy "manager_manage_tasks" on public.tasks
  for all using (
    company_id = public.my_company_id() and public.is_manager()
  );

-- VMs can mark their own tasks done
create policy "vm_update_task_done" on public.tasks
  for update using (
    company_id = public.my_company_id()
    and (assigned_to = 'all' or assigned_to = auth.uid()::text)
  );

-- ============================================================
--  SUBMISSIONS
-- ============================================================
create policy "super_admin_all_submissions" on public.submissions
  for all using (public.is_super_admin());

create policy "company_read_submissions" on public.submissions
  for select using (company_id = public.my_company_id());

-- VMs can insert their own submissions
create policy "vm_insert_submission" on public.submissions
  for insert with check (
    company_id = public.my_company_id()
    and submitted_by = auth.uid()
  );

-- Managers can update status/score
create policy "manager_review_submissions" on public.submissions
  for update using (
    company_id = public.my_company_id() and public.is_manager()
  );

-- ============================================================
--  SUBMISSION PHOTOS
-- ============================================================
create policy "super_admin_all_photos" on public.submission_photos
  for all using (public.is_super_admin());

create policy "company_read_photos" on public.submission_photos
  for select using (
    exists (
      select 1 from public.submissions s
      where s.id = submission_id and s.company_id = public.my_company_id()
    )
  );

create policy "vm_insert_photos" on public.submission_photos
  for insert with check (
    exists (
      select 1 from public.submissions s
      where s.id = submission_id
        and s.submitted_by = auth.uid()
        and s.company_id = public.my_company_id()
    )
  );

-- ============================================================
--  GUIDELINES
-- ============================================================
create policy "super_admin_all_guidelines" on public.guidelines
  for all using (public.is_super_admin());

create policy "company_read_guidelines" on public.guidelines
  for select using (company_id = public.my_company_id());

create policy "manager_manage_guidelines" on public.guidelines
  for all using (
    company_id = public.my_company_id() and public.is_manager()
  );

-- ============================================================
--  CHAT MESSAGES
-- ============================================================
create policy "super_admin_all_chat" on public.chat_messages
  for all using (public.is_super_admin());

-- Team room: all company users
create policy "company_read_team_chat" on public.chat_messages
  for select using (
    company_id = public.my_company_id() and room = 'team'
  );

-- Managers room: managers only
create policy "managers_only_chat" on public.chat_messages
  for select using (
    company_id = public.my_company_id()
    and room = 'managers'
    and public.is_manager()
  );

-- Branch rooms: users in that branch (room = 'branch-<branch_id>')
create policy "branch_read_chat" on public.chat_messages
  for select using (
    company_id = public.my_company_id()
    and room like 'branch-%'
    and room = 'branch-' || (
      select branch_id::text from public.profiles
      where id = auth.uid() and branch_id is not null
    )
  );

-- Insert: company members, room-restricted
create policy "company_insert_chat" on public.chat_messages
  for insert with check (
    company_id = public.my_company_id()
    and sender_id = auth.uid()
    and (
      room = 'team'
      or (room = 'managers' and public.is_manager())
      or (room like 'branch-%' and room = 'branch-' || (
        select branch_id::text from public.profiles
        where id = auth.uid() and branch_id is not null
      ))
    )
  );

-- ============================================================
--  ACTIVITY LOG
-- ============================================================
create policy "super_admin_all_log" on public.activity_log
  for all using (public.is_super_admin());

create policy "manager_read_log" on public.activity_log
  for select using (
    company_id = public.my_company_id() and public.is_manager()
  );

create policy "company_insert_log" on public.activity_log
  for insert with check (
    company_id = public.my_company_id() and user_id = auth.uid()
  );

-- ============================================================
--  ENABLE RLS ON NEW TABLES
-- ============================================================
alter table public.notifications       enable row level security;
alter table public.push_subscriptions  enable row level security;
alter table public.demo_holds          enable row level security;
alter table public.campaigns           enable row level security;
alter table public.campaign_branches   enable row level security;
alter table public.promotions          enable row level security;
alter table public.promotion_branches  enable row level security;
alter table public.floor_walks         enable row level security;
alter table public.floor_walk_photos   enable row level security;
alter table public.store_visits        enable row level security;
alter table public.visit_findings      enable row level security;
alter table public.trainings           enable row level security;
alter table public.training_attendees  enable row level security;
alter table public.guideline_acks      enable row level security;

-- ============================================================
--  NOTIFICATIONS
-- ============================================================
create policy "super_admin_all_notifications" on public.notifications
  for all using (public.is_super_admin());

create policy "user_read_own_notifications" on public.notifications
  for select using (user_id = auth.uid());

create policy "company_insert_notifications" on public.notifications
  for insert with check (company_id = public.my_company_id());

create policy "user_update_own_notifications" on public.notifications
  for update using (user_id = auth.uid());

-- ============================================================
--  PUSH SUBSCRIPTIONS
-- ============================================================
create policy "user_manage_own_push_sub" on public.push_subscriptions
  for all using (user_id = auth.uid());

-- ============================================================
--  DEMO HOLDS
-- ============================================================
create policy "super_admin_all_demo_holds" on public.demo_holds
  for all using (public.is_super_admin());

create policy "company_read_demo_holds" on public.demo_holds
  for select using (company_id = public.my_company_id());

create policy "user_insert_demo_holds" on public.demo_holds
  for insert with check (
    company_id = public.my_company_id() and added_by = auth.uid()
  );

create policy "user_delete_own_demo_holds" on public.demo_holds
  for delete using (
    company_id = public.my_company_id() and added_by = auth.uid()
  );

-- ============================================================
--  CAMPAIGNS
-- ============================================================
create policy "super_admin_all_campaigns" on public.campaigns
  for all using (public.is_super_admin());

create policy "company_read_campaigns" on public.campaigns
  for select using (company_id = public.my_company_id());

create policy "manager_manage_campaigns" on public.campaigns
  for all using (
    company_id = public.my_company_id() and public.is_manager()
  );

-- ============================================================
--  CAMPAIGN BRANCHES
-- ============================================================
create policy "super_admin_all_campaign_branches" on public.campaign_branches
  for all using (public.is_super_admin());

create policy "company_read_campaign_branches" on public.campaign_branches
  for select using (
    exists (
      select 1 from public.campaigns c
      where c.id = campaign_id and c.company_id = public.my_company_id()
    )
  );

create policy "manager_manage_campaign_branches" on public.campaign_branches
  for all using (
    exists (
      select 1 from public.campaigns c
      where c.id = campaign_id
        and c.company_id = public.my_company_id()
        and public.is_manager()
    )
  );

-- ============================================================
--  PROMOTIONS
-- ============================================================
create policy "super_admin_all_promotions" on public.promotions
  for all using (public.is_super_admin());

create policy "company_read_promotions" on public.promotions
  for select using (company_id = public.my_company_id());

create policy "manager_manage_promotions" on public.promotions
  for all using (
    company_id = public.my_company_id() and public.is_manager()
  );

-- ============================================================
--  PROMOTION BRANCHES
-- ============================================================
create policy "super_admin_all_promo_branches" on public.promotion_branches
  for all using (public.is_super_admin());

create policy "company_read_promo_branches" on public.promotion_branches
  for select using (
    exists (
      select 1 from public.promotions p
      where p.id = promotion_id and p.company_id = public.my_company_id()
    )
  );

create policy "manager_manage_promo_branches" on public.promotion_branches
  for all using (
    exists (
      select 1 from public.promotions p
      where p.id = promotion_id
        and p.company_id = public.my_company_id()
        and public.is_manager()
    )
  );

-- ============================================================
--  FLOOR WALKS
-- ============================================================
create policy "super_admin_all_floor_walks" on public.floor_walks
  for all using (public.is_super_admin());

create policy "company_read_floor_walks" on public.floor_walks
  for select using (company_id = public.my_company_id());

create policy "manager_manage_floor_walks" on public.floor_walks
  for all using (
    company_id = public.my_company_id() and public.is_manager()
  );

-- ============================================================
--  FLOOR WALK PHOTOS
-- ============================================================
create policy "super_admin_all_fw_photos" on public.floor_walk_photos
  for all using (public.is_super_admin());

create policy "company_read_fw_photos" on public.floor_walk_photos
  for select using (
    exists (
      select 1 from public.floor_walks fw
      where fw.id = floor_walk_id and fw.company_id = public.my_company_id()
    )
  );

create policy "manager_insert_fw_photos" on public.floor_walk_photos
  for insert with check (
    exists (
      select 1 from public.floor_walks fw
      where fw.id = floor_walk_id
        and fw.company_id = public.my_company_id()
        and public.is_manager()
    )
  );

-- ============================================================
--  STORE VISITS
-- ============================================================
create policy "super_admin_all_visits" on public.store_visits
  for all using (public.is_super_admin());

create policy "company_read_visits" on public.store_visits
  for select using (company_id = public.my_company_id());

create policy "manager_manage_visits" on public.store_visits
  for all using (
    company_id = public.my_company_id() and public.is_manager()
  );

-- ============================================================
--  VISIT FINDINGS
-- ============================================================
create policy "super_admin_all_findings" on public.visit_findings
  for all using (public.is_super_admin());

create policy "company_read_findings" on public.visit_findings
  for select using (
    exists (
      select 1 from public.store_visits v
      where v.id = visit_id and v.company_id = public.my_company_id()
    )
  );

create policy "manager_manage_findings" on public.visit_findings
  for all using (
    exists (
      select 1 from public.store_visits v
      where v.id = visit_id
        and v.company_id = public.my_company_id()
        and public.is_manager()
    )
  );

-- ============================================================
--  TRAININGS
-- ============================================================
create policy "super_admin_all_trainings" on public.trainings
  for all using (public.is_super_admin());

create policy "company_read_trainings" on public.trainings
  for select using (company_id = public.my_company_id());

create policy "manager_manage_trainings" on public.trainings
  for all using (
    company_id = public.my_company_id() and public.is_manager()
  );

-- ============================================================
--  TRAINING ATTENDEES
-- ============================================================
create policy "super_admin_all_attendees" on public.training_attendees
  for all using (public.is_super_admin());

create policy "company_read_attendees" on public.training_attendees
  for select using (
    exists (
      select 1 from public.trainings t
      where t.id = training_id and t.company_id = public.my_company_id()
    )
  );

create policy "manager_manage_attendees" on public.training_attendees
  for all using (
    exists (
      select 1 from public.trainings t
      where t.id = training_id
        and t.company_id = public.my_company_id()
        and public.is_manager()
    )
  );

-- ============================================================
--  GUIDELINE ACKNOWLEDGEMENTS
-- ============================================================
create policy "super_admin_all_acks" on public.guideline_acks
  for all using (public.is_super_admin());

create policy "company_read_acks" on public.guideline_acks
  for select using (
    exists (
      select 1 from public.guidelines g
      where g.id = guideline_id and g.company_id = public.my_company_id()
    )
  );

create policy "user_insert_own_ack" on public.guideline_acks
  for insert with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.guidelines g
      where g.id = guideline_id and g.company_id = public.my_company_id()
    )
  );
