-- ============================================================
--  Rename the demo company from "Fashion Demo" to "Vismo Demo",
--  and its invite codes from FASHION-* to DEMO-*.
--  Already applied directly to production via Supabase MCP.
-- ============================================================

update companies set
  name = 'Vismo Demo',
  slug = 'vismo-demo',
  invite_code = 'DEMO-VM',
  controller_invite_code = 'DEMO-CTRL',
  manager_invite_code = 'DEMO-MGR',
  vmc_invite_code = 'DEMO-HEAD'
where slug = 'fashion-demo';
