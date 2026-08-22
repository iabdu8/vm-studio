-- ============================================================
--  Structured checklist for Floor Walks — a fixed list of standard
--  daily check points (First 10M, Recovery Status, etc.), each
--  toggled Done/Pending, instead of free-text notes.
--  Already applied directly to production via Supabase MCP.
-- ============================================================

alter table public.floor_walks add column if not exists checklist jsonb;
