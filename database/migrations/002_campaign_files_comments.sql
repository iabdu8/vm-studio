-- ============================================================
--  CAMPAIGN FILE ATTACHMENT + COMMENTS
--  Run AFTER 001_role_hierarchy.sql
--
--  - VM Controller uploads the campaign file (PDF/PPT)
--  - Head VM signs off (existing campaign_acknowledgements)
--  - VM Manager (and Head VM / Controller) can comment
--  - VM: view only (no comment insert policy for vm)
-- ============================================================

alter table public.campaigns add column if not exists file_path        text;
alter table public.campaigns add column if not exists file_type        text check (file_type in ('pdf','ppt'));
alter table public.campaigns add column if not exists file_uploaded_by uuid references public.profiles(id);

create table public.campaign_comments (
  id          uuid primary key default uuid_generate_v4(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  author_id   uuid not null references public.profiles(id),
  body        text not null,
  created_at  timestamptz not null default now()
);
create index on public.campaign_comments (campaign_id, created_at);
alter table public.campaign_comments enable row level security;

create policy "super_admin_all_campaign_comments" on public.campaign_comments
  for all using (public.is_super_admin());

create policy "company_read_campaign_comments" on public.campaign_comments
  for select using (
    exists (
      select 1 from public.campaigns c
      where c.id = campaign_id and c.company_id = public.my_company_id()
    )
  );

-- Head VM, VM Manager, VM Controller can comment (not VM)
create policy "allowed_roles_insert_campaign_comments" on public.campaign_comments
  for insert with check (
    author_id = auth.uid()
    and public.my_role() in ('manager','area_manager','store_manager','super_admin')
    and exists (
      select 1 from public.campaigns c
      where c.id = campaign_id and c.company_id = public.my_company_id()
    )
  );

-- VM Controller can upload the campaign file (UI only ever sets file_* columns here)
create policy "controller_upload_campaign_file" on public.campaigns
  for update using (
    company_id = public.my_company_id() and public.is_controller()
  );
