-- ============================================================
--  UNIFY WEEKLY PLAN WITH TASKS
--  Run AFTER 001, 002, 003
--
--  A weekly plan item now IS the task: adding a row to the
--  weekly schedule auto-creates a linked `tasks` row (with
--  photo before/after submission + approval flow), so the
--  controller no longer needs a separate "New Task" step.
-- ============================================================

alter table public.weekly_plan_items add column if not exists task_id uuid references public.tasks(id) on delete set null;
create index if not exists weekly_plan_items_task_id_idx on public.weekly_plan_items (task_id);
