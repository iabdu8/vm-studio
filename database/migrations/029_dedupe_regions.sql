-- ============================================================
--  DEDUPE REGIONS (case/whitespace-insensitive)
--  Run AFTER 028_best_branch_of_month.sql
--
--  If two branches ended up with "West" and " west" (different
--  case or stray whitespace), the old lookup_regions() treated
--  them as two separate regions. This normalizes existing data
--  and makes the lookup dedupe regardless of case/whitespace.
-- ============================================================

-- Normalize existing values (trim + collapse to the most common casing per group)
update public.branches b
set region = t.canonical
from (
  select lower(trim(region)) as key,
         (array_agg(trim(region) order by region))[1] as canonical
  from public.branches
  where region is not null
  group by lower(trim(region))
) t
where lower(trim(b.region)) = t.key and b.region is distinct from t.canonical;

create or replace function public.lookup_regions(p_company_id uuid)
returns table (region text)
language sql security definer stable
set search_path = public
as $$
  select min(trim(region)) as region
  from public.branches
  where company_id = p_company_id and is_active = true and region is not null and trim(region) <> ''
  group by lower(trim(region))
  order by 1;
$$;
grant execute on function public.lookup_regions(uuid) to anon, authenticated;

create or replace function public.lookup_branches_by_region(p_company_id uuid, p_region text)
returns table (id uuid, name text)
language sql security definer stable
set search_path = public
as $$
  select id, name from public.branches
  where company_id = p_company_id
    and is_active = true
    and lower(trim(region)) = any(
      select lower(trim(x)) from unnest(string_to_array(p_region, ',')) as x
    )
  order by sort_order;
$$;
grant execute on function public.lookup_branches_by_region(uuid, text) to anon, authenticated;
