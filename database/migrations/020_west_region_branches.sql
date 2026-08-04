-- ============================================================
--  WEST REGION — classify Jeddah branches + add new ones
--  Run AFTER 019_chat_attachments.sql
--
--  Marks every existing branch with "Jeddah" in its name as
--  West region, and adds the new West-region branches under the
--  same company.
-- ============================================================

update public.branches
set region = 'West'
where name ilike '%jeddah%';

insert into public.branches (company_id, name, region, is_active, sort_order)
select b.company_id, v.name, 'West', true, 0
from (select distinct company_id from public.branches where name ilike '%jeddah%') b
cross join (values
  ('Taif'), ('Shawqiya'), ('Jizan'), ('Yanbu'), ('Alyat'), ('Rashed Madina')
) as v(name)
where not exists (
  select 1 from public.branches existing
  where existing.company_id = b.company_id and existing.name ilike v.name
);
