-- ============================================================
--  CHAT ATTACHMENTS (images + files)
--  Run AFTER 018_region_based_invites.sql
-- ============================================================

alter table public.chat_messages add column if not exists attachment_url  text;
alter table public.chat_messages add column if not exists attachment_type text check (attachment_type in ('image','file'));
alter table public.chat_messages add column if not exists attachment_name text;
