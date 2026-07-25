-- ============================================================
--  weekly_plan_items.category_id had no declared foreign key to
--  categories(id) — the data was correct, but Supabase's API
--  couldn't auto-embed the category name/icon without it.
-- ============================================================

do $$
begin
  if not exists (
    select 1 from information_schema.table_constraints
    where constraint_name = 'weekly_plan_items_category_id_fkey'
      and table_name = 'weekly_plan_items'
  ) then
    alter table public.weekly_plan_items
      add constraint weekly_plan_items_category_id_fkey
      foreign key (category_id) references public.categories(id) on delete set null;
  end if;
end $$;
