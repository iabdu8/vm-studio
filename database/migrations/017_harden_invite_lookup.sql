-- ============================================================
--  HARDEN INVITE-CODE LOOKUP  (SECURITY FIX)
--  Run AFTER 016_campaign_file_review.sql
--
--  Migrations 005/006 opened `select using (true)` on companies
--  and `select using (used_by is null)` on invites so an
--  anonymous registrant could look up a single code before having
--  a session. The problem: those policies apply to the WHOLE
--  table, not one row — anyone with the anon key could run
--  `select invite_code, vmc_invite_code from companies` (or
--  `select code, company_id, role from invites`) and harvest
--  every tenant's invite codes in one request, then self-register
--  as a VM Manager/Controller inside any company.
--
--  Fix: replace both blanket policies with SECURITY DEFINER
--  functions that return only the single matching row's public
--  fields for a code the caller already has — no bulk dump
--  possible. Branch names for the picker are served the same way.
-- ============================================================

drop policy if exists "public_read_companies_for_registration" on public.companies;
drop policy if exists "public_read_unused_invites"              on public.invites;

create or replace function public.lookup_company_by_code(p_code text)
returns table (id uuid, name text, logo_url text, accent_color text, role text)
language sql security definer stable
set search_path = public
as $$
  select id, name, logo_url, accent_color,
    case when invite_code = p_code then 'vm' when vmc_invite_code = p_code then 'manager' end as role
  from public.companies
  where invite_code = p_code or vmc_invite_code = p_code
  limit 1;
$$;
grant execute on function public.lookup_company_by_code(text) to anon, authenticated;

create or replace function public.lookup_scoped_invite(p_code text)
returns table (
  id uuid, company_id uuid, role text, branch_ids uuid[],
  company_name text, company_logo_url text, company_accent_color text
)
language sql security definer stable
set search_path = public
as $$
  select i.id, i.company_id, i.role, i.branch_ids,
    c.name, c.logo_url, c.accent_color
  from public.invites i
  join public.companies c on c.id = i.company_id
  where i.code = p_code and i.used_by is null
  limit 1;
$$;
grant execute on function public.lookup_scoped_invite(text) to anon, authenticated;

create or replace function public.lookup_active_branches(p_company_id uuid)
returns table (id uuid, name text)
language sql security definer stable
set search_path = public
as $$
  select id, name from public.branches
  where company_id = p_company_id and is_active = true
  order by sort_order;
$$;
grant execute on function public.lookup_active_branches(uuid) to anon, authenticated;
