-- ============================================================
--  SECURITY CORE SAFETY
--  Local migration only. Review before applying to production.
-- ============================================================

-- Keep role helpers explicit. "manager" is the Head VM role in the app.
create or replace function public.is_head_vm()
returns boolean language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('manager','super_admin') and is_active = true
  );
$$;

create or replace function public.is_area_manager()
returns boolean language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'area_manager' and is_active = true
  );
$$;

create or replace function public.is_store_manager()
returns boolean language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'store_manager' and is_active = true
  );
$$;

create or replace function public.is_vm()
returns boolean language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'vm' and is_active = true
  );
$$;

create or replace function public.can_manage_branch(p_branch_id uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select
    public.is_head_vm()
    or (
      public.is_area_manager()
      and p_branch_id in (select branch_id from public.manager_branches where manager_id = auth.uid())
    )
    or (
      public.is_store_manager()
      and p_branch_id = (select branch_id from public.profiles where id = auth.uid())
    );
$$;

-- New signups start as inactive, unscoped profiles. Company/role/branch assignment
-- must be completed by the validated invitation RPC below.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, avatar_initials, role, company_id, branch_id, is_active)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    upper(left(coalesce(new.raw_user_meta_data->>'full_name', new.email), 2)),
    'vm',
    null,
    null,
    false
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create or replace function public.complete_profile_from_invite(
  p_code text,
  p_branch_id uuid default null,
  p_branch_ids uuid[] default null,
  p_employee_id text default null
)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invite public.invites%rowtype;
  v_company public.companies%rowtype;
  v_profile public.profiles%rowtype;
  v_code text := upper(trim(coalesce(p_code, '')));
  v_company_id uuid;
  v_role text;
  v_single_use_invite boolean := false;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  select * into v_invite
  from public.invites
  where upper(code) = v_code
    and used_by is null
    and used_at is null
  for update;

  if found then
    v_company_id := v_invite.company_id;
    v_role := v_invite.role;
    v_single_use_invite := true;
  else
    select * into v_company
    from public.companies
    where upper(invite_code) = v_code
       or upper(vmc_invite_code) = v_code
       or upper(controller_invite_code) = v_code
       or upper(manager_invite_code) = v_code
    limit 1;
    if not found then
      raise exception 'Invalid or already used invite';
    end if;
    v_company_id := v_company.id;
    v_role := case
      when upper(v_company.invite_code) = v_code then 'vm'
      when upper(v_company.vmc_invite_code) = v_code then 'manager'
      when upper(v_company.controller_invite_code) = v_code then 'store_manager'
      when upper(v_company.manager_invite_code) = v_code then 'area_manager'
    end;
  end if;

  if v_role is null then
    raise exception 'Invalid or already used invite';
  end if;

  if v_role not in ('manager','area_manager','store_manager','vm') then
    raise exception 'Unsupported invite role';
  end if;

  if v_role in ('store_manager','vm') then
    if p_branch_id is null then
      raise exception 'Branch is required for this role';
    end if;
    if not exists (
      select 1 from public.branches
      where id = p_branch_id and company_id = v_company_id and is_active = true
    ) then
      raise exception 'Branch is not valid for this invite';
    end if;
  end if;

  if v_role = 'area_manager' then
    if coalesce(array_length(p_branch_ids, 1), 0) = 0 then
      raise exception 'Managed branches are required for area managers';
    end if;
    if exists (
      select 1
      from unnest(p_branch_ids) as b(branch_id)
      where not exists (
        select 1 from public.branches br
        where br.id = b.branch_id and br.company_id = v_company_id and br.is_active = true
      )
    ) then
      raise exception 'One or more managed branches are invalid';
    end if;
  end if;

  update public.profiles
  set company_id = v_company_id,
      role = v_role,
      branch_id = case when v_role in ('area_manager','manager') then null else p_branch_id end,
      employee_id = nullif(trim(coalesce(p_employee_id, '')), ''),
      is_active = true,
      updated_at = now()
  where id = auth.uid()
  returning * into v_profile;

  if not found then
    raise exception 'Profile not found';
  end if;

  if v_role = 'area_manager' then
    delete from public.manager_branches where manager_id = auth.uid();
    insert into public.manager_branches (manager_id, branch_id)
    select auth.uid(), distinct_branch_id
    from (select distinct unnest(p_branch_ids) as distinct_branch_id) x;
  else
    delete from public.manager_branches where manager_id = auth.uid();
  end if;

  if v_single_use_invite then
    update public.invites
    set used_by = auth.uid(), used_at = now()
    where id = v_invite.id;
  end if;

  return v_profile;
