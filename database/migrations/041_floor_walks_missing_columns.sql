-- ============================================================
--  floor_walks was missing `status` and `branch_id` columns that
--  the app has always assumed exist — every insert/update silently
--  failed (error was never checked), so "Finish Floor Walk" appeared
--  to do nothing and no floor walk could ever be created.
--  Already applied directly to production via Supabase MCP.
-- ============================================================

alter table public.floor_walks add column if not exists status text not null default 'submitted';
alter table public.floor_walks add column if not exists branch_id uuid references public.branches(id) on delete set null;
create index if not exists floor_walks_branch_id_idx on public.floor_walks (branch_id);
