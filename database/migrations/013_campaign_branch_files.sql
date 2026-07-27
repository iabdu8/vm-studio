-- ============================================================
--  PER-BRANCH CAMPAIGN FILES
--  Run AFTER 012_vm_scoped_invites.sql
--
--  Each VM Controller uploads their own branch's campaign file
--  (PPT/PDF) instead of one shared company-wide file. VM staff
--  can then browse their own branch's file plus every other
--  branch's file for ideas.
-- ============================================================

alter table public.campaign_branches add column if not exists file_path        text;
alter table public.campaign_branches add column if not exists file_type        text check (file_type in ('pdf','ppt'));
alter table public.campaign_branches add column if not exists file_uploaded_by uuid references public.profiles(id);
alter table public.campaign_branches add column if not exists file_uploaded_at timestamptz;

-- VM Controller can upload/replace the file for their own branch's row only.
create policy "controller_upload_own_branch_campaign_file" on public.campaign_branches
  for update using (
    exists (
      select 1 from public.campaigns c
      where c.id = campaign_id and c.company_id = public.my_company_id()
    )
    and public.my_role() = 'store_manager'
    and branch_id = (select branch_id from public.profiles where id = auth.uid())
  )
  with check (
    exists (
      select 1 from public.campaigns c
      where c.id = campaign_id and c.company_id = public.my_company_id()
    )
    and public.my_role() = 'store_manager'
    and branch_id = (select branch_id from public.profiles where id = auth.uid())
  );
