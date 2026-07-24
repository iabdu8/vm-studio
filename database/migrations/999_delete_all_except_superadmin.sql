-- ============================================================
--  DELETE ALL ACCOUNTS EXCEPT iabdu8@outlook.com
--  DESTRUCTIVE — cannot be undone. Run in Supabase SQL Editor.
--
--  Deletes every dependent row created by / referencing the
--  profiles being removed, then the profiles, then the auth
--  users. Skips any table that doesn't exist in this database
--  (schema drift-safe) instead of erroring out.
-- ============================================================

create or replace function pg_temp.del_except(tbl text, col text, keep_id uuid)
returns void language plpgsql as $$
begin
  if to_regclass('public.' || tbl) is not null then
    execute format('delete from public.%I where %I is distinct from %L', tbl, col, keep_id);
  end if;
end;
$$;

do $$
declare
  keep_id uuid;
begin
  select id into keep_id from auth.users where lower(email) = 'iabdu8@outlook.com';

  if keep_id is null then
    raise exception 'Could not find iabdu8@outlook.com in auth.users — aborting, nothing deleted.';
  end if;

  -- comments / acknowledgements
  perform pg_temp.del_except('task_comments',             'author_id',        keep_id);
  perform pg_temp.del_except('campaign_comments',          'author_id',        keep_id);
  perform pg_temp.del_except('campaign_acknowledgements',  'acknowledged_by',  keep_id);
  perform pg_temp.del_except('guideline_acks',             'user_id',          keep_id);

  -- submission photos, then submissions
  if to_regclass('public.submission_photos') is not null and to_regclass('public.submissions') is not null then
    execute format(
      'delete from public.submission_photos where submission_id in (select id from public.submissions where submitted_by is distinct from %L or reviewed_by is distinct from %L)',
      keep_id, keep_id
    );
  end if;
  if to_regclass('public.submissions') is not null then
    execute format(
      'delete from public.submissions where submitted_by is distinct from %L or reviewed_by is distinct from %L',
      keep_id, keep_id
    );
  end if;

  -- weekly plans (unlink tasks first so deleting tasks below doesn't block)
  if to_regclass('public.weekly_plan_items') is not null and to_regclass('public.tasks') is not null then
    execute format(
      'update public.weekly_plan_items set task_id = null where task_id in (select id from public.tasks where created_by is distinct from %L)',
      keep_id
    );
  end if;
  perform pg_temp.del_except('weekly_plan_items', 'assigned_staff_id', keep_id);
  perform pg_temp.del_except('weekly_plans',      'created_by',        keep_id);

  -- tasks
  perform pg_temp.del_except('tasks', 'created_by', keep_id);

  -- guidelines / chat / activity / demo holds
  perform pg_temp.del_except('guidelines',    'uploaded_by', keep_id);
  perform pg_temp.del_except('chat_messages', 'sender_id',   keep_id);
  perform pg_temp.del_except('activity_log',  'user_id',     keep_id);
  perform pg_temp.del_except('demo_holds',    'added_by',    keep_id);

  -- store visits / floor walks / trainings
  if to_regclass('public.visit_findings') is not null and to_regclass('public.store_visits') is not null then
    execute format(
      'delete from public.visit_findings where visit_id in (select id from public.store_visits where visitor_id is distinct from %L)',
      keep_id
    );
  end if;
  perform pg_temp.del_except('store_visits', 'visitor_id', keep_id);

  if to_regclass('public.floor_walk_photos') is not null and to_regclass('public.floor_walks') is not null then
    execute format(
      'delete from public.floor_walk_photos where floor_walk_id in (select id from public.floor_walks where added_by is distinct from %L)',
      keep_id
    );
  end if;
  perform pg_temp.del_except('floor_walks', 'added_by', keep_id);

  perform pg_temp.del_except('training_attendees', 'user_id',    keep_id);
  perform pg_temp.del_except('trainings',          'created_by', keep_id);

  -- campaigns / promotions
  if to_regclass('public.campaign_branches') is not null and to_regclass('public.campaigns') is not null then
    execute format(
      'delete from public.campaign_branches where campaign_id in (select id from public.campaigns where created_by is distinct from %L)',
      keep_id
    );
  end if;
  perform pg_temp.del_except('campaigns', 'created_by', keep_id);

  if to_regclass('public.promotion_branches') is not null and to_regclass('public.promotions') is not null then
    execute format(
      'delete from public.promotion_branches where promotion_id in (select id from public.promotions where created_by is distinct from %L)',
      keep_id
    );
  end if;
  perform pg_temp.del_except('promotions', 'created_by', keep_id);

  -- role-hierarchy tables
  perform pg_temp.del_except('manager_branches', 'manager_id', keep_id);
  if to_regclass('public.invites') is not null then
    execute format(
      'delete from public.invites where created_by is distinct from %L or used_by is distinct from %L',
      keep_id, keep_id
    );
  end if;

  -- notifications / push subscriptions (if present)
  perform pg_temp.del_except('notifications',      'user_id', keep_id);
  perform pg_temp.del_except('push_subscriptions', 'user_id', keep_id);

  -- finally the auth users (profiles cascade from this delete)
  delete from auth.users where id <> keep_id;

  raise notice 'Done. Kept profile/user id: %', keep_id;
end $$;
