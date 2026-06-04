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
                check (role in ('super_admin','manager','vm')),
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
  room       text not null default 'team'
               check (room in ('team','managers')),
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
--  INDEXES
-- ============================================================
create index on public.profiles       (company_id);
create index on public.categories     (company_id, sort_order);
create index on public.subcategories  (category_id);
create index on public.tasks          (company_id, is_done);
create index on public.submissions    (company_id, status);
create index on public.chat_messages  (company_id, room, created_at);
create index on public.activity_log   (company_id, created_at desc);

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