end;
$$;

grant execute on function public.complete_profile_from_invite(text, uuid, uuid[], text) to authenticated;

-- Defense in depth: block sensitive self-escalation even if a broad update
-- policy accidentally reappears.
create or replace function public.guard_profile_sensitive_update()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() = old.id and not public.is_head_vm() then
    if new.role is distinct from old.role
      or new.company_id is distinct from old.company_id
      or new.branch_id is distinct from old.branch_id
      or new.is_active is distinct from old.is_active
      or new.created_at is distinct from old.created_at then
      raise exception 'Users cannot change administrative profile fields';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists guard_profile_sensitive_update on public.profiles;
create trigger guard_profile_sensitive_update
  before update on public.profiles
  for each row execute function public.guard_profile_sensitive_update();

drop policy if exists "user_update_own_profile" on public.profiles;
create policy "user_update_own_safe_profile_fields" on public.profiles
  for update using (id = auth.uid())
  with check (id = auth.uid());

-- Secure task completion: VMs can only mark their assigned task done/undone.
drop policy if exists "vm_update_task_done" on public.tasks;

create or replace function public.mark_task_done(p_task_id uuid, p_done boolean)
returns public.tasks
language plpgsql
security definer
set search_path = public
as $$
declare
  v_task public.tasks%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  select * into v_task
  from public.tasks
  where id = p_task_id
    and company_id = public.my_company_id()
    and (
      public.is_head_vm()
      or public.can_manage_branch(branch_id)
      or assigned_to = 'all'
      or assigned_to = auth.uid()::text
    )
  for update;

  if not found then
    raise exception 'Task not found or not permitted';
  end if;

  update public.tasks
  set is_done = coalesce(p_done, false), updated_at = now()
  where id = p_task_id
  returning * into v_task;

  return v_task;
end;
$$;

grant execute on function public.mark_task_done(uuid, boolean) to authenticated;

-- Secure submission review: limited to review fields and branch/company scope.
create or replace function public.review_submission_secure(
  p_submission_id uuid,
  p_status text,
  p_score int default null,
  p_note text default null
)
returns public.submissions
language plpgsql
security definer
set search_path = public
as $$
declare
  v_submission public.submissions%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if p_status not in ('approved','revision','pending') then
    raise exception 'Invalid submission status';
  end if;
  if p_score is not null and (p_score < 0 or p_score > 100) then
    raise exception 'Score must be between 0 and 100';
  end if;

  select * into v_submission
  from public.submissions
  where id = p_submission_id
    and company_id = public.my_company_id()
    and (
      public.is_head_vm()
      or public.can_manage_branch(branch_id)
    )
  for update;

  if not found then
    raise exception 'Submission not found or not permitted';
  end if;

  update public.submissions
  set status = p_status,
      score = p_score,
      note = nullif(trim(coalesce(p_note, '')), ''),
      reviewed_by = auth.uid(),
      reviewed_at = now(),
      updated_at = now()
  where id = p_submission_id
  returning * into v_submission;

  return v_submission;
end;
$$;

grant execute on function public.review_submission_secure(uuid, text, int, text) to authenticated;

