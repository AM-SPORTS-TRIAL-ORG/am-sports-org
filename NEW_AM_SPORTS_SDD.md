# Software Design Document (SDD) — v2, Simplified Scope
## AM SPORTS: Round-Robin Tournament Platform

**Version:** 2.0 (Supersedes v1.0 full-system SDD for the current build phase)
**Date:** July 26, 2026

---

## 0. What Changed and Why

This version narrows the system to exactly what's needed to get a real, working app live — no more, no less. Everything from the original full-system SRS/SDD (payments, discipline tracking, knockout brackets, analytics, etc.) is still valid future scope, but it's **not part of this design**. This document describes only:

1. Round-robin tournaments (no knockout/bracket for now)
2. Admin: manage teams, tournaments (create/edit/delete), pitches, and match scheduling (date/time)
3. Live scoring for in-progress matches
4. A fully working public site (no login needed to view)
5. Admin accounts (sign in)
6. Team Captain accounts (sign in) — manage their own team's roster and match-day lineup

Keeping it this small is the right call — a working simple system beats a half-built complex one.

---

## 1. Architecture (unchanged)

```
Browser (mobile/desktop)
        │
Next.js App (React) — hosted on Vercel or Netlify or Cloudflare Pages
        │
        ├── Supabase Auth        (Admin + Captain login)
        ├── Supabase Postgres    (+ Realtime for live scores)
        └── Supabase Storage     (team badges — optional, can wait)
```

Nothing about the underlying stack changes — this is the same foundation as before, just building a smaller, well-defined slice of it first.

---

## 2. User Roles (simplified to three)

| Role | Can do | Needs login? |
|---|---|---|
| **Public** | View tournaments, standings, fixtures, live scores, teams | No |
| **Team Captain** | Manage their own team's player roster; set the starting lineup for their upcoming match; view their team's schedule | Yes |
| **Admin** | Everything: create/edit/delete tournaments, manage teams and pitches, schedule matches, enter live scores, confirm results | Yes |

That's it — no Sponsor role, no Scorer-as-a-separate-role for now. **Admin does the live scoring themselves** in this version (simplest possible setup — you can split "Scorer" out as its own role later without any redesign, just add the role check).

---

## 3. Data Model (simplified)

```
Team
  id, name, badge_url (optional), captain_user_id

Player
  id, team_id, name, jersey_number

Tournament
  id, name, start_date, end_date, status (upcoming/active/completed)
  match_duration_minutes, gap_minutes, daily_start_time, daily_end_time
  points_win (default 3), points_draw (default 1)
  format is always 'round_robin' — no format field needed at all right now

Pitch
  id, name (e.g. "Pitch 1", "Main Field")

TournamentPitch
  tournament_id, pitch_id   — which pitches are available to a given tournament

Match
  id, tournament_id, home_team_id, away_team_id,
  pitch_id, scheduled_time, matchday (round number),
  home_score, away_score,
  status (scheduled / live / finished / postponed / forfeited)

Lineup
  id, match_id, team_id, player_id  — which players are starting for which team, in which match

User
  id, email, role (admin / captain), team_id (only set if role = captain)

AuditLog
  id, actor_user_id, match_id, action (e.g. "score_corrected", "match_postponed"), old_value, new_value, timestamp
```

**That's the whole schema.** Compare this to the full-system version — no `Registration` approval table, no `Dispute`, no `Payment`, no `Sponsor`. Team-to-tournament participation is just: when Admin creates a tournament, they pick the teams directly, and the system generates round-robin matches immediately. No approval workflow needed at this stage — Admin already trusts who they're adding.

**Standings**: still never stored — always calculated on the fly from finished `Match` rows, same principle as before. This is simple to build and impossible to get out of sync.

---

## 4. Module Design

### 4.1 Admin: Team Management
- Create a team (name, optional badge)
- Assign or invite a Captain to a team (sets `Team.captain_user_id`)
- Edit or delete a team (deleting should be blocked if the team has matches scheduled in an active tournament — simple guard rail, avoids orphaned matches)

