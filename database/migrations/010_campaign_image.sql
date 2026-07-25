-- ============================================================
--  Small cover image for the campaign banner/card
-- ============================================================

alter table public.campaigns add column if not exists image_path text;
