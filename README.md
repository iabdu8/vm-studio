# VM-Studio SaaS v2.0

Multi-tenant Visual Merchandising Operations Platform  
React + Vite + Supabase + PWA

---

## Quick Start (5 minutes)

### Step 1 — Supabase Project

1. Go to [supabase.com](https://supabase.com) → New Project
2. Open **SQL Editor** → run these files in order:
   - `database/schema.sql`
   - `database/rls.sql`
   - `database/seed.sql`
3. Go to **Project Settings → API** → copy:
   - Project URL
   - anon public key

### Step 2 — Environment

```bash
cp .env.example .env
# Edit .env and paste your Supabase values:
# VITE_SUPABASE_URL=https://xxxx.supabase.co
# VITE_SUPABASE_ANON_KEY=eyJ...
```

### Step 3 — Run

```bash
npm install
npm run dev
# Opens at http://localhost:3000
```

### Step 4 — Create your first Super Admin

In Supabase Dashboard → **Authentication → Users** → Invite user.  
Then in **SQL Editor**:

```sql
update public.profiles
set role = 'super_admin'
where id = 'your-user-uuid-here';
```

---

## Architecture

```
vm-studio-saas/
├── database/
│   ├── schema.sql          ← All tables + triggers
│   ├── rls.sql             ← Row Level Security policies
│   └── seed.sql            ← Demo companies + categories
│
├── src/
│   ├── lib/
│   │   └── supabase.js     ← Supabase client (reads .env)
│   │
│   ├── services/           ← All DB calls live here
│   │   ├── auth.service.js
│   │   ├── data.service.js       ← tasks, submissions, chat, guidelines
│   │   ├── categories.service.js
│   │   └── superadmin.service.js
│   │
│   ├── context/
│   │   └── AppContext.jsx  ← Global state: user, company, categories, settings
│   │
│   ├── types/
│   │   └── index.ts        ← TypeScript types for all DB tables
│   │
│   ├── components/
│   │   ├── shared/         ← TopBar, BottomNav, Chat, Guidelines, Atoms
│   │   ├── vm/             ← VMHome, VMTasks
│   │   ├── manager/        ← MgrOverview, MgrRequests, MgrAssign, MgrReports
│   │   └── superadmin/     ← SuperAdminPanel (companies, categories, users, settings)
│   │
│   ├── App.jsx             ← Root: auth gate + role-based shell
│   └── main.jsx            ← Entry + PWA service worker
│
├── public/
│   ├── manifest.json       ← PWA manifest
│   └── sw.js               ← Service worker (offline support)
│
├── .env.example            ← Copy to .env
└── package.json
```

---

## Database Schema

| Table | Purpose |
|-------|---------|
| `companies` | One row per brand/tenant |
| `company_settings` | Feature toggles per company |
| `branches` | Store locations per company |
| `profiles` | Users (extends Supabase auth) |
| `categories` | Dynamic categories per company |
| `subcategories` | Sections within categories |
| `tasks` | Assigned tasks per company |
| `submissions` | VM before/after reports |
| `submission_photos` | Supabase Storage references |
| `guidelines` | Uploaded manuals per company |
| `chat_messages` | Team + managers-only rooms |
| `activity_log` | Audit trail |

---

## Roles

| Role | Access |
|------|--------|
| `super_admin` | Everything — all companies, users, settings |
| `manager` | Their company — tasks, requests, reports, categories |
| `vm` | Their company — submit implementations, chat, guidelines |

**RLS ensures each role only sees their own company's data.**  
A manager from Company A can never read Company B's data.

---

## Adding a New Company (via Super Admin)

1. Sign in as Super Admin
2. Go to **🏢 Companies** → Create Company (name, slug, colors)
3. Go to **📂 Categories** → Select company → Add categories + sections
4. Invite users via Supabase Auth → assign them to company in **👥 Users**

No code changes needed. Everything is dynamic.

---

## Feature Toggles (per company)

Super Admin → **⚙️ Settings** → Select company → toggle on/off:

- 📈 Reports
- 💬 Chat
- 🔔 Notifications
- 📎 Photo attachments
- 🏆 Leaderboard
- 📖 Guideline books
- 📸 Max photos per submission

---

## Deploy to Vercel

```bash
# Option 1: CLI
npx vercel

# Option 2: GitHub → vercel.com → Import → Deploy
# Add env vars in Vercel dashboard under Settings → Environment Variables
```

Add these in Vercel environment variables:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

---

## PWA — Install on Phone

After deploying, open on mobile:
- **iOS Safari**: Share → "Add to Home Screen"
- **Android Chrome**: Menu → "Install App"

Works offline after first load.

---

## Supabase Storage Setup

Create two buckets in Supabase Storage:
- `vm-photos` — for submission before/after photos
- `vm-guidelines` — for guideline PDF/image uploads

Set both to **Public** for easy URL access.
