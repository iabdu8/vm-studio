-- ============================================================
--  CLEAN TEST DATA — keep accounts/companies/branches/categories,
--  wipe everything else (tasks, submissions, chat, campaigns,
--  promotions, demo holds, training, visits, floor walks,
--  guidelines, notifications, activity log).
--
--  DESTRUCTIVE — cannot be undone. Run in Supabase SQL Editor.
--  Skips any table that doesn't exist (schema drift-safe).
-- ============================================================

create or replace function pg_temp.wipe(tbl text)
returns void language plpgsql as $$
begin
  if to_regclass('public.' || tbl) is not null then
    execute format('delete from public.%I', tbl);
  end if;
end;
$$;

do $$
begin
  -- children first
  perform pg_temp.wipe('submission_photos');
  perform pg_temp.wipe('submissions');

  perform pg_temp.wipe('task_comments');
  perform pg_temp.wipe('campaign_comments');
  perform pg_temp.wipe('guideline_acks');
  perform pg_temp.wipe('campaign_acknowledgements');

  perform pg_temp.wipe('weekly_plan_items');
  perform pg_temp.wipe('weekly_plans');

  perform pg_temp.wipe('tasks');
  perform pg_temp.wipe('guidelines');
  perform pg_temp.wipe('chat_messages');
  perform pg_temp.wipe('activity_log');
  perform pg_temp.wipe('demo_holds');

  perform pg_temp.wipe('visit_findings');
  perform pg_temp.wipe('store_visits');

  perform pg_temp.wipe('floor_walk_photos');
  perform pg_temp.wipe('floor_walks');

  perform pg_temp.wipe('training_attendees');
  perform pg_temp.wipe('trainings');

  perform pg_temp.wipe('campaign_branches');
  perform pg_temp.wipe('campaigns');

  perform pg_temp.wipe('promotion_branches');
  perform pg_temp.wipe('promotions');

  perform pg_temp.wipe('notifications');
  perform pg_temp.wipe('push_subscriptions');

  raise notice 'Done. Kept: profiles, companies, branches, categories, invites, manager_branches.';
end $$;
