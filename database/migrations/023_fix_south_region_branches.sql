-- ============================================================
--  FIX: "Rashed Madina" and "Rashed Abha" are two different
--  branches — migration 021 wrongly swept BOTH into South
--  because it matched any branch with "Rashed" in the name.
--  Run AFTER 022_multi_region_invites.sql
--
--  Correct split:
--    Rashed Madina -> West
--    Rashed Abha (renamed from the standalone "Abha" row
--      inserted by 021) + Jizan -> South
-- ============================================================

update public.branches
set region = 'West'
where name ilike '%rashed%' and name ilike '%madina%';

update public.branches
set name = 'Rashed Abha', region = 'South'
where name ilike 'abha' and name not ilike '%rashed%';

update public.branches
set region = 'South'
where name ilike '%jizan%';
