-- ============================================================
--  RIYADH REGION — new branches
--  Run AFTER 023_fix_south_region_branches.sql
--
--  Adds Al-Qasr, Al-Waha, CPR2, CPR3, Rimal, Khurais under the
--  same company as the existing branches, region = 'Riyadh'.
-- ============================================================

insert into public.branches (company_id, name, region, is_active, sort_order)
select b.company_id, v.name, 'Riyadh', true, 0
from (select distinct company_id from public.branches where name ilike '%jeddah%') b
cross join (values
  ('Al-Qasr'), ('Al-Waha'), ('CPR2'), ('CPR3'), ('Rimal'), ('Khurais')
) as v(name)
where not exists (
  select 1 from public.branches existing
  where existing.company_id = b.company_id and existing.name ilike v.name
);
