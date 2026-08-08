-- ============================================================
--  TRAINING PERMISSIONS
--  Run AFTER 032_delete_own_chat_messages.sql
--
--  1. VM Manager (area_manager) can now create/edit trainings and
--     attendee records too, same as Head VM (the app's is_manager()
--     helper only covers 'manager'/'super_admin', so area_manager
--     needs its own explicit policy).
--  2. Any attendee (VM / VM Controller included) can update their
--     OWN attendance row — so they can check themselves in/out of
--     a scheduled training without needing edit rights on the rest.
-- ============================================================

create policy "area_manager_manage_trainings" on public.trainings
  for all using (
    company_id = public.my_company_id() and public.my_role() = 'area_manager'
  );

create policy "area_manager_manage_attendees" on public.training_attendees
  for all using (
    exists (
      select 1 from public.trainings t
      where t.id = training_id and t.company_id = public.my_company_id()
    ) and public.my_role() = 'area_manager'
  );

create policy "self_update_own_attendance" on public.training_attendees
  for update using (user_id = auth.uid())
  with check (user_id = auth.uid());
