-- ============================================================
--  PER-PHOTO REVISION FLAGGING
--  Run AFTER 014_submissions_name_columns.sql
--
--  Head VM / VM Controller can flag specific before/after photos
--  that need to be redone instead of sending the whole submission
--  back — the rest of the photos stay exactly as uploaded.
-- ============================================================

alter table public.submission_photos add column if not exists flagged boolean not null default false;

create policy "reviewer_flag_submission_photos" on public.submission_photos
  for update using (
    exists (
      select 1 from public.submissions s
      where s.id = submission_id and s.company_id = public.my_company_id()
    )
    and public.my_role() in ('manager', 'store_manager', 'super_admin')
  )
  with check (
    exists (
      select 1 from public.submissions s
      where s.id = submission_id and s.company_id = public.my_company_id()
    )
    and public.my_role() in ('manager', 'store_manager', 'super_admin')
  );
