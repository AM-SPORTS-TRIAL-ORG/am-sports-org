-- AM SPORTS — Database Schema
-- Run this in the Supabase SQL editor

create table teams (
  id text primary key,
  name text not null,
  badge_url text,
  captain_user_id text,
  color text default '#E8B93A',
  created_at timestamptz default now()
);

create table players (
  id text primary key,
  team_id text not null references teams(id) on delete cascade,
  name text not null,
  jersey_number int not null,
  created_at timestamptz default now()
);

create table pitches (
  id text primary key,
  name text not null,
  created_at timestamptz default now()
);

create table tournament_pitches (
  tournament_id text not null references tournaments(id) on delete cascade,
  pitch_id text not null references pitches(id) on delete cascade,
  primary key (tournament_id, pitch_id)
);

create table tournaments (
  id text primary key,
  name text not null,
  start_date text not null,
  end_date text not null,
  status text default 'upcoming' check (status in ('upcoming', 'active', 'completed')),
  match_duration_minutes int default 60,
  gap_minutes int default 15,
  daily_start_time text default '09:00',
  daily_end_time text default '17:00',
  points_win int default 3,
  points_draw int default 1,
  created_at timestamptz default now()
);

create table matches (
  id text primary key,
  tournament_id text not null references tournaments(id) on delete cascade,
  home_team_id text not null references teams(id),
  away_team_id text not null references teams(id),
  pitch_id text references pitches(id),
  scheduled_date text not null,
  scheduled_time text not null,
  matchday int not null,
  home_score int default 0,
  away_score int default 0,
  status text default 'scheduled' check (status in ('scheduled', 'live', 'finished', 'postponed', 'forfeited')),
  created_at timestamptz default now()
);

create table lineups (
  id text primary key,
  match_id text not null references matches(id) on delete cascade,
  team_id text not null references teams(id) on delete cascade,
  player_id text not null references players(id) on delete cascade,
  created_at timestamptz default now(),
  unique (match_id, team_id, player_id)
);

create table users (
  id text primary key,
  email text unique not null,
  role text not null check (role in ('admin', 'captain')),
  team_id text references teams(id),
  created_at timestamptz default now()
);

create table audit_log (
  id text primary key,
  actor_user_id text,
  match_id text references matches(id) on delete set null,
  action text not null,
  old_value text,
  new_value text,
  timestamp timestamptz default now()
);

-- Enable Realtime for matches table
alter publication supabase_realtime add table matches;

-- RLS: Teams — captains can read their own team, admins can read/write all
alter table teams enable row level security;

create policy "Public can read all teams" on teams for select using (true);

create policy "Admins can insert teams" on teams for insert with check (
  auth.jwt() ->> 'role' = 'admin'
);

create policy "Admins can update teams" on teams for update with check (
  auth.jwt() ->> 'role' = 'admin'
);

create policy "Admins can delete teams" on teams for delete using (
  auth.jwt() ->> 'role' = 'admin'
);

-- RLS: Players — captains can read/write their own team's players, admins full access
alter table players enable row level security;

create policy "Captains can read their team players" on players for select using (
  team_id in (select team_id from users where id = auth.uid())
  or exists (select 1 from users where id = auth.uid() and role = 'admin')
);

create policy "Captains can insert their team players" on players for insert with check (
  team_id = (select team_id from users where id = auth.uid())
);

create policy "Captains can update their team players" on players for update with check (
  team_id = (select team_id from users where id = auth.uid())
);

create policy "Captains can delete their team players" on players for delete using (
  team_id = (select team_id from users where id = auth.uid())
);

-- RLS: Pitches — public read, admin write
alter table pitches enable row level security;

create policy "Public can read all pitches" on pitches for select using (true);

create policy "Admins can insert pitches" on pitches for insert with check (
  auth.jwt() ->> 'role' = 'admin'
);

create policy "Admins can update pitches" on pitches for update with check (
  auth.jwt() ->> 'role' = 'admin'
);

create policy "Admins can delete pitches" on pitches for delete using (
  auth.jwt() ->> 'role' = 'admin'
);

-- RLS: Tournaments — public read, admin write
alter table tournaments enable row level security;

create policy "Public can read all tournaments" on tournaments for select using (true);

