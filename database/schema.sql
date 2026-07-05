-- ============================================================
--  VM-STUDIO — SUPABASE SCHEMA
--  Run this entire file in Supabase SQL Editor
-- ============================================================

-- ── Extensions ──────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ============================================================
--  1. COMPANIES
-- ============================================================
create table public.companies (
  id            uuid primary key default uuid_generate_v4(),
  name          text not null,
  slug          text not null unique,          -- e.g. "homecentre", "hm"
  logo_url      text,
  primary_color text not null default '#c8a96e',
  accent_color  text not null default '#c8a96e',
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ============================================================
--  2. COMPANY SETTINGS  (feature toggles per company)
-- ============================================================
create table public.company_settings (
  id                    uuid primary key default uuid_generate_v4(),
  company_id            uuid not null references public.companies(id) on delete cascade,
  enable_reports        boolean not null default true,
  enable_chat           boolean not null default true,
  enable_notifications  boolean not null default true,
  enable_attachments    boolean not null default true,
  enable_leaderboard    boolean not null default true,
  enable_guidelines     boolean not null default true,
  max_photo_upload      int  not null default 10,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  unique(company_id)
);

-- ============================================================
--  3. BRANCHES
-- ============================================================
create table public.branches (
  id         uuid primary key default uuid_generate_v4(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name       text not null,
  city       text,
  is_active  boolean not null default true,
  sort_order int  not null default 0,
  created_at timestamptz not null default now()
);

-- ============================================================
--  4. PROFILES  (extends Supabase auth.users)
-- ============================================================
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  company_id  uuid references public.companies(id) on delete set null,
  branch_id   uuid references public.branches(id)  on delete set null,
  full_name   text not null,
  avatar_initials text,
  role        text not null default 'vm'
                check (role in ('super_admin','manager','area_manager','store_manager','vm')),
  employee_id text,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ============================================================
--  5. CATEGORIES  (dynamic — replaces hardcoded divisions)
-- ============================================================
create table public.categories (
  id         uuid primary key default uuid_generate_v4(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name       text not null,
  icon       text not null default '📦',
  sort_order int  not null default 0,
  is_active  boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
--  6. SUBCATEGORIES  (sections within a category)
-- ============================================================
create table public.subcategories (
  id          uuid primary key default uuid_generate_v4(),
  company_id  uuid not null references public.companies(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  name        text not null,
  sort_order  int  not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

-- ============================================================
--  7. TASKS
-- ============================================================
create table public.tasks (
  id              uuid primary key default uuid_generate_v4(),
  company_id      uuid not null references public.companies(id) on delete cascade,
  category_id     uuid references public.categories(id)    on delete set null,
  subcategory_id  uuid references public.subcategories(id) on delete set null,
  created_by      uuid not null references public.profiles(id),
  assigned_to     text not null default 'all',   -- 'all' | profile uuid
  title           text not null,
  priority        text not null default 'medium'
                    check (priority in ('high','medium','low')),
  due_label       text not null default 'Today', -- 'Today','Tomorrow','This week','Next week'
  is_done         boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ============================================================
--  8. SUBMISSIONS  (VM before/after reports)
-- ============================================================
create table public.submissions (
  id              uuid primary key default uuid_generate_v4(),
  company_id      uuid not null references public.companies(id) on delete cascade,
  submitted_by    uuid not null references public.profiles(id),
  branch_id       uuid references public.branches(id) on delete set null,
  category_id     uuid references public.categories(id)    on delete set null,
  subcategory_id  uuid references public.subcategories(id) on delete set null,
  task_id         uuid references public.tasks(id) on delete set null,
  status          text not null default 'pending'
                    check (status in ('pending','approved','revision')),
  note            text,
  score           int check (score >= 0 and score <= 100),
  reviewed_by     uuid references public.profiles(id),
  reviewed_at     timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ============================================================
--  9. SUBMISSION PHOTOS
-- ============================================================
create table public.submission_photos (
  id            uuid primary key default uuid_generate_v4(),
  submission_id uuid not null references public.submissions(id) on delete cascade,
  storage_path  text not null,       -- Supabase Storage path
  photo_type    text not null check (photo_type in ('before','after')),
  created_at    timestamptz not null default now()
);

-- ============================================================
--  10. GUIDELINES
-- ============================================================
create table public.guidelines (
  id            uuid primary key default uuid_generate_v4(),
  company_id    uuid not null references public.companies(id) on delete cascade,
  uploaded_by   uuid not null references public.profiles(id),
  title         text not null,
  category      text not null default 'General',
  storage_path  text,               -- Supabase Storage path
  file_type     text default 'doc' check (file_type in ('doc','pdf','img')),
  page_count    int,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now()
);

-- ============================================================
--  11. CHAT MESSAGES
-- ============================================================
create table public.chat_messages (
  id         uuid primary key default uuid_generate_v4(),
  company_id uuid not null references public.companies(id) on delete cascade,
  sender_id  uuid not null references public.profiles(id),
  room       text not null default 'team',
  body       text not null,
  created_at timestamptz not null default now()
);

-- ============================================================
--  12. ACTIVITY LOG
-- ============================================================
create table public.activity_log (
  id         uuid primary key default uuid_generate_v4(),
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id    uuid not null references public.profiles(id),
  action     text not null,
  detail     text,
  created_at timestamptz not null default now()
);

-- ============================================================
--  13. NOTIFICATIONS
-- ============================================================
create table public.notifications (
  id         uuid primary key default uuid_generate_v4(),
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id    uuid not null references public.profiles(id)  on delete cascade,
  type       text not null,
  title      text not null,
  body       text,
  is_read    boolean not null default false,
  created_at timestamptz not null default now()
);

-- ============================================================
--  14. PUSH SUBSCRIPTIONS
-- ============================================================
create table public.push_subscriptions (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  company_id   uuid not null references public.companies(id) on delete cascade,
  subscription text not null,
  created_at   timestamptz not null default now(),
  unique(user_id)
);

-- ============================================================
--  15. DEMO HOLDS
-- ============================================================
create table public.demo_holds (
  id         uuid primary key default uuid_generate_v4(),
  company_id uuid not null references public.companies(id) on delete cascade,
  added_by   uuid not null references public.profiles(id),
  branch_id  uuid references public.branches(id) on delete set null,
  item_code  text not null,
  note       text,
  time       text,
  created_at timestamptz not null default now()
);

-- ============================================================
--  16. CAMPAIGNS
-- ============================================================
create table public.campaigns (
  id         uuid primary key default uuid_generate_v4(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name       text not null,
  date_from  date,
  date_to    date,
  is_active  boolean not null default true,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

-- ============================================================
--  17. CAMPAIGN BRANCHES
-- ============================================================
create table public.campaign_branches (
  id          uuid primary key default uuid_generate_v4(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  branch_id   uuid not null references public.branches(id) on delete cascade,
  status      text not null default 'not_started'
                check (status in ('not_started','in_progress','completed')),
  updated_at  timestamptz not null default now(),
  unique(campaign_id, branch_id)
);

-- ============================================================
--  18. PROMOTIONS
-- ============================================================
create table public.promotions (
  id         uuid primary key default uuid_generate_v4(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name       text not null,
  date_from  date not null,
  date_to    date not null,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

-- ============================================================
--  19. PROMOTION BRANCHES
-- ============================================================
create table public.promotion_branches (
  id           uuid primary key default uuid_generate_v4(),
  promotion_id uuid not null references public.promotions(id) on delete cascade,
  branch_id    uuid not null references public.branches(id) on delete cascade,
  unique(promotion_id, branch_id)
);

-- ============================================================
--  20. FLOOR WALKS
-- ============================================================
create table public.floor_walks (
  id         uuid primary key default uuid_generate_v4(),
  company_id uuid not null references public.companies(id) on delete cascade,
  added_by   uuid not null references public.profiles(id),
  branch_id  uuid references public.branches(id) on delete set null,
  manager    text,
  note       text,
  date       text,
  created_at timestamptz not null default now()
);

-- ============================================================
--  21. FLOOR WALK PHOTOS
-- ============================================================
create table public.floor_walk_photos (
  id            uuid primary key default uuid_generate_v4(),
  floor_walk_id uuid not null references public.floor_walks(id) on delete cascade,
  url           text not null,
  comment       text,
  created_at    timestamptz not null default now()
);

-- ============================================================
--  22. STORE VISITS
-- ============================================================
create table public.store_visits (
  id         uuid primary key default uuid_generate_v4(),
  company_id uuid not null references public.companies(id) on delete cascade,
  branch_id  uuid references public.branches(id) on delete set null,
  visitor_id uuid not null references public.profiles(id),
  visit_date date not null,
  notes      text,
  status     text not null default 'submitted'
               check (status in ('draft','submitted','reviewed','closed')),
  created_at timestamptz not null default now()
);

-- ============================================================
--  23. VISIT FINDINGS
-- ============================================================
create table public.visit_findings (
  id             uuid primary key default uuid_generate_v4(),
  visit_id       uuid not null references public.store_visits(id) on delete cascade,
  finding        text not null,
  recommendation text,
  image_url      text,
  task_id        uuid references public.tasks(id) on delete set null,
  created_at     timestamptz not null default now()
);

-- ============================================================
--  24. TRAININGS
-- ============================================================
create table public.trainings (
  id         uuid primary key default uuid_generate_v4(),
  company_id uuid not null references public.companies(id) on delete cascade,
  title      text not null,
  trainer    text not null,
  date       date not null,
  location   text,
  notes      text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

-- ============================================================
--  25. TRAINING ATTENDEES
-- ============================================================
create table public.training_attendees (
  id          uuid primary key default uuid_generate_v4(),
  training_id uuid not null references public.trainings(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  status      text not null default 'pending'
                check (status in ('pending','present','absent')),
  score       int  check (score >= 0 and score <= 100),
  note        text,
  updated_at  timestamptz not null default now(),
  unique(training_id, user_id)
);

-- ============================================================
--  26. GUIDELINE ACKNOWLEDGEMENTS
-- ============================================================
create table public.guideline_acks (
  id           uuid primary key default uuid_generate_v4(),
  guideline_id uuid not null references public.guidelines(id) on delete cascade,
  user_id      uuid not null references public.profiles(id) on delete cascade,
  acked_at     timestamptz not null default now(),
  unique(guideline_id, user_id)
);

-- Add is_required column to guidelines (used in VMGuidelines component)
alter table public.guidelines add column if not exists is_required boolean not null default false;

-- Add invite codes to companies (used in RegisterPage)
alter table public.companies add column if not exists invite_code         text unique;
alter table public.companies add column if not exists vmc_invite_code     text unique;
alter table public.companies add column if not exists manager_invite_code text unique;

-- ============================================================
--  INDEXES
-- ============================================================
create index on public.profiles            (company_id);
create index on public.categories          (company_id, sort_order);
create index on public.subcategories       (category_id);
create index on public.tasks               (company_id, is_done);
create index on public.submissions         (company_id, status);
create index on public.chat_messages       (company_id, room, created_at);
create index on public.activity_log        (company_id, created_at desc);
create index on public.notifications       (user_id, is_read, created_at desc);
create index on public.demo_holds          (company_id, created_at desc);
create index on public.store_visits        (company_id, created_at desc);
create index on public.floor_walks         (company_id, created_at desc);
create index on public.trainings           (company_id, date desc);
create index on public.campaign_branches   (campaign_id);

-- ============================================================
--  UPDATED_AT TRIGGER
-- ============================================================
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_companies_updated    before update on public.companies    for each row execute function public.set_updated_at();
create trigger trg_settings_updated     before update on public.company_settings for each row execute function public.set_updated_at();
create trigger trg_profiles_updated     before update on public.profiles     for each row execute function public.set_updated_at();
create trigger trg_tasks_updated        before update on public.tasks        for each row execute function public.set_updated_at();
create trigger trg_submissions_updated  before update on public.submissions  for each row execute function public.set_updated_at();

-- ============================================================
--  AUTO-CREATE PROFILE ON SIGN UP
-- ============================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, full_name, avatar_initials)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    upper(left(coalesce(new.raw_user_meta_data->>'full_name', new.email), 2))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