### 4.2 Admin: Tournament Management
- Create a tournament: name, date range, pick participating teams
- On creation, system **auto-generates the full round-robin schedule** (every team plays every other team once) — matches are created with `status = scheduled` and no pitch/time yet
- Edit tournament details; delete a tournament (cascades to delete its matches — confirm before deleting, this is destructive)

### 4.3 Admin: Pitch & Automatic Scheduling

- Add pitches (most tournaments will just have one — "Main Pitch" — but the system supports more)
- When creating a tournament, Admin also sets a few simple scheduling inputs:
  - Match duration (e.g. 60 minutes) + gap between matches (e.g. 15 minutes)
  - Which pitches are available for this tournament
  - Which dates/days the tournament runs on (e.g. every Saturday from the start date, or a fixed list of gala dates)
  - Daily start/end time (e.g. 9:00–17:00)
- **Fixtures are generated using the "circle method"** — the standard way to build a fair round-robin: teams are grouped into **matchdays** (rounds), where every team plays at most once per matchday. If there's an odd number of teams, one team gets a "bye" each round automatically — nobody has to think about this by hand.
- The scheduler then walks through each matchday in order and:
  1. Assigns it to the next available tournament date
  2. Distributes that matchday's matches across the available pitches and time slots, so a pitch is never double-booked and no team plays twice on the same day
  3. If there are more matches in a matchday than pitch-slots available that day, it spills the remainder into the next available slot/day automatically, rather than overlapping anything
- **Admin sees the full generated schedule** (date, time, pitch, teams) and can manually override any single match's time or pitch afterward if something real-world comes up (e.g. a pitch becomes unavailable) — automatic by default, editable when needed.
- If Admin changes a tournament-level setting after fixtures are generated (e.g. adds a pitch, changes match duration), offer a "regenerate schedule" action rather than trying to patch the existing one — much simpler and less error-prone than incremental rescheduling logic.

### 4.4 Live Scoring
- Admin selects a `scheduled` match and marks it `live`
- While `live`, Admin adjusts `home_score`/`away_score` with simple +/− controls
- The `Match` row updates in Postgres on every change; Supabase Realtime pushes that change to anyone viewing the public match/tournament page — this is what makes it feel "live" with no refresh
- Admin marks the match `finished` when it's done — standings recalculate automatically since they're computed fresh from `Match` data, not stored

### 4.5 Public Site
- Homepage: list of tournaments (upcoming/active/completed)
- Tournament page: standings table (always current), fixtures list (with pitch + time), results
- Team page: roster, upcoming matches
- Live match: score updates in real time without refresh (same Realtime subscription as internally)
- No login required anywhere in this section

### 4.6 Authentication
- Supabase Auth handles login for both Admin and Captain — same login form, the system checks `User.role` after login and sends them to the right dashboard
- Admin accounts: created directly (you, as the person running this, are the first Admin — set this manually in the database once, then Admin can invite others if needed)
- Captain accounts: Admin creates the team, then either invites the captain by email (Supabase Auth supports invite links) or the captain signs up and Admin links their account to the team afterward — simplest version: **Admin creates the login and tells the captain their credentials**, no self-serve signup needed yet

### 4.7 Team Captain Dashboard
- View their team's roster; add or remove players (name + jersey number)
- View their team's upcoming and past matches
- Before an upcoming match, submit the **starting lineup**: pick which roster players are playing (writes `Lineup` rows for that match)
- That's the full captain feature set for now — deliberately minimal. Things like requesting a lineup change mid-match, uploading team photos, or messaging the admin are good additions later, not needed to have a working system today.

---

## 5. Other Important Things Worth Building In

A few things that don't show up until a tournament is actually running, worth designing for now rather than discovering mid-event:

### 5.1 Standings rules
- Points system (win/draw) is a tournament-level setting, defaulting to 3 for a win, 1 for a draw — matches what you'd expect, but keep it configurable per tournament rather than hardcoded
- Tie-breaker order: points → goal difference → goals scored → alphabetical (as a final, deterministic fallback so the table never has an "undefined" order)