create policy "Admins can insert tournaments" on tournaments for insert with check (
  auth.jwt() ->> 'role' = 'admin'
);

create policy "Admins can update tournaments" on tournaments for update with check (
  auth.jwt() ->> 'role' = 'admin'
);

create policy "Admins can delete tournaments" on tournaments for delete using (
  auth.jwt() ->> 'role' = 'admin'
);

-- RLS: Matches — public read, admin write, captains can read their team's matches
alter table matches enable row level security;

create policy "Public can read all matches" on matches for select using (true);

create policy "Admins can insert matches" on matches for insert with check (
  auth.jwt() ->> 'role' = 'admin'
);

create policy "Admins can update matches" on matches for update with check (
  auth.jwt() ->> 'role' = 'admin'
);

create policy "Admins can delete matches" on matches for delete using (
  auth.jwt() ->> 'role' = 'admin'
);

create policy "Captains can read their team matches" on matches for select using (
  home_team_id in (select team_id from users where id = auth.uid())
  or away_team_id in (select team_id from users where id = auth.uid())
);

-- RLS: Lineups — captains can read/write their own team's lineups, admins full access
alter table lineups enable row level security;

create policy "Captains can read their team lineups" on lineups for select using (
  team_id = (select team_id from users where id = auth.uid())
  or exists (select 1 from users where id = auth.uid() and role = 'admin')
);

create policy "Captains can insert their team lineups" on lineups for insert with check (
  team_id = (select team_id from users where id = auth.uid())
);

create policy "Captains can update their team lineups" on lineups for update with check (
  team_id = (select team_id from users where id = auth.uid())
);

create policy "Captains can delete their team lineups" on lineups for delete using (
  team_id = (select team_id from users where id = auth.uid())
);

-- RLS: Users — public read, admin write
alter table users enable row level security;

create policy "Public can read all users" on users for select using (true);

create policy "Admins can insert users" on users for insert with check (
  auth.jwt() ->> 'role' = 'admin'
);

create policy "Admins can update users" on users for update with check (
  auth.jwt() ->> 'role' = 'admin'
);

create policy "Admins can delete users" on users for delete using (
  auth.jwt() ->> 'role' = 'admin'
);

-- RLS: Audit Log — public read for admins, insert only
alter table audit_log enable row level security;

create policy "Admins can read audit log" on audit_log for select using (
  auth.jwt() ->> 'role' = 'admin'
);

create policy "Anyone can insert audit log entries" on audit_log for insert with check (true);

-- Seed data
insert into teams (id, name, captain_user_id, color) values
  ('t1', 'Kampala Comets', 'u-captain1', '#E8B93A'),
  ('t2', 'Nile Strikers', null, '#4F8FC0'),
  ('t3', 'Rift Valley FC', null, '#C4432E'),
  ('t4', 'Savannah United', null, '#4FA36A');

insert into players (id, team_id, name, jersey_number) values
  ('p1', 't1', 'D. Okello', 1),
  ('p2', 't1', 'M. Kato', 4),
  ('p3', 't1', 'R. Ssali', 7),
  ('p4', 't1', 'J. Mugisha', 9),
  ('p5', 't1', 'F. Wasswa', 10),
  ('p6', 't1', 'B. Namu', 11),
  ('p7', 't2', 'K. Aciro', 1),
  ('p8', 't2', 'P. Otim', 5),
  ('p9', 't2', 'S. Adong', 8),
  ('p10', 't3', 'T. Kirabo', 2),
  ('p11', 't3', 'L. Nabbosa', 6),
  ('p12', 't4', 'A. Byaruhanga', 3),
  ('p13', 't4', 'C. Nakato', 9);

insert into pitches (id, name) values ('pitch1', 'Main Pitch');

insert into users (id, email, role, team_id) values
  ('u-admin1', 'admin@amsports.demo', 'admin', null),
  ('u-captain1', 'captain.comets@amsports.demo', 'captain', 't1');

insert into tournaments (id, name, start_date, end_date, status, match_duration_minutes, gap_minutes, daily_start_time, daily_end_time, points_win, points_draw)
values ('tour1', 'AM SPORTS City League', '2026-08-01', '2026-08-22', 'active', 60, 15, '09:00', '17:00', 3, 1);

insert into tournament_pitches (tournament_id, pitch_id) values ('tour1', 'pitch1');