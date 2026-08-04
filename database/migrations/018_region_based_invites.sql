-- ============================================================
--  REGION-BASED VM MANAGER INVITES + SELF-SERVICE BRANCH PICKING
--  Run AFTER 017_harden_invite_lookup.sql
--
--  New model:
--   - VM and VM Controller invites are now flat, company-wide
--     codes (like VM already had) — the registrant picks their
--     own single branch at signup, super_admin no longer presets it.
--   - VM Manager invites are scoped to a REGION (e.g. "Central",
--     "Western") instead of specific branches — the registrant
--     picks which branch(es) within that region they manage.
-- ============================================================

alter table public.branches add column if not exists region text;
alter table public.invites  add column if not exists region text;
alter table public.invites  alter column branch_ids drop not null;
alter table public.companies add column if not exists controller_invite_code text unique;

-- ── Flat company-code lookup: now also covers the Controller code ──
create or replace function public.lookup_company_by_code(p_code text)
returns table (id uuid, name text, logo_url text, accent_color text, role text)
language sql security definer stable
set search_path = public
as $$
  select id, name, logo_url, accent_color,
    case
      when invite_code = p_code then 'vm'
      when vmc_invite_code = p_code then 'manager'
      when controller_invite_code = p_code then 'store_manager'
    end as role
  from public.companies
  where invite_code = p_code or vmc_invite_code = p_code or controller_invite_code = p_code
  limit 1;
$$;
grant execute on function public.lookup_company_by_code(text) to anon, authenticated;

-- ── Scoped invite lookup: return type changed (added `region`), must drop first ──
drop function if exists public.lookup_scoped_invite(text);
create function public.lookup_scoped_invite(p_code text)
returns table (
  id uuid, company_id uuid, role text, branch_ids uuid[], region text,
  company_name text, company_logo_url text, company_accent_color text
)
language sql security definer stable
set search_path = public
as $$
  select i.id, i.company_id, i.role, i.branch_ids, i.region,
    c.name, c.logo_url, c.accent_color
  from public.invites i
  join public.companies c on c.id = i.company_id
  where i.code = p_code and i.used_by is null
  limit 1;
$$;
grant execute on function public.lookup_scoped_invite(text) to anon, authenticated;

-- ── Branches within a region, for the VM Manager's self-service picker ──
create or replace function public.lookup_branches_by_region(p_company_id uuid, p_region text)
returns table (id uuid, name text)
language sql security definer stable
set search_path = public
as $$
  select id, name from public.branches
  where company_id = p_company_id and is_active = true and region = p_region
  order by sort_order;
$$;
grant execute on function public.lookup_branches_by_region(uuid, text) to anon, authenticated;
