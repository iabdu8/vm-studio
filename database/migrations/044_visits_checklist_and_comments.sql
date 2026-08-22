-- ============================================================
--  Store Visits get the same checklist treatment as Floor Walks
--  (structured checklist jsonb, per-item photos/comments), plus a
--  visit_comments table mirroring floor_walk_comments so the new
--  CommentThread visitId prop has somewhere to read/write.
--  Already applied directly to production via Supabase MCP.
-- ============================================================

alter table public.store_visits add column if not exists checklist jsonb;

create table if not exists public.visit_comments (
  id uuid primary key default uuid_generate_v4(),
  visit_id uuid not null references public.store_visits(id) on delete cascade,
  author_id uuid not null references public.profiles(id),
  body text not null,
  created_at timestamptz not null default now()
);
create index if not exists visit_comments_visit_id_idx on public.visit_comments (visit_id);

alter table public.visit_comments enable row level security;

create policy "super_admin_all_visit_comments" on public.visit_comments
  for all using (public.is_super_admin());

create policy "company_read_visit_comments" on public.visit_comments
  for select using (
    exists (select 1 from public.store_visits sv where sv.id = visit_comments.visit_id and sv.company_id = public.my_company_id())
  );

create policy "allowed_roles_insert_visit_comments" on public.visit_comments
  for insert with check (
    author_id = auth.uid()
    and public.my_role() = any (array['manager','area_manager','store_manager','super_admin'])
    and exists (select 1 from public.store_visits sv where sv.id = visit_comments.visit_id and sv.company_id = public.my_company_id())
  );
