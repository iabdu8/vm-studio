-- ============================================================
--  VM Manager can also publish/manage guidelines (not just Head VM)
-- ============================================================

create policy "area_manager_manage_guidelines" on public.guidelines
  for all using (
    company_id = public.my_company_id() and public.is_area_manager()
  );
