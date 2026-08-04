-- ============================================================
--  MULTI-REGION VM MANAGER INVITES
--  Run AFTER 021_south_region_branches.sql
--
--  Lets a super_admin generate one VM Manager invite that spans
--  more than one region (e.g. West + South combined) — the
--  invite's `region` column now holds a comma-separated list.
-- ============================================================

create or replace function public.lookup_branches_by_region(p_company_id uuid, p_region text)
returns table (id uuid, name text)
language sql security definer stable
set search_path = public
as $$
  select id, name from public.branches
  where company_id = p_company_id
    and is_active = true
    and region = any(string_to_array(p_region, ','))
  order by sort_order;
$$;
grant execute on function public.lookup_branches_by_region(uuid, text) to anon, authenticated;
