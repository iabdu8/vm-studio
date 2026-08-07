-- ============================================================
--  BEST BRANCH OF THE MONTH — one pick PER REGION
--  Run AFTER 030_draft_visits_and_floorwalks.sql
-- ============================================================

alter table public.best_branch_of_month add column if not exists region text not null default '';

alter table public.best_branch_of_month drop constraint if exists best_branch_of_month_company_id_month_key;
alter table public.best_branch_of_month add constraint best_branch_of_month_company_month_region_key
  unique (company_id, month, region);
