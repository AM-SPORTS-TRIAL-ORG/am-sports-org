"use client";

import { useState } from "react";
import type { Match, Tournament, Team, Pitch } from "@/lib/types";

const STATUS_PRIORITY: Record<string, number> = {
  live: 0, scheduled: 1, postponed: 2, finished: 3, forfeited: 4,
};

const INPUT = "w-full px-3 py-2 rounded-md text-sm bg-[var(--pitch-950)] border border-[var(--line)] text-[var(--chalk)]";

export function AdminScoring({
  matches,
  tournaments,
  teams,
  pitches,
  onUpdate,
  onUpdateTournament,
  onAddMatch,
  onDeleteMatch,
}: {
  matches: Match[];
  tournaments: Tournament[];
  teams: Team[];
  pitches: Pitch[];
  onUpdate: (id: string, updates: Partial<Match>) => void;
  onUpdateTournament: (id: string, status: "upcoming" | "active" | "completed") => void;
  onAddMatch: (match: Omit<Match, "id" | "home_score" | "away_score" | "status">) => void;
  onDeleteMatch: (id: string) => void;
}) {
  // ── Add match form state ──────────────────────────────────────────────────
  const [showAdd, setShowAdd] = useState(false);
  const [addTourId, setAddTourId] = useState("");
  const [addHome, setAddHome] = useState("");
  const [addAway, setAddAway] = useState("");
  const [addDate, setAddDate] = useState("");
  const [addTime, setAddTime] = useState("09:00");
  const [addPitch, setAddPitch] = useState("");
  const [addMatchday, setAddMatchday] = useState(1);
  const [addError, setAddError] = useState("");

  // ── Score edit state (for finished/forfeited matches) ────────────────────
  const [editingScoreId, setEditingScoreId] = useState<string | null>(null);
  const [editHome, setEditHome] = useState(0);
  const [editAway, setEditAway] = useState(0);

  // ── Reschedule state ──────────────────────────────────────────────────────
  const [reschedulingId, setReschedulingId] = useState<string | null>(null);
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");
  const [newPitch, setNewPitch] = useState("");

  function handleAddMatch() {
    setAddError("");
    if (!addTourId) return setAddError("Select a tournament.");
    if (!addHome || !addAway) return setAddError("Select both teams.");
    if (addHome === addAway) return setAddError("Home and away teams must differ.");
    if (!addDate) return setAddError("Select a date.");

    onAddMatch({
      tournament_id: addTourId,
      home_team_id: addHome,
      away_team_id: addAway,
      pitch_id: addPitch || null,
      scheduled_date: addDate,
      scheduled_time: addTime,
      matchday: addMatchday,
    });

    // Reset form
    setAddHome("");
    setAddAway("");
    setAddDate("");
    setAddTime("09:00");
    setAddPitch("");
    setAddMatchday(1);
    setShowAdd(false);
  }

  // Teams available for a given tournament (derived from existing matches)
  function teamsInTournament(tourId: string) {
    if (!tourId) return teams;
    const ids = new Set<string>();
    matches
      .filter((m) => m.tournament_id === tourId)
      .forEach((m) => { ids.add(m.home_team_id); ids.add(m.away_team_id); });
    // If no matches yet, show all teams
    return ids.size > 0 ? teams.filter((t) => ids.has(t.id)) : teams;
  }

  return (
    <div className="space-y-6">

      {/* ── Add match panel ─────────────────────────────────────────────── */}
      <section
        className="rounded-lg overflow-hidden"
        style={{ background: "var(--pitch-800)", border: "1px solid var(--line)" }}
      >
        <button
          onClick={() => setShowAdd((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold"
          style={{ color: "var(--chalk)", fontFamily: "var(--font-body)" }}
        >
          <span>+ Add Match Manually</span>
          <span style={{ color: "var(--amber)", fontFamily: "var(--font-mono)", fontSize: "12px" }}>
            {showAdd ? "▲ collapse" : "▼ expand"}
          </span>
        </button>

        {showAdd && (
          <div className="px-4 pb-4 space-y-3 border-t" style={{ borderColor: "var(--line)" }}>
            <div className="grid grid-cols-2 gap-2 pt-3">
              {/* Tournament */}
              <label className="text-xs col-span-2" style={{ color: "var(--chalk-dim)", fontFamily: "var(--font-mono)" }}>
                Tournament
                <select value={addTourId} onChange={(e) => { setAddTourId(e.target.value); setAddHome(""); setAddAway(""); }} className={`mt-1 ${INPUT}`}>
                  <option value="">— select —</option>
                  {tournaments.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </label>

              {/* Home team */}
              <label className="text-xs" style={{ color: "var(--chalk-dim)", fontFamily: "var(--font-mono)" }}>
                Home team
                <select value={addHome} onChange={(e) => setAddHome(e.target.value)} className={`mt-1 ${INPUT}`}>
                  <option value="">— select —</option>
                  {teamsInTournament(addTourId)
                    .filter((t) => t.id !== addAway)
                    .map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </label>

              {/* Away team */}
              <label className="text-xs" style={{ color: "var(--chalk-dim)", fontFamily: "var(--font-mono)" }}>
                Away team
                <select value={addAway} onChange={(e) => setAddAway(e.target.value)} className={`mt-1 ${INPUT}`}>
                  <option value="">— select —</option>
                  {teamsInTournament(addTourId)
                    .filter((t) => t.id !== addHome)
                    .map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </label>

              {/* Date */}
              <label className="text-xs" style={{ color: "var(--chalk-dim)", fontFamily: "var(--font-mono)" }}>
                Date
                <input type="date" value={addDate} onChange={(e) => setAddDate(e.target.value)} className={`mt-1 ${INPUT}`} />
              </label>

              {/* Time */}
              <label className="text-xs" style={{ color: "var(--chalk-dim)", fontFamily: "var(--font-mono)" }}>
                Kick-off time
                <input type="time" value={addTime} onChange={(e) => setAddTime(e.target.value)} className={`mt-1 ${INPUT}`} />
              </label>

              {/* Pitch */}
              <label className="text-xs" style={{ color: "var(--chalk-dim)", fontFamily: "var(--font-mono)" }}>
                Pitch
                <select value={addPitch} onChange={(e) => setAddPitch(e.target.value)} className={`mt-1 ${INPUT}`}>
                  <option value="">— none —</option>
                  {pitches.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </label>

              {/* Matchday */}
              <label className="text-xs" style={{ color: "var(--chalk-dim)", fontFamily: "var(--font-mono)" }}>
                Matchday #
                <input
                  type="number"
                  min={1}
                  value={addMatchday}
                  onChange={(e) => setAddMatchday(Number(e.target.value))}
                  className={`mt-1 ${INPUT}`}
                />
              </label>
            </div>

            {addError && (
              <p className="text-xs" style={{ color: "var(--red-card)", fontFamily: "var(--font-body)" }}>
                {addError}
              </p>
            )}

            <button
              onClick={handleAddMatch}
              className="w-full py-2 rounded-md text-sm font-semibold"
              style={{ background: "var(--amber)", color: "#101010", fontFamily: "var(--font-body)" }}
            >
              Save Match
            </button>
          </div>
        )}
      </section>

      {/* ── Match list per tournament ────────────────────────────────────── */}
      {tournaments.length === 0 && (
        <p style={{ color: "var(--chalk-dim)" }}>No tournaments yet.</p>
      )}

      {tournaments.map((t) => {
        const tMatches = matches
          .filter((m) => m.tournament_id === t.id)
          .sort((a, b) => {
            const sd = a.scheduled_date.localeCompare(b.scheduled_date);
            if (sd !== 0) return sd;
            const st = a.scheduled_time.localeCompare(b.scheduled_time);
            if (st !== 0) return st;
            return STATUS_PRIORITY[a.status] - STATUS_PRIORITY[b.status];
          });

        if (tMatches.length === 0) return null;

        return (
          <div key={t.id}>
            {/* Tournament header with status control */}
            <div className="flex items-center justify-between mb-2">
              <div
                className="text-xs uppercase tracking-widest"
                style={{ color: "var(--chalk-dim)", fontFamily: "var(--font-mono)" }}
              >
                {t.name}
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[10px] uppercase tracking-wide mr-1" style={{ color: "var(--chalk-dim)", fontFamily: "var(--font-mono)" }}>Status:</span>
                {(["upcoming", "active", "completed"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => onUpdateTournament(t.id, s)}
                    className="px-2 py-0.5 rounded text-[10px] uppercase tracking-wide"
                    style={{
                      fontFamily: "var(--font-mono)",
                      background: t.status === s ? "var(--amber)" : "var(--pitch-950)",
                      color: t.status === s ? "#101010" : "var(--chalk-dim)",
                      border: `1px solid ${t.status === s ? "var(--amber)" : "var(--line)"}`,
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              {tMatches.map((m) => {
                const home = teams.find((tm) => tm.id === m.home_team_id);
                const away = teams.find((tm) => tm.id === m.away_team_id);
                return (
                  <div
                    key={m.id}
                    className="rounded-lg overflow-hidden"
                    style={{ background: "var(--pitch-800)", border: "1px solid var(--line)" }}
                  >
                    {/* Score header */}
                    <div className="flex items-center justify-between px-3 py-2 gap-2">
                      <span style={{ color: "var(--chalk)" }}>{home?.name ?? "TBD"}</span>
                      <span
                        style={{
                          fontFamily: "var(--font-display)",
                          fontSize: "20px",
                          color: "var(--chalk)",
                        }}
                      >
                        {m.status === "scheduled" || m.status === "postponed"
                          ? "- : -"
                          : `${m.home_score} : ${m.away_score}`}
                      </span>
                      <span style={{ color: "var(--chalk)" }}>{away?.name ?? "TBD"}</span>
                    </div>

                    {/* Meta row */}
                    <div
                      className="flex items-center justify-between px-3 pb-2 text-[10px] uppercase tracking-wide"
                      style={{ color: "var(--chalk-dim)", fontFamily: "var(--font-mono)" }}
                    >
                      <span>
                        {m.scheduled_date} {m.scheduled_time}
                        {" · "}
                        {pitches.find((p) => p.id === m.pitch_id)?.name ?? "No pitch"}
                        {" · MD"}
                        {m.matchday + 1}
                      </span>
                      <div className="flex items-center gap-2">
                        {m.status === "live" && <span className="pulse-dot" />}
                        <span style={{ color: "var(--amber)" }}>{m.status}</span>
                        {/* Delete button — only on scheduled/postponed */}
                        {(m.status === "scheduled" || m.status === "postponed") && (
                          <button
                            onClick={() => onDeleteMatch(m.id)}
                            title="Delete match"
                            className="ml-1"
                            style={{ color: "var(--red-card)" }}
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    {m.status === "scheduled" && (
                      <div className="flex">
                        <button
                          onClick={() => onUpdate(m.id, { status: "live" })}
                          className="flex-1 py-2 text-xs uppercase tracking-wide"
                          style={{ background: "var(--pitch-700)", color: "var(--chalk)" }}
                        >
                          ▶ Start
                        </button>
                        <button
                          onClick={() => onUpdate(m.id, { status: "postponed" })}
                          className="flex-1 py-2 text-xs uppercase tracking-wide"
                          style={{ background: "var(--pitch-950)", color: "var(--chalk-dim)" }}
                        >
                          Postpone
                        </button>
                        <button
                          onClick={() => onUpdate(m.id, { status: "forfeited", home_score: 0, away_score: 3 })}
                          className="flex-1 py-2 text-xs uppercase tracking-wide"
                          style={{ background: "var(--pitch-950)", color: "var(--red-card)" }}
                        >
                          Away wins
                        </button>
                      </div>
                    )}

                    {m.status === "postponed" && (
                      <div className="p-3">
                        {reschedulingId === m.id ? (
                          <div className="space-y-2">
                            <div className="grid grid-cols-2 gap-2">
                              <input
                                type="date"
                                value={newDate}
                                onChange={(e) => setNewDate(e.target.value)}
                                className={INPUT}
                              />
                              <input
                                type="time"
                                value={newTime}
                                onChange={(e) => setNewTime(e.target.value)}
                                className={INPUT}
                              />
                            </div>
                            <select
                              value={newPitch}
                              onChange={(e) => setNewPitch(e.target.value)}
                              className={INPUT}
                            >
                              <option value="">Select pitch</option>
                              {pitches.map((p) => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                              ))}
                            </select>
                            <button
                              onClick={() => {
                                onUpdate(m.id, {
                                  scheduled_date: newDate,
                                  scheduled_time: newTime,
                                  pitch_id: newPitch || null,
                                  status: "scheduled",
                                });
                                setReschedulingId(null);
                              }}
                              className="w-full py-2 rounded-md text-xs uppercase tracking-wide"
                              style={{ background: "var(--amber)", color: "#101010" }}
                            >
                              Confirm reschedule
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setReschedulingId(m.id)}
                            className="w-full py-2 text-xs uppercase tracking-wide rounded-md"
                            style={{ background: "var(--pitch-700)", color: "var(--chalk)" }}
                          >
                            Reschedule
                          </button>
                        )}
                      </div>
                    )}

                    {(m.status === "finished" || m.status === "forfeited") && (
                      <div className="border-t" style={{ borderColor: "var(--line)" }}>
                        {editingScoreId === m.id ? (
                          <div className="p-3 space-y-2">
                            <p className="text-[10px] uppercase tracking-wide" style={{ color: "var(--chalk-dim)", fontFamily: "var(--font-mono)" }}>
                              Edit final score
                            </p>
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-2 flex-1">
                                <span className="text-xs truncate" style={{ color: "var(--chalk)", fontFamily: "var(--font-body)" }}>{home?.name}</span>
                                <input
                                  type="number"
                                  min={0}
                                  value={editHome}
                                  onChange={(e) => setEditHome(Number(e.target.value))}
                                  className="w-14 px-2 py-1 rounded text-sm text-center"
                                  style={{ background: "var(--pitch-950)", border: "1px solid var(--line)", color: "var(--chalk)" }}
                                />
                              </div>
                              <span style={{ color: "var(--chalk-dim)" }}>:</span>
                              <div className="flex items-center gap-2 flex-1 flex-row-reverse">
                                <span className="text-xs truncate" style={{ color: "var(--chalk)", fontFamily: "var(--font-body)" }}>{away?.name}</span>
                                <input
                                  type="number"
                                  min={0}
                                  value={editAway}
                                  onChange={(e) => setEditAway(Number(e.target.value))}
                                  className="w-14 px-2 py-1 rounded text-sm text-center"
                                  style={{ background: "var(--pitch-950)", border: "1px solid var(--line)", color: "var(--chalk)" }}
                                />
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  onUpdate(m.id, { home_score: editHome, away_score: editAway });
                                  setEditingScoreId(null);
                                }}
                                className="flex-1 py-1.5 rounded text-xs font-semibold"
                                style={{ background: "var(--amber)", color: "#101010", fontFamily: "var(--font-mono)" }}
                              >
                                Save score
                              </button>
                              <button
                                onClick={() => setEditingScoreId(null)}
                                className="flex-1 py-1.5 rounded text-xs"
                                style={{ background: "var(--pitch-700)", color: "var(--chalk-dim)", fontFamily: "var(--font-mono)" }}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex">
                            <button
                              onClick={() => {
                                setEditingScoreId(m.id);
                                setEditHome(m.home_score);
                                setEditAway(m.away_score);
                              }}
                              className="flex-1 py-2 text-xs uppercase tracking-wide"
                              style={{ background: "var(--pitch-950)", color: "var(--chalk-dim)" }}
                            >
                              ✎ Edit score
                            </button>
                            <button
                              onClick={() => onUpdate(m.id, { status: "live", })}
                              className="flex-1 py-2 text-xs uppercase tracking-wide"
                              style={{ background: "var(--pitch-700)", color: "var(--chalk-dim)" }}
                            >
                              ↩ Reopen
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {m.status === "live" && (
                      <div>
                        <div className="grid grid-cols-2 gap-px" style={{ background: "var(--line)" }}>
                          {(["home", "away"] as const).map((side) => (
                            <div
                              key={side}
                              className="flex items-center justify-center gap-3 py-2"
                              style={{ background: "var(--pitch-800)" }}
                            >
                              <button
                                onClick={() =>
                                  onUpdate(m.id, {
                                    [side === "home" ? "home_score" : "away_score"]:
                                      Math.max(0, (side === "home" ? m.home_score : m.away_score) - 1),
                                  })
                                }
                                className="px-3 py-1 rounded-full"
                                style={{ background: "var(--pitch-950)" }}
                              >
                                −
                              </button>
                              <span
                                style={{
                                  fontFamily: "var(--font-display)",
                                  fontSize: "20px",
                                  color: "var(--chalk)",
                                }}
                              >
                                {side === "home" ? m.home_score : m.away_score}
                              </span>
                              <button
                                onClick={() =>
                                  onUpdate(m.id, {
                                    [side === "home" ? "home_score" : "away_score"]:
                                      (side === "home" ? m.home_score : m.away_score) + 1,
                                  })
                                }
                                className="px-3 py-1 rounded-full"
                                style={{ background: "var(--amber)" }}
                              >
                                +
                              </button>
                            </div>
                          ))}
                        </div>
                        <button
                          onClick={() => onUpdate(m.id, { status: "finished" })}
                          className="w-full flex items-center justify-center gap-1.5 py-2 text-xs uppercase tracking-wide"
                          style={{ background: "var(--red-card)", color: "var(--chalk)" }}
                        >
                          Finish match
                        </button>
                      </div>
                    )}

                    {(m.status === "finished" || m.status === "forfeited") && (
                      <FinishedMatchEditor match={m} onUpdate={onUpdate} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Finished / Forfeited score editor ────────────────────────────────────────
function FinishedMatchEditor({
  match,
  onUpdate,
}: {
  match: Match;
  onUpdate: (id: string, updates: Partial<Match>) => void;
}) {
  const [open, setOpen] = useState(false);
  const [home, setHome] = useState(match.home_score);
  const [away, setAway] = useState(match.away_score);

  function handleSave() {
    onUpdate(match.id, { home_score: home, away_score: away });
    setOpen(false);
  }

  return (
    <div className="border-t" style={{ borderColor: "var(--line)" }}>
      <button
        onClick={() => { setOpen((v) => !v); setHome(match.home_score); setAway(match.away_score); }}
        className="w-full py-2 text-xs uppercase tracking-wide"
        style={{ background: "var(--pitch-950)", color: "var(--chalk-dim)", fontFamily: "var(--font-mono)" }}
      >
        {open ? "▲ cancel edit" : "✎ correct score"}
      </button>

      {open && (
        <div className="p-3 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <label className="text-xs text-center" style={{ color: "var(--chalk-dim)", fontFamily: "var(--font-mono)" }}>
              Home score
              <div className="flex items-center justify-center gap-2 mt-1">
                <button
                  onClick={() => setHome((v) => Math.max(0, v - 1))}
                  className="px-3 py-1 rounded-full"
                  style={{ background: "var(--pitch-700)", color: "var(--chalk)" }}
                >−</button>
                <span style={{ fontFamily: "var(--font-display)", fontSize: "22px", color: "var(--chalk)", minWidth: "24px", textAlign: "center" }}>
                  {home}
                </span>
                <button
                  onClick={() => setHome((v) => v + 1)}
                  className="px-3 py-1 rounded-full"
                  style={{ background: "var(--amber)", color: "#101010" }}
                >+</button>
              </div>
            </label>

            <label className="text-xs text-center" style={{ color: "var(--chalk-dim)", fontFamily: "var(--font-mono)" }}>
              Away score
              <div className="flex items-center justify-center gap-2 mt-1">
                <button
                  onClick={() => setAway((v) => Math.max(0, v - 1))}
                  className="px-3 py-1 rounded-full"
                  style={{ background: "var(--pitch-700)", color: "var(--chalk)" }}
                >−</button>
                <span style={{ fontFamily: "var(--font-display)", fontSize: "22px", color: "var(--chalk)", minWidth: "24px", textAlign: "center" }}>
                  {away}
                </span>
                <button
                  onClick={() => setAway((v) => v + 1)}
                  className="px-3 py-1 rounded-full"
                  style={{ background: "var(--amber)", color: "#101010" }}
                >+</button>
              </div>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleSave}
              className="py-2 rounded-md text-xs font-semibold uppercase tracking-wide"
              style={{ background: "var(--amber)", color: "#101010", fontFamily: "var(--font-mono)" }}
            >
              Save score
            </button>
            <button
              onClick={() => onUpdate(match.id, { status: "live" })}
              className="py-2 rounded-md text-xs uppercase tracking-wide"
              style={{ background: "var(--pitch-700)", color: "var(--chalk)", fontFamily: "var(--font-mono)" }}
            >
              Reopen as live
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
