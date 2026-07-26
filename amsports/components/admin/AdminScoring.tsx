"use client";

import { useState } from "react";
import type { Match, Tournament, Team, Pitch } from "@/lib/types";

const STATUS_PRIORITY: Record<string, number> = { live: 0, scheduled: 1, postponed: 2, finished: 3, forfeited: 4 };

export function AdminScoring({ matches, tournaments, teams, pitches, onUpdate }: { matches: Match[]; tournaments: Tournament[]; teams: Team[]; pitches: Pitch[]; onUpdate: (id: string, updates: Partial<Match>) => void }) {
  const [reschedulingId, setReschedulingId] = useState<string | null>(null);
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");
  const [newPitch, setNewPitch] = useState("");

  if (tournaments.length === 0) {
    return <p style={{ color: "var(--chalk-dim)" }}>No tournaments yet.</p>;
  }

  return (
    <div className="space-y-6">
      {tournaments.map((t) => {
        const tMatches = matches.filter((m) => m.tournament_id === t.id);
        if (tMatches.length === 0) return null;
        return (
          <div key={t.id}>
            <div className="text-xs uppercase tracking-widest mb-2" style={{ color: "var(--chalk-dim)", fontFamily: "var(--font-mono)" }}>{t.name}</div>
            <div className="space-y-3">
              {tMatches.sort((a, b) => STATUS_PRIORITY[a.status] - STATUS_PRIORITY[b.status]).map((m) => {
                const home = teams.find((tm) => tm.id === m.home_team_id);
                const away = teams.find((tm) => tm.id === m.away_team_id);
                return (
                  <div key={m.id} className="rounded-lg overflow-hidden" style={{ background: "var(--pitch-800)", border: "1px solid var(--line)" }}>
                    <div className="flex items-center justify-between px-3 py-2 gap-2">
                      <span style={{ color: "var(--chalk)" }}>{home?.name ?? "TBD"}</span>
                      <span style={{ fontFamily: "var(--font-display)", fontSize: "20px", color: "var(--chalk)" }}>{m.status === "scheduled" || m.status === "postponed" ? "-" : m.home_score} : {m.status === "scheduled" || m.status === "postponed" ? "-" : m.away_score}</span>
                      <span style={{ color: "var(--chalk)" }}>{away?.name ?? "TBD"}</span>
                    </div>
                    <div className="px-3 pb-2 text-[10px] uppercase tracking-wide" style={{ color: "var(--chalk-dim)", fontFamily: "var(--font-mono)" }}>
                      {m.scheduled_date} {m.scheduled_time} · {pitches.find((p) => p.id === m.pitch_id)?.name ?? "TBD"}
                      {m.status === "live" && <span className="pulse-dot ml-2" />}
                      <span style={{ color: "var(--amber)" }}> {m.status}</span>
                    </div>

                    {m.status === "scheduled" && (
                      <div className="flex">
                        <button onClick={() => onUpdate(m.id, { status: "live" })} className="flex-1 py-2 text-xs uppercase tracking-wide" style={{ background: "var(--pitch-700)", color: "var(--chalk)" }}>▶ Start</button>
                        <button onClick={() => onUpdate(m.id, { status: "postponed" })} className="flex-1 py-2 text-xs uppercase tracking-wide" style={{ background: "var(--pitch-950)", color: "var(--chalk-dim)" }}>Postpone</button>
                        <button onClick={() => onUpdate(m.id, { status: "forfeited", home_score: 0, away_score: 3 })} className="flex-1 py-2 text-xs uppercase tracking-wide" style={{ background: "var(--pitch-950)", color: "var(--red-card)" }}>Away wins</button>
                      </div>
                    )}

                    {m.status === "postponed" && (
                      <div className="p-3">
                        {reschedulingId === m.id ? (
                          <div className="space-y-2">
                            <div className="grid grid-cols-2 gap-2">
                              <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} className="w-full px-3 py-2 rounded-md text-sm bg-[var(--pitch-950)] border border-[var(--line)] text-[var(--chalk)]" />
                              <input type="time" value={newTime} onChange={(e) => setNewTime(e.target.value)} className="w-full px-3 py-2 rounded-md text-sm bg-[var(--pitch-950)] border border-[var(--line)] text-[var(--chalk)]" />
                            </div>
                            <select value={newPitch} onChange={(e) => setNewPitch(e.target.value)} className="w-full px-3 py-2 rounded-md text-sm bg-[var(--pitch-950)] border border-[var(--line)] text-[var(--chalk)]">
                              <option value="">Select pitch</option>
                              {pitches.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                            <button onClick={() => { onUpdate(m.id, { scheduled_date: newDate, scheduled_time: newTime, pitch_id: newPitch || null, status: "scheduled" }); setReschedulingId(null); }} className="w-full py-2 rounded-md text-xs uppercase tracking-wide bg-amber-500 text-[#101010]">Confirm reschedule</button>
                          </div>
                        ) : (
                          <button onClick={() => setReschedulingId(m.id)} className="w-full py-2 text-xs uppercase tracking-wide rounded-md" style={{ background: "var(--pitch-700)", color: "var(--chalk)" }}>Reschedule</button>
                        )}
                      </div>
                    )}

                    {m.status === "live" && (
                      <div>
                        <div className="grid grid-cols-2 gap-px" style={{ background: "var(--line)" }}>
                          {["home", "away"].map((side) => (
                            <div key={side} className="flex items-center justify-center gap-3 py-2" style={{ background: "var(--pitch-800)" }}>
                              <button onClick={() => onUpdate(m.id, { [side === "home" ? "home_score" : "away_score"]: Math.max(0, (side === "home" ? m.home_score : m.away_score) - 1) })} className="px-3 py-1 rounded-full" style={{ background: "var(--pitch-950)" }}>−</button>
                              <span style={{ fontFamily: "var(--font-display)", fontSize: "20px", color: "var(--chalk)" }}>{side === "home" ? m.home_score : m.away_score}</span>
                              <button onClick={() => onUpdate(m.id, { [side === "home" ? "home_score" : "away_score"]: (side === "home" ? m.home_score : m.away_score) + 1 })} className="px-3 py-1 rounded-full" style={{ background: "var(--amber)" }}>+</button>
                            </div>
                          ))}
                        </div>
                        <button onClick={() => onUpdate(m.id, { status: "finished" })} className="w-full flex items-center justify-center gap-1.5 py-2 text-xs uppercase tracking-wide" style={{ background: "var(--red-card)", color: "var(--chalk)" }}>Finish match</button>
                      </div>
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