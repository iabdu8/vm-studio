-- ============================================================
--  Let super_admin also issue branch-scoped invite codes for
--  the regular "vm" role (not just VM Manager / VM Controller),
--  so a VM's branch is deliberately assigned, not self-picked.
-- ============================================================

alter table public.invites drop constraint if exists invites_role_check;
alter table public.invites add constraint invites_role_check
  check (role in ('vm','area_manager','store_manager'));
