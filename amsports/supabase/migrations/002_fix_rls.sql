-- Migration 002: Fix RLS policies to look up role from public.users
-- instead of relying on auth.jwt() ->> 'role' which is not set by default.

-- Helper function — returns the role of the currently logged-in user
create or replace function public.current_user_role()
returns text
language sql
stable
security definer
as $$
  select role from public.users where id = auth.uid()::text
$$;

-- ─── TEAMS ────────────────────────────────────────────────────────────────────
drop policy if exists "Admins can insert teams" on teams;
drop policy if exists "Admins can update teams" on teams;
drop policy if exists "Admins can delete teams" on teams;

create policy "Admins can insert teams" on teams
  for insert with check (public.current_user_role() = 'admin');

create policy "Admins can update teams" on teams
  for update with check (public.current_user_role() = 'admin');

create policy "Admins can delete teams" on teams
  for delete using (public.current_user_role() = 'admin');

-- ─── PLAYERS ──────────────────────────────────────────────────────────────────
drop policy if exists "Captains can insert their team players" on players;
drop policy if exists "Captains can update their team players" on players;
drop policy if exists "Captains can delete their team players" on players;

create policy "Captains can insert their team players" on players
  for insert with check (
    team_id = (select team_id from public.users where id = auth.uid()::text)
  );

create policy "Captains can update their team players" on players
  for update with check (
    team_id = (select team_id from public.users where id = auth.uid()::text)
  );

create policy "Captains can delete their team players" on players
  for delete using (
    team_id = (select team_id from public.users where id = auth.uid()::text)
  );

-- ─── PITCHES ──────────────────────────────────────────────────────────────────
drop policy if exists "Admins can insert pitches" on pitches;
drop policy if exists "Admins can update pitches" on pitches;
drop policy if exists "Admins can delete pitches" on pitches;

create policy "Admins can insert pitches" on pitches
  for insert with check (public.current_user_role() = 'admin');

create policy "Admins can update pitches" on pitches
  for update with check (public.current_user_role() = 'admin');

create policy "Admins can delete pitches" on pitches
  for delete using (public.current_user_role() = 'admin');

-- ─── TOURNAMENTS ──────────────────────────────────────────────────────────────
drop policy if exists "Admins can insert tournaments" on tournaments;
drop policy if exists "Admins can update tournaments" on tournaments;
drop policy if exists "Admins can delete tournaments" on tournaments;

create policy "Admins can insert tournaments" on tournaments
  for insert with check (public.current_user_role() = 'admin');

create policy "Admins can update tournaments" on tournaments
  for update with check (public.current_user_role() = 'admin');

create policy "Admins can delete tournaments" on tournaments
  for delete using (public.current_user_role() = 'admin');

-- ─── MATCHES ──────────────────────────────────────────────────────────────────
drop policy if exists "Admins can insert matches" on matches;
drop policy if exists "Admins can update matches" on matches;
drop policy if exists "Admins can delete matches" on matches;

create policy "Admins can insert matches" on matches
  for insert with check (public.current_user_role() = 'admin');

create policy "Admins can update matches" on matches
  for update with check (public.current_user_role() = 'admin');

create policy "Admins can delete matches" on matches
  for delete using (public.current_user_role() = 'admin');

-- ─── LINEUPS ──────────────────────────────────────────────────────────────────
drop policy if exists "Captains can insert their team lineups" on lineups;
drop policy if exists "Captains can update their team lineups" on lineups;
drop policy if exists "Captains can delete their team lineups" on lineups;

create policy "Captains can insert their team lineups" on lineups
  for insert with check (
    team_id = (select team_id from public.users where id = auth.uid()::text)
  );

create policy "Captains can update their team lineups" on lineups
  for update with check (
    team_id = (select team_id from public.users where id = auth.uid()::text)
  );

create policy "Captains can delete their team lineups" on lineups
  for delete using (
    team_id = (select team_id from public.users where id = auth.uid()::text)
  );

-- ─── USERS ────────────────────────────────────────────────────────────────────
drop policy if exists "Admins can insert users" on users;
drop policy if exists "Admins can update users" on users;
drop policy if exists "Admins can delete users" on users;

create policy "Admins can insert users" on users
  for insert with check (public.current_user_role() = 'admin');

create policy "Admins can update users" on users
  for update with check (public.current_user_role() = 'admin');

create policy "Admins can delete users" on users
  for delete using (public.current_user_role() = 'admin');

-- ─── AUDIT LOG ────────────────────────────────────────────────────────────────
drop policy if exists "Admins can read audit log" on audit_log;

create policy "Admins can read audit log" on audit_log
  for select using (public.current_user_role() = 'admin');

-- ─── TOURNAMENT PITCHES ───────────────────────────────────────────────────────
alter table tournament_pitches enable row level security;

create policy "Public can read tournament pitches" on tournament_pitches
  for select using (true);

create policy "Admins can insert tournament pitches" on tournament_pitches
  for insert with check (public.current_user_role() = 'admin');

create policy "Admins can delete tournament pitches" on tournament_pitches
  for delete using (public.current_user_role() = 'admin');
