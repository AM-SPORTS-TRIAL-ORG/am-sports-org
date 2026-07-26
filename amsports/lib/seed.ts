const PALETTE = ["#E8B93A", "#4F8FC0", "#C4432E", "#4FA36A", "#8B5FA3", "#D9782B"];

export const SEED_TEAMS = [
  { id: "t1", name: "Kampala Comets", color: PALETTE[0], captain_user_id: "u-captain1" },
  { id: "t2", name: "Nile Strikers", color: PALETTE[1], captain_user_id: null },
  { id: "t3", name: "Rift Valley FC", color: PALETTE[2], captain_user_id: null },
  { id: "t4", name: "Savannah United", color: PALETTE[3], captain_user_id: null },
];

export const SEED_PLAYERS = [
  { id: "p1", team_id: "t1", name: "D. Okello", jersey_number: 1 },
  { id: "p2", team_id: "t1", name: "M. Kato", jersey_number: 4 },
  { id: "p3", team_id: "t1", name: "R. Ssali", jersey_number: 7 },
  { id: "p4", team_id: "t1", name: "J. Mugisha", jersey_number: 9 },
  { id: "p5", team_id: "t1", name: "F. Wasswa", jersey_number: 10 },
  { id: "p6", team_id: "t1", name: "B. Namu", jersey_number: 11 },
  { id: "p7", team_id: "t2", name: "K. Aciro", jersey_number: 1 },
  { id: "p8", team_id: "t2", name: "P. Otim", jersey_number: 5 },
  { id: "p9", team_id: "t2", name: "S. Adong", jersey_number: 8 },
  { id: "p10", team_id: "t3", name: "T. Kirabo", jersey_number: 2 },
  { id: "p11", team_id: "t3", name: "L. Nabbosa", jersey_number: 6 },
  { id: "p12", team_id: "t4", name: "A. Byaruhanga", jersey_number: 3 },
  { id: "p13", team_id: "t4", name: "C. Nakato", jersey_number: 9 },
];

export const SEED_PITCHES = [{ id: "pitch1", name: "Main Pitch" }];

export const SEED_USERS = [
  { id: "u-admin1", email: "admin@amsports.demo", role: "admin", team_id: null },
  { id: "u-captain1", email: "captain.comets@amsports.demo", role: "captain", team_id: "t1" },
];

function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

export function buildSeedTournament() {
  const teamIds = SEED_TEAMS.map((t) => t.id);
  const config = {
    pitchIds: ["pitch1"],
    dailyStart: "09:00",
    dailyEnd: "17:00",
    matchDuration: 60,
    gap: 15,
    startDate: "2026-08-01",
  };
  const matchdays = generateMatchdays(teamIds);
  const scheduled = autoSchedule(matchdays, config);
  scheduled[0].status = "finished";
  scheduled[0].homeScore = 2;
  scheduled[0].awayScore = 1;
  scheduled[1].status = "live";
  scheduled[1].homeScore = 1;
  scheduled[1].awayScore = 1;
  return {
    id: "tour1",
    name: "AM SPORTS City League",
    team_ids: teamIds,
    pitch_ids: config.pitchIds,
    match_duration_minutes: config.matchDuration,
    gap_minutes: config.gap,
    daily_start_time: config.dailyStart,
    daily_end_time: config.dailyEnd,
    start_date: config.startDate,
    end_date: addDays(config.startDate, matchdays.length),
    points_win: 3,
    points_draw: 1,
    status: "active" as const,
    matches: scheduled,
  };
}