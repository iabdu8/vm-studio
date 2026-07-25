-- ============================================================
--  FIX: registrant couldn't read/redeem/claim an invite code
--
--  The `invites` table (migration 001) only had a super_admin
--  policy — but a brand-new registrant is anonymous when they
--  look up the code, and is only their own (non-admin) account
--  right after signup when the app marks the code used and
--  writes their manager_branches row. Both were blocked by RLS.
-- ============================================================

-- Anyone can look up an UNUSED invite by code (needed pre-login, at signup step 1)
create policy "public_read_unused_invites" on public.invites
  for select using (used_by is null);

-- A user can claim an unused invite for themselves (used_by must equal their own id)
create policy "self_claim_invite" on public.invites
  for update using (used_by is null)
  with check (used_by = auth.uid());

-- A user can write their own manager_branches row (branches came from the invite they just redeemed)
create policy "self_insert_manager_branches" on public.manager_branches
  for insert with check (manager_id = auth.uid());
