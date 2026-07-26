# AM SPORTS — Development Plan & Implementation Guide

## Project Overview
Convert the existing `AMSportsApp.jsx` prototype into a production-ready **Next.js 14** app with **TypeScript**, **Tailwind CSS**, and **Supabase** backend, following the simplified SDD (`NEW_AM_SPORTS_SDD.md`).

---

## 1. Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Framework | Next.js 14 (App Router) | Full-stack React framework, SSR/SSG, routing |
| Language | TypeScript | Type safety across data models |
| Styling | Tailwind CSS | Utility-first CSS, mobile-first |
| Icons | lucide-react | Consistent icon system |
| Backend | Supabase | Auth, Postgres, Realtime |
| Deployment | Vercel / Netlify / Cloudflare Pages | Hosting |

---

## 2. Project Structure

```
amsports/
├── app/
│   ├── layout.tsx           # Root layout + global styles
│   ├── page.tsx             # Public tournament list
│   ├── login/
│   │   └── page.tsx         # Login page
│   ├── tournament/
│   │   └── [id]/
│   │       └── page.tsx     # Public tournament detail (standings/fixtures/teams)
│   ├── admin/
│   │   ├── layout.tsx       # Admin layout with nav
│   │   └── page.tsx         # Admin dashboard (teams/pitches/tournaments/scoring/audit)
│   └── captain/
│       ├── layout.tsx       # Captain layout with nav
│       └── page.tsx         # Captain dashboard (roster/fixtures/lineup)
├── components/
│   ├── ui/                  # Reusable UI primitives (buttons, inputs, cards)
│   ├── admin/               # Admin-specific components
│   ├── captain/             # Captain-specific components
│   └── public/              # Public view components
├── lib/
│   ├── supabase.ts          # Supabase client initialization
│   ├── types.ts             # TypeScript interfaces
│   ├── seed.ts              # Seed data helpers
│   └── schedule.ts          # Round-robin scheduling logic
├── hooks/
│   └── useAuth.ts           # Auth state hook
├── supabase/
│   └── migrations/
│       └── 001_initial.sql  # Database schema
└── public/
    └── favicon.ico
```

---

## 3. Build Order (Step-by-Step)

### Step 1: Project Initialization
```bash
npx create-next-app@latest amsports --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm
cd amsports
npm install lucide-react @supabase/supabase-js date-fns
```

### Step 2: Database Schema
Create `supabase/migrations/001_initial.sql` with tables:
- `teams`, `players`, `pitches`, `tournaments`, `matches`, `lineups`, `users`, `audit_log`
- RLS policies for Captain/Admin access control
- Seed data (4 teams, 13 players, 1 pitch, 1 tournament with auto-generated matches)

### Step 3: Core Utilities
- `lib/types.ts` — TypeScript interfaces for all data models
- `lib/supabase.ts` — Server and client Supabase clients
- `lib/schedule.ts` — Port `generateMatchdays`, `autoSchedule`, `computeStandings` from prototype
- `lib/seed.ts` — Seed data functions

### Step 4: Layout & Theme
- `app/layout.tsx` — Root layout with navigation tabs (Public/Admin/Captain/Login)
- `app/globals.css` — Copy the custom CSS variables and styles from prototype
- Responsive navigation component

### Step 5: Public Pages (Read-Only)
- `app/page.tsx` — Tournament list
- `app/tournament/[id]/page.tsx` — Standings, fixtures, teams tabs
- Components: `MatchScoreboard`, `StandingsTable`, `TeamBadge`

### Step 6: Authentication
- `app/login/page.tsx` — Email login (prototype auth)
- `hooks/useAuth.ts` — Auth state management
- Middleware for protected routes (admin/captain)

### Step 7: Admin Pages
- `app/admin/page.tsx` — Tabbed dashboard:
  - Teams (create/delete/assign captain)
  - Pitches (create)
  - Tournaments (create with auto-schedule, delete)
  - Scoring (start/adjust/finish/postpone/reschedule/forfeit)
  - Audit log

### Step 8: Captain Pages
- `app/captain/page.tsx` — Tabbed dashboard:
  - Roster (add/remove players)
  - Fixtures (view team matches)
  - Lineup submission (select players, validate min 5)

### Step 9: Realtime & Polish
- Supabase Realtime subscriptions for live scores
- Mobile responsiveness testing
- Error handling and loading states
- Audit logging integration

---

## 4. Key Implementation Notes

### State Management
- No global state library needed — React Server Components + client state per page
- Auth state via Supabase session + custom hook
- Mutations via Supabase SDK (no REST API layer needed for v1)

### Routing Strategy
- Server Components for public pages (SEO friendly)
- Client Components (`"use client"`) for interactive admin/captain pages
- Dynamic routes for tournament details: `/tournament/[id]`

### Styling Approach
- Copy the CSS custom properties from `AMSportsApp.jsx` into `globals.css`
- Use Tailwind utility classes with custom CSS variables for theming
- Mobile-first responsive design (max-width containers)

### Data Flow
```
Public Page (Server Component)
  ├── Fetch data from Supabase
  ├── Render MatchScoreboard, StandingsTable
  └── Realtime subscription for live updates

Admin Page (Client Component)
  ├── Fetch data on mount
  ├── User interactions → Supabase mutations
  └── Realtime updates refresh local state
```

---

## 5. Environment Variables

Create `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

---

## 6. Testing Checklist

- [ ] Public tournament list loads
- [ ] Tournament detail shows standings/fixtures/teams
- [ ] Admin can log in with `admin@amsports.demo`
- [ ] Admin can create teams and assign captains
- [ ] Admin can create tournament with auto-schedule
- [ ] Admin can start/finish/adjust scores
- [ ] Captain can log in with `captain.comets@amsports.demo`
- [ ] Captain can add/remove players
- [ ] Captain can submit lineup (min 5 players)
- [ ] Realtime updates work without refresh
- [ ] Mobile responsive on 375px width

---

## 7. Next Actions

1. Run `npx create-next-app@latest amsports` to scaffold project
2. Set up Supabase project and run migration SQL
3. Copy scheduling logic from prototype to `lib/schedule.ts`
4. Build public pages first (no auth required)
5. Add auth and admin/captain pages
