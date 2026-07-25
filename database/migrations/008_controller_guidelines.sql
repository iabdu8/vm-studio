-- ============================================================
--  VM Controller can also publish/manage guidelines for their branch
-- ============================================================

create policy "controller_manage_guidelines" on public.guidelines
  for all using (
    company_id = public.my_company_id() and public.is_controller()
  );