### 5.2 Score correction audit trail
- Since Admin is entering scores live, mistakes will happen (wrong button tapped, wrong team). Every score change and every match status change writes an `AuditLog` row (who, what changed, when). This isn't optional polish — it's what lets you answer "wait, why does this table look wrong?" after the fact, and it directly supports trust in the results you publish.

### 5.3 Postponement & forfeits
- Real football tournaments hit rain-outs and no-shows. Give a match a `postponed` status (Admin can reschedule it — pick a new date/pitch/time, same validation as initial scheduling applies) and a `forfeited` status (one team didn't show; Admin records the result as a standard win, e.g. 3–0, for the record — but the audit log notes it was a forfeit, not an on-pitch result, so you have that context later)

### 5.4 Lineup validation
- Prevent a captain from submitting an empty or under-strength lineup (e.g. require a minimum number of players — configurable, football is normally 11 but small-sided galas may use fewer)
- Lock lineup submission once a match goes `live` — a captain shouldn't be able to change their starting lineup after kickoff

### 5.5 Security specifics (this matters more than it sounds)
- Supabase Row Level Security (RLS) policies should enforce, at the database level, that a Captain can only read/write their **own** team's roster and lineups — not just hidden in the UI, actually blocked server-side. This is the same principle as `NFR-SEC-02` from the original SRS, just concretely specified here for this scope.
- Only Admin accounts can change match scores or tournament/pitch data — enforced the same way.

### 5.6 Team withdrawal mid-tournament
- If a team has to drop out after fixtures are generated, decide the behavior up front: their remaining scheduled matches become forfeits (simplest), rather than leaving dangling matches with no clear outcome.

### 5.7 Mobile-first, still
- Everything above is easy to overbuild for desktop and forget that Admin will likely be doing live scoring from a phone on the sideline — same principle as the original design, worth restating since it's easy to lose sight of while focused on scheduling logic.

---

## 6. How Live Scoring Works (same mechanism as before, worth restating simply)

1. Admin opens the live match screen, taps "+1" for a team
2. That writes directly to the `Match` row in Postgres
3. Supabase Realtime notices the row changed and pushes it to every browser currently subscribed to that match (fans on the public site, the captain checking their team's game)
4. Everyone sees the new score within a couple of seconds, no refresh
5. When Admin taps "Finish," the match locks and standings update (calculated fresh, nothing extra to trigger)

---

## 7. Build Order (sequenced — build in this order, each step is a visible milestone)

1. **Public site, read-only** — tournament list, standings, fixtures (even with fake/seeded data at first) → deploy this early
2. **Admin auth + team management** — log in as Admin, add teams
3. **Pitches** — add pitches, mark which are available for a tournament
4. **Tournament creation + automatic scheduling** — pick teams and scheduling settings, system generates matchdays (circle method) and assigns date/pitch/time automatically; Admin reviews the generated schedule
5. **Live scoring** — start a match, adjust score, confirm it, watch standings update; wire in the audit log at the same time (small addition once scoring works)
6. **Realtime on the public side** — confirm a score change shows up live on the public tournament page without refresh
7. **Postponement & forfeit handling** — small addition once basic match status flow works
8. **Captain accounts** — login, roster management, lineup submission (with the minimum-players and lock-after-kickoff rules from Section 5.4)

Steps 1–7 give you a fully working, admin-run tournament system on their own — captain accounts (step 8) are a genuine nice-to-have layered on top, not a blocker for having something real and usable.

---

## 8. What's Deliberately Left Out (for now — not forgotten, just not yet)

- Knockout/bracket formats — round-robin only
- Discipline tracking, payments, sponsors, notifications, analytics — all still valid ideas from the original documents, just not part of this build
- Public team registration requests — Admin adds teams directly instead
- A separate "Scorer" role distinct from Admin — easy to add later without redesign

---

*This is intentionally the smallest version of AM SPORTS that's still genuinely useful: a real tournament, real teams, real live scores, a real public site. Everything else layers on top once this works end to end.*
