-- ============================================================
--  DRAFT / IN-PROGRESS VISITS & FLOOR WALKS
--  Run AFTER 029_dedupe_regions.sql
--
--  A visit/floor walk can now stay open while more photos get
--  added over time, instead of every photo becoming its own
--  separate report — it's one record until explicitly finished.
-- ============================================================

alter table public.floor_walks add column if not exists status text not null default 'submitted'
  check (status in ('draft','submitted'));
