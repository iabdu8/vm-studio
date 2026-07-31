-- ============================================================
--  CAMPAIGN FILE REVIEW / APPROVAL
--  Run AFTER 015_submission_photo_flags.sql
--
--  Head VM and VM Manager can approve or request changes on the
--  campaign file each branch's VM Controller uploads.
-- ============================================================

alter table public.campaign_branches add column if not exists file_status      text check (file_status in ('pending','approved','changes_requested')) not null default 'pending';
alter table public.campaign_branches add column if not exists file_review_note text;
alter table public.campaign_branches add column if not exists file_reviewed_by uuid references public.profiles(id);
alter table public.campaign_branches add column if not exists file_reviewed_at timestamptz;

-- VM Manager can review the file for branches assigned to them via manager_branches.
-- (Head VM already has full access through the existing manager_manage_campaign_branches policy.)
create policy "area_manager_review_campaign_branch_file" on public.campaign_branches
  for update using (
    exists (
      select 1 from public.campaigns c
      where c.id = campaign_id and c.company_id = public.my_company_id()
    )
    and public.my_role() = 'area_manager'
    and exists (
      select 1 from public.manager_branches mb
      where mb.manager_id = auth.uid() and mb.branch_id = campaign_branches.branch_id
    )
  )
  with check (
    exists (
      select 1 from public.campaigns c
      where c.id = campaign_id and c.company_id = public.my_company_id()
    )
    and public.my_role() = 'area_manager'
    and exists (
      select 1 from public.manager_branches mb
      where mb.manager_id = auth.uid() and mb.branch_id = campaign_branches.branch_id
    )
  );
