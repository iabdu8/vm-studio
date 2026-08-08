-- ============================================================
--  DELETE OWN CHAT MESSAGES
--  Run AFTER 031_best_branch_per_region.sql
-- ============================================================

create policy "self_delete_chat_messages" on public.chat_messages
  for delete using (sender_id = auth.uid());
