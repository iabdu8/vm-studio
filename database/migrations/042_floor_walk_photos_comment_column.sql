-- ============================================================
--  floor_walk_photos was missing a `comment` column that
--  handleFwFiles() always tried to insert — every single photo
--  insert failed at the DB level, and the resulting undefined row
--  got pushed into React state and crashed the render on the very
--  next paint (white screen). Same class of bug as 041, in the
--  child table this time.
--  Already applied directly to production via Supabase MCP.
-- ============================================================

alter table public.floor_walk_photos add column if not exists comment text;
