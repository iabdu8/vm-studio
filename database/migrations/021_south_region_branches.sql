-- ============================================================
--  SOUTH REGION — Jizan, Rashed Madina, and new Abha branch
--  Run AFTER 020_west_region_branches.sql
--
--  Moves Jizan and Rashed Madina from West to South, and adds a
--  new Abha branch under the same company, also South.
-- ============================================================

update public.branches
set region = 'South'
where name ilike '%jizan%' or name ilike '%rashed%';

insert into public.branches (company_id, name, region, is_active, sort_order)
select b.company_id, 'Abha', 'South', true, 0
from (select distinct company_id from public.branches where name ilike '%jeddah%') b
where not exists (
  select 1 from public.branches existing
  where existing.company_id = b.company_id and existing.name ilike 'Abha'
);
