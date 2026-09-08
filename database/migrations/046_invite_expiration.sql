-- ============================================================
--  INVITE EXPIRATION SAFETY
--  Run AFTER 045_security_core_safety.sql.
-- ============================================================

alter table public.invites
  add column if not exists expires_at timestamptz;

create index if not exists invites_code_unused_valid_idx
  on public.invites ((upper(code)))
  where used_by is null and used_at is null;

drop function if exists public.lookup_scoped_invite(text);
create function public.lookup_scoped_invite(p_code text)
returns table (
  id uuid, company_id uuid, role text, branch_ids uuid[], region text,
  company_name text, company_logo_url text, company_accent_color text
)
language sql
security definer
stable
set search_path = public
as $$
  select i.id, i.company_id, i.role, i.branch_ids, i.region,
    c.name, c.logo_url, c.accent_color
  from public.invites i
  join public.companies c on c.id = i.company_id
  where upper(i.code) = upper(trim(coalesce(p_code, '')))
    and i.used_by is null
    and i.used_at is null
    and (i.expires_at is null or i.expires_at > now())
  limit 1;
$$;

grant execute on function public.lookup_scoped_invite(text) to anon, authenticated;

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
    and (expires_at is null or expires_at > now())
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
      raise exception 'Invalid, expired, or already used invite';
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
    raise exception 'Invalid, expired, or already used invite';
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