-- Keep self attendance updates to check-in/check-out status only.
create or replace function public.guard_attendance_self_update()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() = old.user_id and not (public.is_head_vm() or public.is_area_manager() or public.is_store_manager()) then
    if new.training_id is distinct from old.training_id
      or new.user_id is distinct from old.user_id
      or new.score is distinct from old.score
      or new.note is distinct from old.note then
      raise exception 'Attendees can only update their own attendance status';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists guard_attendance_self_update on public.training_attendees;
create trigger guard_attendance_self_update
  before update on public.training_attendees
  for each row execute function public.guard_attendance_self_update();

drop policy if exists "self_update_own_attendance" on public.training_attendees;
create policy "self_update_own_attendance_status" on public.training_attendees
  for update using (user_id = auth.uid())
  with check (user_id = auth.uid());

create or replace function public.update_own_attendance_status(p_attendee_id uuid, p_status text)
returns public.training_attendees
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.training_attendees%rowtype;
begin
  if p_status not in ('pending','present','absent') then
    raise exception 'Invalid attendance status';
  end if;

  update public.training_attendees
  set status = p_status, updated_at = now()
  where id = p_attendee_id
    and user_id = auth.uid()
  returning * into v_row;

  if not found then
    raise exception 'Attendance row not found or not permitted';
  end if;

  return v_row;
end;
$$;

grant execute on function public.update_own_attendance_status(uuid, text) to authenticated;

-- Role hierarchy fixes for visit workflows:
-- Head VM/super_admin and area managers may create/manage visits/floor walks
-- for company/assigned branches; store managers can read/comment only.
drop policy if exists "manager_manage_floor_walks" on public.floor_walks;
drop policy if exists "company_all_floor_walks" on public.floor_walks;
drop policy if exists "vm_lead_read_floor_walks" on public.floor_walks;
drop policy if exists "vm_lead_manage_floor_walks" on public.floor_walks;

create policy "vm_lead_read_floor_walks" on public.floor_walks
  for select using (
    company_id = public.my_company_id()
    and (public.is_head_vm() or public.can_manage_branch(branch_id))
  );

create policy "vm_lead_manage_floor_walks" on public.floor_walks
  for all using (
    company_id = public.my_company_id()
    and (public.is_head_vm() or public.is_area_manager())
    and (public.is_head_vm() or public.can_manage_branch(branch_id))
  )
  with check (
    company_id = public.my_company_id()
    and added_by = auth.uid()
    and (public.is_head_vm() or public.can_manage_branch(branch_id))
  );

drop policy if exists "manager_insert_fw_photos" on public.floor_walk_photos;
drop policy if exists "company_all_floor_walk_photos" on public.floor_walk_photos;
drop policy if exists "vm_lead_read_fw_photos" on public.floor_walk_photos;
drop policy if exists "vm_lead_insert_fw_photos" on public.floor_walk_photos;

create policy "vm_lead_read_fw_photos" on public.floor_walk_photos
  for select using (
    exists (
      select 1 from public.floor_walks fw
      where fw.id = floor_walk_id
        and fw.company_id = public.my_company_id()
        and (public.is_head_vm() or public.can_manage_branch(fw.branch_id))
    )
  );

create policy "vm_lead_insert_fw_photos" on public.floor_walk_photos
  for insert with check (
    exists (
      select 1 from public.floor_walks fw
      where fw.id = floor_walk_id
        and fw.company_id = public.my_company_id()
        and (public.is_head_vm() or public.can_manage_branch(fw.branch_id))
    )
  );

drop policy if exists "manager_manage_visits" on public.store_visits;
drop policy if exists "company_all_store_visits" on public.store_visits;
drop policy if exists "vm_lead_read_visits" on public.store_visits;
drop policy if exists "vm_lead_manage_visits" on public.store_visits;

create policy "vm_lead_read_visits" on public.store_visits
  for select using (
    company_id = public.my_company_id()
    and (public.is_head_vm() or public.can_manage_branch(branch_id))
  );

