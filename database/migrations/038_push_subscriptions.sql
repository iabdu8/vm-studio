-- ============================================================
--  PUSH SUBSCRIPTIONS — table was defined in schema.sql/rls.sql
--  but was never actually created on the live database. Required
--  for real push notifications (send-push edge function).
-- ============================================================

create table if not exists public.push_subscriptions (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  company_id   uuid not null references public.companies(id) on delete cascade,
  subscription text not null,
  created_at   timestamptz not null default now(),
  unique(user_id)
);

alter table public.push_subscriptions enable row level security;

drop policy if exists "user_manage_own_push_sub" on public.push_subscriptions;
create policy "user_manage_own_push_sub" on public.push_subscriptions
  for all using (user_id = auth.uid());
