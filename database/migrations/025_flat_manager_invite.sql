-- ============================================================
--  SIMPLIFY: VM Manager gets a flat company-wide invite code too
--  (like VM / VM Controller / Head VM) instead of a region-scoped
--  one — they pick their own region, then their own branch(es),
--  at registration.
--  Run AFTER 024_riyadh_region_branches.sql
--
--  Reuses the `manager_invite_code` column that already existed
--  on companies (added in schema.sql, never wired up until now).
-- ============================================================

create or replace function public.lookup_company_by_code(p_code text)
returns table (id uuid, name text, logo_url text, accent_color text, role text)
language sql security definer stable
set search_path = public
as $$
  select id, name, logo_url, accent_color,
    case
      when invite_code = p_code then 'vm'
      when vmc_invite_code = p_code then 'manager'
      when controller_invite_code = p_code then 'store_manager'
      when manager_invite_code = p_code then 'area_manager'
    end as role
  from public.companies
  where invite_code = p_code or vmc_invite_code = p_code
     or controller_invite_code = p_code or manager_invite_code = p_code
  limit 1;
$$;
grant execute on function public.lookup_company_by_code(text) to anon, authenticated;

-- Distinct regions set up for a company's branches, for the VM Manager's
-- self-service region picker at registration.
create or replace function public.lookup_regions(p_company_id uuid)
returns table (region text)
language sql security definer stable
set search_path = public
as $$
  select distinct region from public.branches
  where company_id = p_company_id and is_active = true and region is not null
  order by region;
$$;
grant execute on function public.lookup_regions(uuid) to anon, authenticated;
