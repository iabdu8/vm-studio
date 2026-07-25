-- ============================================================
--  Real scheduled date on tasks (was only a free-text due_label
--  like "This week" — needed to sort/display the tasks table
--  by actual day instead of insertion order)
-- ============================================================

alter table public.tasks add column if not exists due_date date;
create index if not exists tasks_due_date_idx on public.tasks (due_date);
