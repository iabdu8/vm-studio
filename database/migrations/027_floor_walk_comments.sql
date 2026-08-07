-- ============================================================
--  FLOOR WALK COMMENTS
--  Run AFTER 026_training_fields.sql
--
--  Head VM no longer creates floor walks (VM Manager does) — but
--  can view and comment on any floor walk in the company.
-- ============================================================

create table public.floor_walk_comments (
  id            uuid primary key default uuid_generate_v4(),
  floor_walk_id uuid not null references public.floor_walks(id) on delete cascade,
  author_id     uuid not null references public.profiles(id),
  body          text not null,
  created_at    timestamptz not null default now()
);
create index on public.floor_walk_comments (floor_walk_id, created_at);
alter table public.floor_walk_comments enable row level security;

create policy "super_admin_all_floor_walk_comments" on public.floor_walk_comments
  for all using (public.is_super_admin());

create policy "company_read_floor_walk_comments" on public.floor_walk_comments
  for select using (
    exists (
      select 1 from public.floor_walks fw
      where fw.id = floor_walk_id and fw.company_id = public.my_company_id()
    )
  );

-- Head VM, VM Manager, VM Controller can comment (not VM)
create policy "allowed_roles_insert_floor_walk_comments" on public.floor_walk_comments
  for insert with check (
    author_id = auth.uid()
    and public.my_role() in ('manager','area_manager','store_manager','super_admin')
    and exists (
      select 1 from public.floor_walks fw
      where fw.id = floor_walk_id and fw.company_id = public.my_company_id()
    )
  );
