-- ============================================================
--  FIX: VM "Submit Work" was failing
--
--  App.jsx's handleSubmit() and VMTasks.jsx have always sent
--  category_name / subcategory_name / branch_name as part of the
--  submission payload (used as a human-readable label + as a
--  fallback match key for revision notes), but these columns were
--  never added to public.submissions in any tracked migration.
--  The insert was rejected by PostgREST with "column not found",
--  which is exactly the "Submit" failure being reported.
-- ============================================================

alter table public.submissions add column if not exists category_name    text;
alter table public.submissions add column if not exists subcategory_name text;
alter table public.submissions add column if not exists branch_name      text;
