export type MatchStatus = "scheduled" | "live" | "finished" | "postponed" | "forfeited";
export type TournamentStatus = "upcoming" | "active" | "completed";
export type UserRole = "admin" | "captain";

export interface Team {
  id: string;
  name: string;
  badge_url?: string;
  captain_user_id: string | null;
  color: string;
}

export interface Player {
  id: string;
  team_id: string;
  name: string;
  jersey_number: number;
}

export interface Tournament {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  status: TournamentStatus;
  match_duration_minutes: number;
  gap_minutes: number;
  daily_start_time: string;
  daily_end_time: string;
  points_win: number;
  points_draw: number;
}

export interface TournamentPitch {
  tournament_id: string;
  pitch_id: string;
}

export interface Match {
  id: string;
  tournament_id: string;
  home_team_id: string;
  away_team_id: string;
  pitch_id: string | null;
  scheduled_date: string;
  scheduled_time: string;
  matchday: number;
  home_score: number;
  away_score: number;
  status: MatchStatus;
}

export interface Lineup {
  id: string;
  match_id: string;
  team_id: string;
  player_id: string;
}

export interface User {
  id: string;
  email: string;
  role: UserRole;
  team_id: string | null;
}

export interface AuditLog {
  id: string;
  actor_user_id: string | null;
  match_id: string | null;
  action: string;
  old_value: string | null;
  new_value: string | null;
  timestamp: string;
}

export interface StandingsRow {
  id: string;
  name: string;
  color: string;
  played: number;
  won: number;
  draw: number;
  lost: number;
  gf: number;
  ga: number;
  pts: number;
}