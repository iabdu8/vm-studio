insert into public.manager_branches (manager_id, branch_id)
select '006f2830-5ce6-471b-8b58-a1a65133bb87', b.id
from public.branches b
where b.name ilike any (array['%Bawadi%', '%Haddab%', '%Jeddah Park%']);
