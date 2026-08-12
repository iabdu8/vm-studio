-- ============================================================
--  DEMO COMPANY: Fashion Demo — for sales showcases to clothing
--  retailers. Same 4-tier role structure as Homecentre, own invite
--  codes, own categories (fashion departments instead of furniture).
--  Already applied directly to production via Supabase MCP.
-- ============================================================

with new_company as (
  insert into public.companies (name, slug, primary_color, accent_color, is_active,
    invite_code, controller_invite_code, manager_invite_code, vmc_invite_code)
  values (
    'Fashion Demo', 'fashion-demo', '#1a1420', '#E85D75', true,
    'FASHION-VM', 'FASHION-CTRL', 'FASHION-MGR', 'FASHION-HEAD'
  )
  returning id
)
insert into public.company_settings (company_id)
select id from new_company;

with c as (select id from public.companies where slug = 'fashion-demo')
insert into public.branches (company_id, name, city, region, sort_order, is_active)
select c.id, v.name, v.city, v.region, v.sort_order, true
from c, (values
  ('Riyadh Gallery', 'Riyadh', 'Central', 1),
  ('Jeddah Gallery',  'Jeddah',  'West',    2)
) as v(name, city, region, sort_order);

with c as (select id from public.companies where slug = 'fashion-demo')
insert into public.categories (company_id, name, icon, sort_order, is_active)
select c.id, v.name, v.icon, v.sort_order, true
from c, (values
  ('Women',       '👗', 1),
  ('Men',         '👔', 2),
  ('Kids',        '🧸', 3),
  ('Shoes',       '👞', 4),
  ('Accessories', '👜', 5),
  ('Window',      '🪟', 6)
) as v(name, icon, sort_order);
