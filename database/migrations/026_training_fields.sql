-- ============================================================
--  TRAINING: type, end date, region
--  Run AFTER 025_flat_manager_invite.sql
-- ============================================================

alter table public.trainings add column if not exists training_type text;
alter table public.trainings add column if not exists end_date      date;
alter table public.trainings add column if not exists region        text;
