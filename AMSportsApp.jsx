import React, { useState, useMemo, useEffect } from "react";
import {
  Trophy,
  ShieldCheck,
  Users,
  Plus,
  Minus,
  ChevronLeft,
  Play,
  Flag,
  X,
  LogIn,
  LogOut,
  CalendarClock,
  MapPin,
  AlertTriangle,
  Check,
  Clock,
} from "lucide-react";

/* ---------------------------------------------------------------------- */
/* Helpers                                                                 */
/* ---------------------------------------------------------------------- */

let idCounter = 1000;
const genId = () => `id-${idCounter++}`;

function initials(name) {
  return name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

function addDays(dateStr, n) {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

function formatDateDisplay(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

function timeToMinutes(t) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}
function minutesToTime(m) {
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${String(h).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

const MIN_LINEUP = 5;

/* ---------------------------------------------------------------------- */
/* Round-robin (circle method) + automatic scheduling                     */
/* ---------------------------------------------------------------------- */

function generateMatchdays(teamIds) {
  let ids = [...teamIds];
  if (ids.length % 2 !== 0) ids.push(null); // bye slot
  const n = ids.length;
  const rounds = n - 1;
  const half = n / 2;
  let arr = [...ids];
  const matchdays = [];
  for (let r = 0; r < rounds; r++) {
    const round = [];
    for (let i = 0; i < half; i++) {
      const a = arr[i];
      const b = arr[n - 1 - i];
      if (a !== null && b !== null) {
        round.push({
          id: genId(),
          homeId: r % 2 === 0 ? a : b,
          awayId: r % 2 === 0 ? b : a,
          homeScore: 0,
          awayScore: 0,
          status: "scheduled",
        });
      }
    }
    matchdays.push(round);
    arr = [arr[0], arr[n - 1], ...arr.slice(1, n - 1)];
  }
  return matchdays;
}

function generateDaySlots(pitchIds, dailyStart, dailyEnd, duration, gap) {
  const slots = [];
  const startM = timeToMinutes(dailyStart);
  const endM = timeToMinutes(dailyEnd);
  let t = startM;
  while (t + duration <= endM) {
    pitchIds.forEach((pid) => slots.push({ pitchId: pid, time: minutesToTime(t) }));
    t += duration + gap;
  }
  return slots;
}

function autoSchedule(matchdays, config) {
  const slotsTemplate = generateDaySlots(config.pitchIds, config.dailyStart, config.dailyEnd, config.matchDuration, config.gap);
  const scheduled = [];
  let overflowDayOffset = matchdays.length;
  matchdays.forEach((matchday, d) => {
    const date = addDays(config.startDate, d);
    matchday.forEach((m, i) => {
      if (i < slotsTemplate.length) {
        const slot = slotsTemplate[i];
        scheduled.push({ ...m, matchday: d, scheduledDate: date, scheduledTime: slot.time, pitchId: slot.pitchId });
      } else {
        const overflowIdx = i - slotsTemplate.length;
        const overflowDate = addDays(config.startDate, overflowDayOffset + Math.floor(overflowIdx / slotsTemplate.length));
        const slot = slotsTemplate[overflowIdx % slotsTemplate.length];
        scheduled.push({ ...m, matchday: d, scheduledDate: overflowDate, scheduledTime: slot.time, pitchId: slot.pitchId, overflow: true });
      }
    });
    if (matchday.length > slotsTemplate.length) overflowDayOffset += Math.ceil((matchday.length - slotsTemplate.length) / slotsTemplate.length);
  });
  return scheduled;
}

/* ---------------------------------------------------------------------- */
/* Standings                                                               */
/* ---------------------------------------------------------------------- */

function computeStandings(matches, teamIds, teamsById, pointsWin, pointsDraw) {
  const table = {};
  teamIds.forEach((id) => {
    table[id] = { id, name: teamsById[id]?.name || "Unknown", color: teamsById[id]?.color, played: 0, won: 0, draw: 0, lost: 0, gf: 0, ga: 0, pts: 0 };
  });
  matches.forEach((m) => {
    if (m.status !== "finished" && m.status !== "forfeited") return;
    const h = table[m.homeId];
    const a = table[m.awayId];
    if (!h || !a) return;
    h.played += 1;
    a.played += 1;
    h.gf += m.homeScore;
    h.ga += m.awayScore;
    a.gf += m.awayScore;
    a.ga += m.homeScore;
    if (m.homeScore > m.awayScore) {
      h.won += 1;
      h.pts += pointsWin;
      a.lost += 1;
    } else if (m.homeScore < m.awayScore) {
      a.won += 1;
      a.pts += pointsWin;
      h.lost += 1;
    } else {
      h.draw += 1;
      a.draw += 1;
      h.pts += pointsDraw;
      a.pts += pointsDraw;
    }
  });
  return Object.values(table).sort(
    (x, y) => y.pts - x.pts || (y.gf - y.ga) - (x.gf - x.ga) || y.gf - x.gf || x.name.localeCompare(y.name)
  );
}

/* ---------------------------------------------------------------------- */
/* Seed data                                                               */
/* ---------------------------------------------------------------------- */

const PALETTE = ["#E8B93A", "#4F8FC0", "#C4432E", "#4FA36A", "#8B5FA3", "#D9782B"];

const SEED_TEAMS = [
  { id: "t1", name: "Kampala Comets", color: PALETTE[0], captainUserId: "u-captain1" },
  { id: "t2", name: "Nile Strikers", color: PALETTE[1], captainUserId: null },
  { id: "t3", name: "Rift Valley FC", color: PALETTE[2], captainUserId: null },
  { id: "t4", name: "Savannah United", color: PALETTE[3], captainUserId: null },
];

const SEED_PLAYERS = [
  { id: "p1", teamId: "t1", name: "D. Okello", jersey: 1 },
  { id: "p2", teamId: "t1", name: "M. Kato", jersey: 4 },
  { id: "p3", teamId: "t1", name: "R. Ssali", jersey: 7 },
  { id: "p4", teamId: "t1", name: "J. Mugisha", jersey: 9 },
  { id: "p5", teamId: "t1", name: "F. Wasswa", jersey: 10 },
  { id: "p6", teamId: "t1", name: "B. Namu", jersey: 11 },
  { id: "p7", teamId: "t2", name: "K. Aciro", jersey: 1 },
  { id: "p8", teamId: "t2", name: "P. Otim", jersey: 5 },
  { id: "p9", teamId: "t2", name: "S. Adong", jersey: 8 },
  { id: "p10", teamId: "t3", name: "T. Kirabo", jersey: 2 },
  { id: "p11", teamId: "t3", name: "L. Nabbosa", jersey: 6 },
  { id: "p12", teamId: "t4", name: "A. Byaruhanga", jersey: 3 },
  { id: "p13", teamId: "t4", name: "C. Nakato", jersey: 9 },
];

const SEED_PITCHES = [{ id: "pitch1", name: "Main Pitch" }];

const SEED_USERS = [
  { id: "u-admin1", email: "admin@amsports.demo", role: "admin" },
  { id: "u-captain1", email: "captain.comets@amsports.demo", role: "captain", teamId: "t1" },
];

function buildSeedTournament() {
  const teamIds = SEED_TEAMS.map((t) => t.id);
  const matchdays = generateMatchdays(teamIds);
  const config = {
    pitchIds: ["pitch1"],
    dailyStart: "09:00",
    dailyEnd: "17:00",
    matchDuration: 60,
    gap: 15,
    startDate: "2026-08-01",
  };
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
    teamIds,
    pitchIds: config.pitchIds,
    matchDuration: config.matchDuration,
    gap: config.gap,
    dailyStart: config.dailyStart,
    dailyEnd: config.dailyEnd,
    startDate: config.startDate,
    pointsWin: 3,
    pointsDraw: 1,
    matches: scheduled,
  };
}

const SEED_TOURNAMENTS = [buildSeedTournament()];

/* ---------------------------------------------------------------------- */
/* Small UI pieces                                                         */
/* ---------------------------------------------------------------------- */

function TeamBadge({ team, size = 26 }) {
  if (!team) {
    return (
      <div className="flex items-center justify-center rounded-full shrink-0" style={{ width: size, height: size, background: "var(--pitch-700)", border: "1px dashed var(--line)", color: "var(--chalk-dim)", fontFamily: "var(--font-mono)", fontSize: size * 0.32 }}>
        ?
      </div>
    );
  }
  return (
    <div className="flex items-center justify-center rounded-full shrink-0 font-bold" style={{ width: size, height: size, background: team.color, color: "#101010", fontFamily: "var(--font-mono)", fontSize: size * 0.34 }}>
      {initials(team.name)}
    </div>
  );
}

function TeamRow({ team, reverse }) {
  return (
    <div className={`flex items-center gap-2 min-w-0 flex-1 ${reverse ? "flex-row-reverse text-right" : ""}`}>
      <TeamBadge team={team} size={24} />
      <span className="truncate text-sm" style={{ color: "var(--chalk)", fontFamily: "var(--font-body)" }}>
        {team ? team.name : "TBD"}
      </span>
    </div>
  );
}

function ScoreDigits({ match }) {
  const dash = match.status === "scheduled" || match.status === "postponed";
  return (
    <div className="flex items-center gap-1 px-2 py-1 rounded shrink-0" style={{ background: "var(--pitch-950)", border: "1px solid var(--line)" }}>
      <span style={{ fontFamily: "var(--font-display)", fontSize: "20px", color: "var(--chalk)", minWidth: "16px", textAlign: "center" }}>{dash ? "-" : match.homeScore}</span>
      <span style={{ color: "var(--chalk-dim)" }}>:</span>
      <span style={{ fontFamily: "var(--font-display)", fontSize: "20px", color: "var(--chalk)", minWidth: "16px", textAlign: "center" }}>{dash ? "-" : match.awayScore}</span>
    </div>
  );
}

const STATUS_LABEL = { scheduled: "Scheduled", live: "Live", finished: "Full Time", postponed: "Postponed", forfeited: "Forfeited" };
const STATUS_COLOR = { scheduled: "var(--chalk-dim)", live: "var(--amber)", finished: "var(--win-green)", postponed: "var(--red-card)", forfeited: "var(--red-card)" };

function MatchMeta({ match, pitchesById }) {
  return (
    <div className="flex items-center gap-3 px-3 pb-2 text-[10px] uppercase tracking-wide" style={{ color: "var(--chalk-dim)", fontFamily: "var(--font-mono)" }}>
      <span className="flex items-center gap-1">
        <CalendarClock size={11} /> {formatDateDisplay(match.scheduledDate)} · {match.scheduledTime}
      </span>
      <span className="flex items-center gap-1">
        <MapPin size={11} /> {pitchesById[match.pitchId]?.name || "TBD"}
      </span>
      {match.status === "live" && <span className="pulse-dot" />}
      <span style={{ color: STATUS_COLOR[match.status] }}>{STATUS_LABEL[match.status]}</span>
      {match.overflow && (
        <span className="flex items-center gap-1" style={{ color: "var(--red-card)" }}>
          <AlertTriangle size={11} /> overflow day
        </span>
      )}
    </div>
  );
}

function MatchScoreboard({ match, homeTeam, awayTeam, pitchesById }) {
  return (
    <div className="rounded-lg overflow-hidden" style={{ background: "var(--pitch-800)", border: "1px solid var(--line)" }}>
      <div className="flex items-center justify-between px-3 py-2 gap-2">
        <TeamRow team={homeTeam} />
        <ScoreDigits match={match} />
        <TeamRow team={awayTeam} reverse />
      </div>
      <MatchMeta match={match} pitchesById={pitchesById} />
    </div>
  );
}

function Notice({ notice, onClose }) {
  if (!notice) return null;
  const isError = notice.type === "error";
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-lg mb-4 text-sm" style={{ background: isError ? "rgba(196,67,46,0.15)" : "rgba(79,163,106,0.15)", border: `1px solid ${isError ? "var(--red-card)" : "var(--win-green)"}`, color: "var(--chalk)", fontFamily: "var(--font-body)" }}>
      <span>{notice.text}</span>
      <button onClick={onClose} aria-label="Dismiss">
        <X size={16} color="var(--chalk-dim)" />
      </button>
    </div>
  );
}

function SectionCard({ title, icon: Icon, children }) {
  return (
    <section className="p-4 rounded-lg mb-4" style={{ background: "var(--pitch-800)", border: "1px solid var(--line)" }}>
      <div className="flex items-center gap-2 mb-3">
        {Icon && <Icon size={16} color="var(--amber)" />}
        <span style={{ color: "var(--chalk)", fontFamily: "var(--font-body)", fontWeight: 600 }}>{title}</span>
      </div>
      {children}
    </section>
  );
}

function TextInput(props) {
  return (
    <input
      {...props}
      className={`px-3 py-2 rounded-md text-sm ${props.className || ""}`}
      style={{ background: "var(--pitch-950)", border: "1px solid var(--line)", color: "var(--chalk)", fontFamily: "var(--font-body)", ...props.style }}
    />
  );
}

function PrimaryButton(props) {
  return (
    <button {...props} className={`ams-btn px-3 py-2 rounded-md text-sm font-semibold ${props.className || ""}`} style={{ background: "var(--amber)", color: "#101010", ...props.style }}>
      {props.children}
    </button>
  );
}

/* ---------------------------------------------------------------------- */
/* Main App                                                                */
/* ---------------------------------------------------------------------- */

export default function AMSportsApp() {
  const [teams, setTeams] = useState(SEED_TEAMS);
  const [players, setPlayers] = useState(SEED_PLAYERS);
  const [pitches, setPitches] = useState(SEED_PITCHES);
  const [tournaments, setTournaments] = useState(SEED_TOURNAMENTS);
  const [users, setUsers] = useState(SEED_USERS);
  const [lineups, setLineups] = useState({});
  const [auditLog, setAuditLog] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [view, setView] = useState("public");
  const [selectedTournamentId, setSelectedTournamentId] = useState(null);
  const [publicTab, setPublicTab] = useState("standings");
  const [notice, setNotice] = useState(null);
  const [loginEmail, setLoginEmail] = useState("");

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 4000);
    return () => clearTimeout(t);
  }, [notice]);

  const teamsById = useMemo(() => Object.fromEntries(teams.map((t) => [t.id, t])), [teams]);
  const pitchesById = useMemo(() => Object.fromEntries(pitches.map((p) => [p.id, p])), [pitches]);
  const selectedTournament = tournaments.find((t) => t.id === selectedTournamentId);

  function logAudit(action, detail) {
    setAuditLog((prev) => [{ id: genId(), ts: new Date().toLocaleString(), actor: currentUser?.email || "system", action, detail }, ...prev]);
  }

  function withTournament(tournamentId, mutator) {
    setTournaments((prev) => prev.map((t) => (t.id === tournamentId ? mutator(structuredClone(t)) : t)));
  }

  /* ---------- auth ---------- */
  function login() {
    const u = users.find((x) => x.email === loginEmail);
    if (!u) {
      setNotice({ type: "error", text: "No account with that email. Try admin@amsports.demo or captain.comets@amsports.demo." });
      return;
    }
    setCurrentUser(u);
    setView(u.role === "admin" ? "admin" : "captain");
    setNotice({ type: "success", text: `Signed in as ${u.email}.` });
  }
  function logout() {
    setCurrentUser(null);
    setView("public");
  }

  /* ---------- admin: teams ---------- */
  function addTeam(name) {
    if (!name.trim()) return;
    const color = PALETTE[teams.length % PALETTE.length];
    setTeams((prev) => [...prev, { id: genId(), name: name.trim(), color, captainUserId: null }]);
    logAudit("team_created", name.trim());
  }
  function deleteTeam(teamId) {
    const blocking = tournaments.some((t) => t.matches.some((m) => (m.homeId === teamId || m.awayId === teamId) && (m.status === "scheduled" || m.status === "live")));
    if (blocking) {
      setNotice({ type: "error", text: "Can't delete a team with scheduled or live matches. Remove them from the tournament first." });
      return;
    }
    setTeams((prev) => prev.filter((t) => t.id !== teamId));
    logAudit("team_deleted", teamId);
  }
  function assignCaptain(teamId) {
    const team = teams.find((t) => t.id === teamId);
    const email = `captain.${team.name.toLowerCase().replace(/[^a-z]/g, "")}@amsports.demo`;
    const existing = users.find((u) => u.email === email);
    if (existing) return;
    const newUser = { id: genId(), email, role: "captain", teamId };
    setUsers((prev) => [...prev, newUser]);
    setTeams((prev) => prev.map((t) => (t.id === teamId ? { ...t, captainUserId: newUser.id } : t)));
    logAudit("captain_assigned", `${email} → ${team.name}`);
    setNotice({ type: "success", text: `Captain login created: ${email} (demo password not required here)` });
  }

  /* ---------- admin: pitches ---------- */
  function addPitch(name) {
    if (!name.trim()) return;
    setPitches((prev) => [...prev, { id: genId(), name: name.trim() }]);
  }

  /* ---------- admin: tournaments ---------- */
  function createTournament(cfg) {
    if (!cfg.name.trim() || cfg.teamIds.length < 2 || cfg.pitchIds.length < 1) {
      setNotice({ type: "error", text: "Give the tournament a name, at least 2 teams, and at least 1 pitch." });
      return;
    }
    const matchdays = generateMatchdays(cfg.teamIds);
    const scheduled = autoSchedule(matchdays, cfg);
    const hasOverflow = scheduled.some((m) => m.overflow);
    setTournaments((prev) => [
      ...prev,
      { id: genId(), name: cfg.name.trim(), teamIds: cfg.teamIds, pitchIds: cfg.pitchIds, matchDuration: cfg.matchDuration, gap: cfg.gap, dailyStart: cfg.dailyStart, dailyEnd: cfg.dailyEnd, startDate: cfg.startDate, pointsWin: cfg.pointsWin, pointsDraw: cfg.pointsDraw, matches: scheduled },
    ]);
    logAudit("tournament_created", cfg.name.trim());
    setNotice({ type: hasOverflow ? "error" : "success", text: hasOverflow ? "Tournament created — some matches spilled onto extra days (not enough pitch capacity per day)." : "Tournament created and fixtures auto-scheduled." });
  }
  function deleteTournament(id) {
    setTournaments((prev) => prev.filter((t) => t.id !== id));
    if (selectedTournamentId === id) setSelectedTournamentId(null);
    logAudit("tournament_deleted", id);
  }

  /* ---------- admin: live scoring ---------- */
  function startMatch(tournamentId, matchId) {
    withTournament(tournamentId, (t) => {
      const m = t.matches.find((x) => x.id === matchId);
      m.status = "live";
      return t;
    });
    logAudit("match_started", matchId);
  }
  function adjustScore(tournamentId, matchId, side, delta) {
    withTournament(tournamentId, (t) => {
      const m = t.matches.find((x) => x.id === matchId);
      const key = side === "home" ? "homeScore" : "awayScore";
      m[key] = Math.max(0, m[key] + delta);
      return t;
    });
  }
  function finishMatch(tournamentId, matchId) {
    withTournament(tournamentId, (t) => {
      const m = t.matches.find((x) => x.id === matchId);
      m.status = "finished";
      return t;
    });
    logAudit("match_confirmed", matchId);
    setNotice({ type: "success", text: "Match confirmed. Standings updated." });
  }
  function postponeMatch(tournamentId, matchId) {
    withTournament(tournamentId, (t) => {
      const m = t.matches.find((x) => x.id === matchId);
      m.status = "postponed";
      return t;
    });
    logAudit("match_postponed", matchId);
  }
  function rescheduleMatch(tournamentId, matchId, newDate, newTime, newPitchId) {
    withTournament(tournamentId, (t) => {
      const m = t.matches.find((x) => x.id === matchId);
      m.scheduledDate = newDate;
      m.scheduledTime = newTime;
      m.pitchId = newPitchId;
      m.status = "scheduled";
      return t;
    });
    logAudit("match_rescheduled", `${matchId} → ${newDate} ${newTime}`);
    setNotice({ type: "success", text: "Match rescheduled." });
  }
  function forfeitMatch(tournamentId, matchId, winner) {
    withTournament(tournamentId, (t) => {
      const m = t.matches.find((x) => x.id === matchId);
      m.status = "forfeited";
      m.homeScore = winner === "home" ? 3 : 0;
      m.awayScore = winner === "away" ? 3 : 0;
      return t;
    });
    logAudit("match_forfeited", `${matchId} — ${winner} team awarded the win`);
    setNotice({ type: "success", text: "Match recorded as a forfeit." });
  }

  /* ---------- captain ---------- */
  function addPlayer(teamId, name, jersey) {
    if (!name.trim()) return;
    setPlayers((prev) => [...prev, { id: genId(), teamId, name: name.trim(), jersey: Number(jersey) || prev.filter((p) => p.teamId === teamId).length + 1 }]);
  }
  function removePlayer(playerId) {
    setPlayers((prev) => prev.filter((p) => p.id !== playerId));
  }
  function submitLineup(matchId, teamId, playerIds) {
    if (playerIds.length < MIN_LINEUP) {
      setNotice({ type: "error", text: `Select at least ${MIN_LINEUP} players for the lineup.` });
      return;
    }
    setLineups((prev) => ({ ...prev, [`${matchId}:${teamId}`]: playerIds }));
    logAudit("lineup_submitted", `${teamId} for match ${matchId}`);
    setNotice({ type: "success", text: "Lineup submitted." });
  }

  /* ---------------------------------------------------------------------- */

  return (
    <div className="ams-root min-h-screen w-full" style={{ background: "var(--pitch-950)" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;500;600;700&family=Space+Mono:wght@400;700&display=swap');
        .ams-root {
          --pitch-950: #0B2015; --pitch-800: #14331F; --pitch-700: #1D4A2C;
          --chalk: #F4F1E8; --chalk-dim: rgba(244,241,232,0.58);
          --amber: #E8B93A; --red-card: #C4432E; --win-green: #4FA36A;
          --line: rgba(244,241,232,0.12);
          --font-display: 'Bebas Neue', sans-serif;
          --font-body: 'Inter', system-ui, sans-serif;
          --font-mono: 'Space Mono', monospace;
          background-image: repeating-linear-gradient(180deg, rgba(244,241,232,0.015) 0px, rgba(244,241,232,0.015) 40px, transparent 40px, transparent 80px);
        }
        .pulse-dot { width: 7px; height: 7px; border-radius: 999px; background: var(--amber); display: inline-block; }
        @media (prefers-reduced-motion: no-preference) { .pulse-dot { animation: ams-pulse 1.4s ease-in-out infinite; } }
        @keyframes ams-pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.4; transform: scale(0.8); } }
        .ams-btn:focus-visible, .ams-tab-btn:focus-visible { outline: 2px solid var(--amber); outline-offset: 2px; }
      `}</style>

      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="mb-5 flex items-start justify-between">
          <div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: "38px", letterSpacing: "1px", color: "var(--chalk)", lineHeight: 1 }}>AM SPORTS</div>
            <div className="text-xs uppercase tracking-widest mt-1" style={{ color: "var(--amber)", fontFamily: "var(--font-mono)" }}>Round-Robin League System</div>
          </div>
          {currentUser && (
            <button onClick={logout} className="ams-btn flex items-center gap-1 text-xs px-2 py-1.5 rounded-md" style={{ color: "var(--chalk-dim)", border: "1px solid var(--line)" }}>
              <LogOut size={13} /> {currentUser.email.split("@")[0]}
            </button>
          )}
        </div>

        <div className="flex gap-1 p-1 rounded-lg mb-5" style={{ background: "var(--pitch-800)", border: "1px solid var(--line)" }}>
          {[
            { key: "public", label: "Public", icon: Trophy, show: true },
            { key: "admin", label: "Admin", icon: ShieldCheck, show: currentUser?.role === "admin" },
            { key: "captain", label: "My Team", icon: Users, show: currentUser?.role === "captain" },
            { key: "login", label: "Login", icon: LogIn, show: !currentUser },
          ]
            .filter((t) => t.show)
            .map(({ key, label, icon: Icon }) => (
              <button key={key} className="ams-tab-btn flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-sm transition-colors" style={{ background: view === key ? "var(--amber)" : "transparent", color: view === key ? "#101010" : "var(--chalk-dim)", fontFamily: "var(--font-body)", fontWeight: 600 }} onClick={() => setView(key)}>
                <Icon size={15} /> {label}
              </button>
            ))}
        </div>

        <Notice notice={notice} onClose={() => setNotice(null)} />

        {view === "login" && <LoginView loginEmail={loginEmail} setLoginEmail={setLoginEmail} login={login} />}

        {view === "public" && (
          <PublicView
            tournaments={tournaments}
            teamsById={teamsById}
            pitchesById={pitchesById}
            selectedTournament={selectedTournament}
            setSelectedTournamentId={setSelectedTournamentId}
            publicTab={publicTab}
            setPublicTab={setPublicTab}
          />
        )}

        {view === "admin" && currentUser?.role === "admin" && (
          <AdminView
            teams={teams}
            players={players}
            pitches={pitches}
            tournaments={tournaments}
            pitchesById={pitchesById}
            teamsById={teamsById}
            auditLog={auditLog}
            addTeam={addTeam}
            deleteTeam={deleteTeam}
            assignCaptain={assignCaptain}
            addPitch={addPitch}
            createTournament={createTournament}
            deleteTournament={deleteTournament}
            startMatch={startMatch}
            adjustScore={adjustScore}
            finishMatch={finishMatch}
            postponeMatch={postponeMatch}
            rescheduleMatch={rescheduleMatch}
            forfeitMatch={forfeitMatch}
          />
        )}

        {view === "captain" && currentUser?.role === "captain" && (
          <CaptainView
            currentUser={currentUser}
            teams={teams}
            players={players}
            tournaments={tournaments}
            teamsById={teamsById}
            pitchesById={pitchesById}
            lineups={lineups}
            addPlayer={addPlayer}
            removePlayer={removePlayer}
            submitLineup={submitLineup}
          />
        )}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* Login                                                                   */
/* ---------------------------------------------------------------------- */

function LoginView({ loginEmail, setLoginEmail, login }) {
  return (
    <SectionCard title="Sign In" icon={LogIn}>
      <p className="text-xs mb-3" style={{ color: "var(--chalk-dim)", fontFamily: "var(--font-body)" }}>
        Prototype auth — try <code>admin@amsports.demo</code> (Admin) or <code>captain.comets@amsports.demo</code> (Team Captain). The real system will use proper Supabase Auth with passwords.
      </p>
      <div className="flex gap-2">
        <TextInput value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} placeholder="you@amsports.demo" className="flex-1" />
        <PrimaryButton onClick={login}>Sign in</PrimaryButton>
      </div>
    </SectionCard>
  );
}

/* ---------------------------------------------------------------------- */
/* Public view                                                             */
/* ---------------------------------------------------------------------- */

function PublicView({ tournaments, teamsById, pitchesById, selectedTournament, setSelectedTournamentId, publicTab, setPublicTab }) {
  if (!selectedTournament) {
    return (
      <div className="space-y-3">
        {tournaments.map((t) => {
          const isLive = t.matches.some((m) => m.status === "live");
          return (
            <button key={t.id} onClick={() => { setSelectedTournamentId(t.id); setPublicTab("standings"); }} className="ams-btn w-full text-left p-4 rounded-lg flex items-center justify-between gap-3" style={{ background: "var(--pitch-800)", border: "1px solid var(--line)" }}>
              <div>
                <div style={{ color: "var(--chalk)", fontFamily: "var(--font-body)", fontWeight: 600 }}>{t.name}</div>
                <div className="text-xs mt-1 uppercase tracking-wide" style={{ color: "var(--chalk-dim)", fontFamily: "var(--font-mono)" }}>Round-robin · {t.teamIds.length} teams</div>
              </div>
              {isLive && (
                <span className="text-[10px] px-2 py-1 rounded uppercase tracking-wide flex items-center gap-1 shrink-0" style={{ color: "var(--amber)", border: "1px solid var(--amber)", fontFamily: "var(--font-mono)" }}>
                  <span className="pulse-dot" /> Live
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  const t = selectedTournament;

  return (
    <div>
      <button className="ams-btn flex items-center gap-1 text-sm mb-4" style={{ color: "var(--chalk-dim)", fontFamily: "var(--font-body)" }} onClick={() => setSelectedTournamentId(null)}>
        <ChevronLeft size={16} /> All tournaments
      </button>
      <div style={{ fontFamily: "var(--font-display)", fontSize: "26px", color: "var(--chalk)" }}>{t.name}</div>

      <div className="flex gap-1 p-1 rounded-lg my-4" style={{ background: "var(--pitch-800)", border: "1px solid var(--line)" }}>
        {["standings", "fixtures", "teams"].map((tab) => (
          <button key={tab} className="ams-tab-btn flex-1 py-1.5 rounded-md text-xs uppercase tracking-wide" style={{ background: publicTab === tab ? "var(--amber)" : "transparent", color: publicTab === tab ? "#101010" : "var(--chalk-dim)", fontFamily: "var(--font-mono)", fontWeight: 600 }} onClick={() => setPublicTab(tab)}>
            {tab}
          </button>
        ))}
      </div>

      {publicTab === "standings" && <StandingsTable matches={t.matches} teamIds={t.teamIds} teamsById={teamsById} pointsWin={t.pointsWin} pointsDraw={t.pointsDraw} />}

      {publicTab === "fixtures" && (
        <div className="space-y-2">
          {[...t.matches].sort((a, b) => (a.scheduledDate + a.scheduledTime).localeCompare(b.scheduledDate + b.scheduledTime)).map((m) => (
            <MatchScoreboard key={m.id} match={m} homeTeam={teamsById[m.homeId]} awayTeam={teamsById[m.awayId]} pitchesById={pitchesById} />
          ))}
        </div>
      )}

      {publicTab === "teams" && (
        <div className="grid grid-cols-2 gap-3">
          {t.teamIds.map((id) => {
            const team = teamsById[id];
            if (!team) return null;
            return (
              <div key={id} className="flex items-center gap-2 p-3 rounded-lg" style={{ background: "var(--pitch-800)", border: "1px solid var(--line)" }}>
                <TeamBadge team={team} size={30} />
                <span style={{ color: "var(--chalk)", fontFamily: "var(--font-body)", fontSize: "14px" }}>{team.name}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StandingsTable({ matches, teamIds, teamsById, pointsWin, pointsDraw }) {
  const rows = computeStandings(matches, teamIds, teamsById, pointsWin, pointsDraw);
  const cols = ["P", "W", "D", "L", "GF", "GA", "GD", "Pts"];
  return (
    <div className="rounded-lg overflow-hidden" style={{ border: "1px solid var(--line)" }}>
      <table className="w-full text-xs" style={{ fontFamily: "var(--font-mono)" }}>
        <thead>
          <tr style={{ background: "var(--pitch-800)", color: "var(--chalk-dim)" }}>
            <th className="text-left py-2 px-2 font-normal">Team</th>
            {cols.map((c) => (
              <th key={c} className="py-2 px-1.5 font-normal">{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.id} style={{ background: i % 2 === 0 ? "var(--pitch-950)" : "var(--pitch-800)", color: "var(--chalk)" }}>
              <td className="py-2 px-2 flex items-center gap-2" style={{ fontFamily: "var(--font-body)" }}>
                <TeamBadge team={{ name: r.name, color: r.color }} size={20} />
                <span className="truncate">{r.name}</span>
              </td>
              <td className="text-center">{r.played}</td>
              <td className="text-center">{r.won}</td>
              <td className="text-center">{r.draw}</td>
              <td className="text-center">{r.lost}</td>
              <td className="text-center">{r.gf}</td>
              <td className="text-center">{r.ga}</td>
              <td className="text-center">{r.gf - r.ga}</td>
              <td className="text-center font-bold" style={{ color: "var(--amber)" }}>{r.pts}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* Admin view                                                              */
/* ---------------------------------------------------------------------- */

function AdminView(props) {
  const [tab, setTab] = useState("teams");
  const tabs = ["teams", "pitches", "tournaments", "scoring", "audit"];
  return (
    <div>
      <div className="flex gap-1 p-1 rounded-lg mb-4 overflow-x-auto" style={{ background: "var(--pitch-800)", border: "1px solid var(--line)" }}>
        {tabs.map((tkey) => (
          <button key={tkey} onClick={() => setTab(tkey)} className="ams-tab-btn px-3 py-1.5 rounded-md text-xs uppercase tracking-wide whitespace-nowrap" style={{ background: tab === tkey ? "var(--amber)" : "transparent", color: tab === tkey ? "#101010" : "var(--chalk-dim)", fontFamily: "var(--font-mono)", fontWeight: 600 }}>
            {tkey}
          </button>
        ))}
      </div>
      {tab === "teams" && <AdminTeams {...props} />}
      {tab === "pitches" && <AdminPitches {...props} />}
      {tab === "tournaments" && <AdminTournaments {...props} />}
      {tab === "scoring" && <AdminScoring {...props} />}
      {tab === "audit" && <AdminAudit {...props} />}
    </div>
  );
}

function AdminTeams({ teams, deleteTeam, addTeam, assignCaptain }) {
  const [name, setName] = useState("");
  return (
    <SectionCard title="Team Directory" icon={Users}>
      <div className="flex gap-2 mb-3">
        <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="New team name" className="flex-1" />
        <PrimaryButton onClick={() => { addTeam(name); setName(""); }}><Plus size={15} /></PrimaryButton>
      </div>
      <div className="space-y-2">
        {teams.map((team) => (
          <div key={team.id} className="flex items-center justify-between px-3 py-2 rounded-md" style={{ background: "var(--pitch-950)", border: "1px solid var(--line)" }}>
            <div className="flex items-center gap-2">
              <TeamBadge team={team} size={22} />
              <span className="text-sm" style={{ color: "var(--chalk)", fontFamily: "var(--font-body)" }}>{team.name}</span>
            </div>
            <div className="flex items-center gap-2">
              {team.captainUserId ? (
                <span className="text-[10px] uppercase tracking-wide" style={{ color: "var(--win-green)", fontFamily: "var(--font-mono)" }}>Captain assigned</span>
              ) : (
                <button className="ams-btn text-[10px] uppercase tracking-wide px-2 py-1 rounded" style={{ border: "1px solid var(--line)", color: "var(--chalk-dim)", fontFamily: "var(--font-mono)" }} onClick={() => assignCaptain(team.id)}>
                  Assign captain
                </button>
              )}
              <button onClick={() => deleteTeam(team.id)} className="ams-btn" aria-label="Delete team">
                <X size={14} color="var(--red-card)" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

function AdminPitches({ pitches, addPitch }) {
  const [name, setName] = useState("");
  return (
    <SectionCard title="Pitches" icon={MapPin}>
      <div className="flex gap-2 mb-3">
        <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="Pitch name (e.g. Pitch 2)" className="flex-1" />
        <PrimaryButton onClick={() => { addPitch(name); setName(""); }}><Plus size={15} /></PrimaryButton>
      </div>
      <div className="flex flex-wrap gap-2">
        {pitches.map((p) => (
          <span key={p.id} className="px-3 py-1.5 rounded-full text-xs" style={{ background: "var(--pitch-950)", border: "1px solid var(--line)", color: "var(--chalk-dim)", fontFamily: "var(--font-mono)" }}>{p.name}</span>
        ))}
      </div>
    </SectionCard>
  );
}

function AdminTournaments({ teams, pitches, tournaments, deleteTournament, createTournament, pitchesById, teamsById }) {
  const [name, setName] = useState("");
  const [teamIds, setTeamIds] = useState([]);
  const [pitchIds, setPitchIds] = useState([]);
  const [startDate, setStartDate] = useState("2026-08-15");
  const [dailyStart, setDailyStart] = useState("09:00");
  const [dailyEnd, setDailyEnd] = useState("17:00");
  const [matchDuration, setMatchDuration] = useState(60);
  const [gap, setGap] = useState(15);
  const [pointsWin, setPointsWin] = useState(3);
  const [pointsDraw, setPointsDraw] = useState(1);

  function toggle(list, setList, id) {
    setList((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  return (
    <>
      <SectionCard title="Create Tournament (Round-Robin, Auto-Scheduled)" icon={Trophy}>
        <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="Tournament name" className="w-full mb-3" />
        <div className="text-xs uppercase tracking-wide mb-1" style={{ color: "var(--chalk-dim)", fontFamily: "var(--font-mono)" }}>Teams</div>
        <div className="grid grid-cols-2 gap-2 mb-3">
          {teams.map((team) => (
            <button key={team.id} onClick={() => toggle(teamIds, setTeamIds, team.id)} className="flex items-center gap-2 px-2 py-1.5 rounded-md text-left" style={{ background: teamIds.includes(team.id) ? "rgba(232,185,58,0.12)" : "var(--pitch-950)", border: `1px solid ${teamIds.includes(team.id) ? "var(--amber)" : "var(--line)"}` }}>
              <TeamBadge team={team} size={18} />
              <span className="text-xs truncate" style={{ color: "var(--chalk)", fontFamily: "var(--font-body)" }}>{team.name}</span>
            </button>
          ))}
        </div>
        <div className="text-xs uppercase tracking-wide mb-1" style={{ color: "var(--chalk-dim)", fontFamily: "var(--font-mono)" }}>Pitches available</div>
        <div className="flex flex-wrap gap-2 mb-3">
          {pitches.map((p) => (
            <button key={p.id} onClick={() => toggle(pitchIds, setPitchIds, p.id)} className="px-2 py-1 rounded-md text-xs" style={{ background: pitchIds.includes(p.id) ? "rgba(232,185,58,0.12)" : "var(--pitch-950)", border: `1px solid ${pitchIds.includes(p.id) ? "var(--amber)" : "var(--line)"}`, color: "var(--chalk)", fontFamily: "var(--font-mono)" }}>
              {p.name}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2 mb-3">
          <label className="text-xs" style={{ color: "var(--chalk-dim)", fontFamily: "var(--font-mono)" }}>
            Start date
            <TextInput type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full mt-1" />
          </label>
          <label className="text-xs" style={{ color: "var(--chalk-dim)", fontFamily: "var(--font-mono)" }}>
            Match duration (min)
            <TextInput type="number" value={matchDuration} onChange={(e) => setMatchDuration(Number(e.target.value))} className="w-full mt-1" />
          </label>
          <label className="text-xs" style={{ color: "var(--chalk-dim)", fontFamily: "var(--font-mono)" }}>
            Gap between matches (min)
            <TextInput type="number" value={gap} onChange={(e) => setGap(Number(e.target.value))} className="w-full mt-1" />
          </label>
          <label className="text-xs" style={{ color: "var(--chalk-dim)", fontFamily: "var(--font-mono)" }}>
            Daily window
            <div className="flex gap-1 mt-1">
              <TextInput type="time" value={dailyStart} onChange={(e) => setDailyStart(e.target.value)} className="flex-1" />
              <TextInput type="time" value={dailyEnd} onChange={(e) => setDailyEnd(e.target.value)} className="flex-1" />
            </div>
          </label>
          <label className="text-xs" style={{ color: "var(--chalk-dim)", fontFamily: "var(--font-mono)" }}>
            Points — win
            <TextInput type="number" value={pointsWin} onChange={(e) => setPointsWin(Number(e.target.value))} className="w-full mt-1" />
          </label>
          <label className="text-xs" style={{ color: "var(--chalk-dim)", fontFamily: "var(--font-mono)" }}>
            Points — draw
            <TextInput type="number" value={pointsDraw} onChange={(e) => setPointsDraw(Number(e.target.value))} className="w-full mt-1" />
          </label>
        </div>
        <PrimaryButton className="w-full" onClick={() => createTournament({ name, teamIds, pitchIds, startDate, dailyStart, dailyEnd, matchDuration, gap, pointsWin, pointsDraw })}>
          Generate round-robin &amp; auto-schedule
        </PrimaryButton>
      </SectionCard>

      <SectionCard title="All Tournaments" icon={CalendarClock}>
        <div className="space-y-2">
          {tournaments.map((t) => (
            <div key={t.id} className="flex items-center justify-between px-3 py-2 rounded-md" style={{ background: "var(--pitch-950)", border: "1px solid var(--line)" }}>
              <span className="text-sm" style={{ color: "var(--chalk)", fontFamily: "var(--font-body)" }}>{t.name}</span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-wide" style={{ color: "var(--chalk-dim)", fontFamily: "var(--font-mono)" }}>{t.matches.length} matches</span>
                <button onClick={() => deleteTournament(t.id)} className="ams-btn" aria-label="Delete tournament">
                  <X size={14} color="var(--red-card)" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </>
  );
}

function AdminScoring({ tournaments, teamsById, pitchesById, pitches, startMatch, adjustScore, finishMatch, postponeMatch, rescheduleMatch, forfeitMatch }) {
  const [reschedulingId, setReschedulingId] = useState(null);
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");
  const [newPitch, setNewPitch] = useState("");

  const STATUS_PRIORITY = { live: 0, scheduled: 1, postponed: 2, finished: 3, forfeited: 4 };

  return (
    <div className="space-y-6">
      {tournaments.map((t) => (
        <div key={t.id}>
          <div className="text-xs uppercase tracking-widest mb-2" style={{ color: "var(--chalk-dim)", fontFamily: "var(--font-mono)" }}>{t.name}</div>
          <div className="space-y-3">
            {[...t.matches].sort((a, b) => STATUS_PRIORITY[a.status] - STATUS_PRIORITY[b.status]).map((m) => (
              <div key={m.id} className="rounded-lg overflow-hidden" style={{ background: "var(--pitch-800)", border: "1px solid var(--line)" }}>
                <div className="flex items-center justify-between px-3 py-2 gap-2">
                  <TeamRow team={teamsById[m.homeId]} />
                  <ScoreDigits match={m} />
                  <TeamRow team={teamsById[m.awayId]} reverse />
                </div>
                <MatchMeta match={m} pitchesById={pitchesById} />

                {m.status === "scheduled" && (
                  <div className="flex">
                    <button onClick={() => startMatch(t.id, m.id)} className="ams-btn flex-1 flex items-center justify-center gap-1.5 py-2 text-xs uppercase tracking-wide" style={{ background: "var(--pitch-700)", color: "var(--chalk)", fontFamily: "var(--font-mono)" }}>
                      <Play size={13} /> Start
                    </button>
                    <button onClick={() => postponeMatch(t.id, m.id)} className="ams-btn flex-1 flex items-center justify-center gap-1.5 py-2 text-xs uppercase tracking-wide" style={{ background: "var(--pitch-950)", color: "var(--chalk-dim)", fontFamily: "var(--font-mono)" }}>
                      Postpone
                    </button>
                    <button onClick={() => forfeitMatch(t.id, m.id, "home")} className="ams-btn flex-1 flex items-center justify-center gap-1.5 py-2 text-xs uppercase tracking-wide" style={{ background: "var(--pitch-950)", color: "var(--red-card)", fontFamily: "var(--font-mono)" }}>
                      Away wins (forfeit)
                    </button>
                  </div>
                )}

                {m.status === "postponed" && (
                  <div className="p-3">
                    {reschedulingId === m.id ? (
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <TextInput type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} />
                          <TextInput type="time" value={newTime} onChange={(e) => setNewTime(e.target.value)} />
                        </div>
                        <select value={newPitch} onChange={(e) => setNewPitch(e.target.value)} className="w-full px-3 py-2 rounded-md text-sm" style={{ background: "var(--pitch-950)", border: "1px solid var(--line)", color: "var(--chalk)" }}>
                          <option value="">Select pitch</option>
                          {pitches.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                        <PrimaryButton className="w-full" onClick={() => { rescheduleMatch(t.id, m.id, newDate, newTime, newPitch); setReschedulingId(null); }}>Confirm reschedule</PrimaryButton>
                      </div>
                    ) : (
                      <button onClick={() => setReschedulingId(m.id)} className="ams-btn w-full py-2 text-xs uppercase tracking-wide rounded-md" style={{ background: "var(--pitch-700)", color: "var(--chalk)", fontFamily: "var(--font-mono)" }}>
                        Reschedule
                      </button>
                    )}
                  </div>
                )}

                {m.status === "live" && (
                  <div>
                    <div className="grid grid-cols-2 gap-px" style={{ background: "var(--line)" }}>
                      {["home", "away"].map((side) => (
                        <div key={side} className="flex items-center justify-center gap-3 py-2" style={{ background: "var(--pitch-800)" }}>
                          <button className="ams-btn p-1.5 rounded-full" style={{ background: "var(--pitch-950)" }} onClick={() => adjustScore(t.id, m.id, side, -1)} aria-label={`Decrease ${side} score`}>
                            <Minus size={14} color="var(--chalk)" />
                          </button>
                          <button className="ams-btn p-1.5 rounded-full" style={{ background: "var(--amber)" }} onClick={() => adjustScore(t.id, m.id, side, 1)} aria-label={`Increase ${side} score`}>
                            <Plus size={14} color="#101010" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <button onClick={() => finishMatch(t.id, m.id)} className="ams-btn w-full flex items-center justify-center gap-1.5 py-2 text-xs uppercase tracking-wide" style={{ background: "var(--red-card)", color: "var(--chalk)", fontFamily: "var(--font-mono)" }}>
                      <Flag size={13} /> Finish match
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function AdminAudit({ auditLog }) {
  return (
    <SectionCard title="Audit Log" icon={Clock}>
      {auditLog.length === 0 && <p className="text-xs" style={{ color: "var(--chalk-dim)", fontFamily: "var(--font-body)" }}>No actions logged yet this session.</p>}
      <div className="space-y-1.5 max-h-96 overflow-y-auto">
        {auditLog.map((entry) => (
          <div key={entry.id} className="text-xs px-2 py-1.5 rounded" style={{ background: "var(--pitch-950)", fontFamily: "var(--font-mono)", color: "var(--chalk-dim)" }}>
            <span style={{ color: "var(--amber)" }}>{entry.action}</span> — {entry.detail} <span className="opacity-60">({entry.actor}, {entry.ts})</span>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

/* ---------------------------------------------------------------------- */
/* Captain view                                                            */
/* ---------------------------------------------------------------------- */

function CaptainView({ currentUser, teams, players, tournaments, teamsById, pitchesById, lineups, addPlayer, removePlayer, submitLineup }) {
  const team = teams.find((t) => t.id === currentUser.teamId);
  const roster = players.filter((p) => p.teamId === team.id);
  const [name, setName] = useState("");
  const [jersey, setJersey] = useState("");

  const myMatches = tournaments.flatMap((t) => t.matches.filter((m) => m.homeId === team.id || m.awayId === team.id).map((m) => ({ ...m, tournamentName: t.name })));

  return (
    <div>
      <SectionCard title={`${team.name} — Roster`} icon={Users}>
        <div className="flex gap-2 mb-3">
          <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="Player name" className="flex-1" />
          <TextInput value={jersey} onChange={(e) => setJersey(e.target.value)} placeholder="#" type="number" style={{ width: 70 }} />
          <PrimaryButton onClick={() => { addPlayer(team.id, name, jersey); setName(""); setJersey(""); }}><Plus size={15} /></PrimaryButton>
        </div>
        <div className="space-y-1.5">
          {roster.map((p) => (
            <div key={p.id} className="flex items-center justify-between px-3 py-1.5 rounded-md" style={{ background: "var(--pitch-950)", border: "1px solid var(--line)" }}>
              <span className="text-sm" style={{ color: "var(--chalk)", fontFamily: "var(--font-body)" }}>#{p.jersey} {p.name}</span>
              <button onClick={() => removePlayer(p.id)} aria-label="Remove player"><X size={13} color="var(--red-card)" /></button>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Your Fixtures" icon={CalendarClock}>
        <div className="space-y-3">
          {myMatches.map((m) => {
            const key = `${m.id}:${team.id}`;
            const currentLineup = lineups[key] || [];
            const locked = m.status !== "scheduled" && m.status !== "postponed";
            return (
              <div key={m.id} className="rounded-lg overflow-hidden" style={{ background: "var(--pitch-800)", border: "1px solid var(--line)" }}>
                <div className="flex items-center justify-between px-3 py-2 gap-2">
                  <TeamRow team={teamsById[m.homeId]} />
                  <ScoreDigits match={m} />
                  <TeamRow team={teamsById[m.awayId]} reverse />
                </div>
                <MatchMeta match={m} pitchesById={pitchesById} />
                <div className="px-3 pb-3">
                  <LineupPicker roster={roster} matchId={m.id} teamId={team.id} initial={currentLineup} locked={locked} onSubmit={submitLineup} />
                </div>
              </div>
            );
          })}
        </div>
      </SectionCard>
    </div>
  );
}

function LineupPicker({ roster, matchId, teamId, initial, locked, onSubmit }) {
  const [selected, setSelected] = useState(initial);
  function toggle(id) {
    if (locked) return;
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wide mb-2" style={{ color: "var(--chalk-dim)", fontFamily: "var(--font-mono)" }}>
        Starting lineup {locked && "(locked — match already underway or finished)"}
      </div>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {roster.map((p) => {
          const isIn = selected.includes(p.id);
          return (
            <button key={p.id} onClick={() => toggle(p.id)} disabled={locked} className="px-2 py-1 rounded-full text-xs flex items-center gap-1" style={{ background: isIn ? "rgba(232,185,58,0.15)" : "var(--pitch-950)", border: `1px solid ${isIn ? "var(--amber)" : "var(--line)"}`, color: "var(--chalk)", fontFamily: "var(--font-mono)", opacity: locked ? 0.6 : 1 }}>
              {isIn && <Check size={10} />} #{p.jersey} {p.name}
            </button>
          );
        })}
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[10px]" style={{ color: selected.length < MIN_LINEUP ? "var(--red-card)" : "var(--win-green)", fontFamily: "var(--font-mono)" }}>
          {selected.length} selected (min {MIN_LINEUP})
        </span>
        {!locked && (
          <button onClick={() => onSubmit(matchId, teamId, selected)} className="ams-btn text-xs px-3 py-1.5 rounded-md font-semibold" style={{ background: "var(--amber)", color: "#101010" }}>
            Submit lineup
          </button>
        )}
      </div>
    </div>
  );
}
