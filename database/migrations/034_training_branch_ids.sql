-- ============================================================
--  TRAINING: branch scope
--  Replaces the free-text "region" field with a proper branch
--  picker — null/empty branch_ids means "All Branches".
-- ============================================================

alter table public.trainings add column if not exists branch_ids uuid[];
