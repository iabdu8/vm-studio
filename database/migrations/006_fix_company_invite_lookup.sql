-- ============================================================
--  FIX: anonymous registrant couldn't look up a company by its
--  flat invite code (invite_code / vmc_invite_code) — the
--  `companies` table only allowed super_admin or an already
--  logged-in member of that company to SELECT, but step 1 of
--  registration happens before the person has any account.
-- ============================================================

create policy "public_read_companies_for_registration" on public.companies
  for select using (true);