create policy "vm_lead_manage_visits" on public.store_visits
  for all using (
    company_id = public.my_company_id()
    and (public.is_head_vm() or public.is_area_manager())
    and (public.is_head_vm() or public.can_manage_branch(branch_id))
  )
  with check (
    company_id = public.my_company_id()
    and visitor_id = auth.uid()
    and (public.is_head_vm() or public.can_manage_branch(branch_id))
  );

drop policy if exists "manager_manage_findings" on public.visit_findings;
drop policy if exists "company_all_visit_findings" on public.visit_findings;
drop policy if exists "vm_lead_read_findings" on public.visit_findings;
drop policy if exists "vm_lead_manage_findings" on public.visit_findings;

create policy "vm_lead_read_findings" on public.visit_findings
  for select using (
    exists (
      select 1 from public.store_visits v
      where v.id = visit_id
        and v.company_id = public.my_company_id()
        and (public.is_head_vm() or public.can_manage_branch(v.branch_id))
    )
  );

create policy "vm_lead_manage_findings" on public.visit_findings
  for all using (
    exists (
      select 1 from public.store_visits v
      where v.id = visit_id
        and v.company_id = public.my_company_id()
        and (public.is_head_vm() or public.is_area_manager())
        and (public.is_head_vm() or public.can_manage_branch(v.branch_id))
    )
  )
  with check (
    exists (
      select 1 from public.store_visits v
      where v.id = visit_id
        and v.company_id = public.my_company_id()
        and (public.is_head_vm() or public.can_manage_branch(v.branch_id))
    )
  );

-- Read scope should match retail hierarchy rather than relying on frontend filters.
drop policy if exists "company_read_tasks" on public.tasks;
create policy "role_scoped_read_tasks" on public.tasks
  for select using (
    company_id = public.my_company_id()
    and (
      public.is_head_vm()
      or public.can_manage_branch(branch_id)
      or assigned_to = 'all'
      or assigned_to = auth.uid()::text
    )
  );

drop policy if exists "company_read_submissions" on public.submissions;
create policy "role_scoped_read_submissions" on public.submissions
  for select using (
    company_id = public.my_company_id()
    and (
      public.is_head_vm()
      or public.can_manage_branch(branch_id)
      or submitted_by = auth.uid()
    )
  );

-- Storage design target for the private-bucket migration:
-- apply after converting client reads to signed URLs.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('vm-photos-private', 'vm-photos-private', false, 15728640, array['image/jpeg','image/png','image/webp','image/heic','image/heif']),
  ('vm-guidelines-private', 'vm-guidelines-private', false, 26214400, array['application/pdf','application/vnd.ms-powerpoint','application/vnd.openxmlformats-officedocument.presentationml.presentation'])
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "company_path_read_private_vm_photos" on storage.objects;
create policy "company_path_read_private_vm_photos" on storage.objects
  for select using (
    bucket_id = 'vm-photos-private'
    and split_part(name, '/', 1) = public.my_company_id()::text
  );

drop policy if exists "company_path_insert_private_vm_photos" on storage.objects;
create policy "company_path_insert_private_vm_photos" on storage.objects
  for insert with check (
    bucket_id = 'vm-photos-private'
    and split_part(name, '/', 1) = public.my_company_id()::text
  );

drop policy if exists "company_path_read_private_guidelines" on storage.objects;
create policy "company_path_read_private_guidelines" on storage.objects
  for select using (
    bucket_id = 'vm-guidelines-private'
    and split_part(name, '/', 1) = public.my_company_id()::text
  );

drop policy if exists "company_path_insert_private_guidelines" on storage.objects;
create policy "company_path_insert_private_guidelines" on storage.objects
  for insert with check (
    bucket_id = 'vm-guidelines-private'
    and split_part(name, '/', 1) = public.my_company_id()::text
    and (public.is_head_vm() or public.is_area_manager() or public.is_store_manager())
  );
