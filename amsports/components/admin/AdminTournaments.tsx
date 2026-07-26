"use client";

import { useState } from "react";
import type { Tournament, Team, Pitch } from "@/lib/types";

export function AdminTournaments({ tournaments, pitches, teams, onCreate }: { tournaments: Tournament[]; pitches: Pitch[]; teams: Team[]; onCreate: (cfg: any) => void }) {
  const [name, setName] = useState("");
  const [teamIds, setTeamIds] = useState<string[]>([]);
  const [pitchIds, setPitchIds] = useState<string[]>([]);
  const [startDate, setStartDate] = useState("2026-08-15");
  const [dailyStart, setDailyStart] = useState("09:00");
  const [dailyEnd, setDailyEnd] = useState("17:00");
  const [matchDuration, setMatchDuration] = useState(60);
  const [gap, setGap] = useState(15);
  const [pointsWin, setPointsWin] = useState(3);
  const [pointsDraw, setPointsDraw] = useState(1);

  function toggle(ids: string[], setIds: React.Dispatch<React.SetStateAction<string[]>>, id: string) {
    setIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  return (
    <div className="space-y-4">
      <section className="p-4 rounded-lg" style={{ background: "var(--pitch-800)", border: "1px solid var(--line)" }}>
        <div className="flex items-center gap-2 mb-3">
          <span style={{ color: "var(--chalk)", fontFamily: "var(--font-body)", fontWeight: 600 }}>Create Tournament</span>
        </div>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Tournament name" className="w-full mb-3 px-3 py-2 rounded-md text-sm bg-[var(--pitch-950)] border border-[var(--line)] text-[var(--chalk)]" />
        <div className="text-xs uppercase tracking-wide mb-1" style={{ color: "var(--chalk-dim)", fontFamily: "var(--font-mono)" }}>Teams</div>
        <div className="grid grid-cols-2 gap-2 mb-3">
          {teams.map((team) => (
            <button key={team.id} onClick={() => toggle(teamIds, setTeamIds, team.id)} className="flex items-center gap-2 px-2 py-1.5 rounded-md text-left" style={{ background: teamIds.includes(team.id) ? "rgba(232,185,58,0.12)" : "var(--pitch-950)", border: `1px solid ${teamIds.includes(team.id) ? "var(--amber)" : "var(--line)"}` }}>
              <span className="flex items-center justify-center rounded-full shrink-0 font-bold" style={{ width: 18, height: 18, background: team.color, color: "#101010", fontFamily: "var(--font-mono)", fontSize: "7px" }}>{team.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()}</span>
              <span className="text-xs truncate" style={{ color: "var(--chalk)", fontFamily: "var(--font-body)" }}>{team.name}</span>
            </button>
          ))}
        </div>
        <div className="text-xs uppercase tracking-wide mb-1" style={{ color: "var(--chalk-dim)", fontFamily: "var(--font-mono)" }}>Pitches available</div>
        <div className="flex flex-wrap gap-2 mb-3">
          {pitches.map((p) => (
            <button key={p.id} onClick={() => toggle(pitchIds, setPitchIds, p.id)} className="px-2 py-1 rounded-md text-xs" style={{ background: pitchIds.includes(p.id) ? "rgba(232,185,58,0.12)" : "var(--pitch-950)", border: `1px solid ${pitchIds.includes(p.id) ? "var(--amber)" : "var(--line)"}`, color: "var(--chalk)", fontFamily: "var(--font-mono)" }}>{p.name}</button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2 mb-3">
          <label className="text-xs" style={{ color: "var(--chalk-dim)", fontFamily: "var(--font-mono)" }}>Start date<input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full mt-1 px-3 py-2 rounded-md text-sm bg-[var(--pitch-950)] border border-[var(--line)] text-[var(--chalk)]" /></label>
          <label className="text-xs" style={{ color: "var(--chalk-dim)", fontFamily: "var(--font-mono)" }}>Match duration (min)<input type="number" value={matchDuration} onChange={(e) => setMatchDuration(Number(e.target.value))} className="w-full mt-1 px-3 py-2 rounded-md text-sm bg-[var(--pitch-950)] border border-[var(--line)] text-[var(--chalk)]" /></label>
          <label className="text-xs" style={{ color: "var(--chalk-dim)", fontFamily: "var(--font-mono)" }}>Gap between matches (min)<input type="number" value={gap} onChange={(e) => setGap(Number(e.target.value))} className="w-full mt-1 px-3 py-2 rounded-md text-sm bg-[var(--pitch-950)] border border-[var(--line)] text-[var(--chalk)]" /></label>
          <label className="text-xs" style={{ color: "var(--chalk-dim)", fontFamily: "var(--font-mono)" }}>Daily window<div className="flex gap-1 mt-1"><input type="time" value={dailyStart} onChange={(e) => setDailyStart(e.target.value)} className="flex-1 px-3 py-2 rounded-md text-sm bg-[var(--pitch-950)] border border-[var(--line)] text-[var(--chalk)]" /><input type="time" value={dailyEnd} onChange={(e) => setDailyEnd(e.target.value)} className="flex-1 px-3 py-2 rounded-md text-sm bg-[var(--pitch-950)] border border-[var(--line)] text-[var(--chalk)]" /></div></label>
          <label className="text-xs" style={{ color: "var(--chalk-dim)", fontFamily: "var(--font-mono)" }}>Points — win<input type="number" value={pointsWin} onChange={(e) => setPointsWin(Number(e.target.value))} className="w-full mt-1 px-3 py-2 rounded-md text-sm bg-[var(--pitch-950)] border border-[var(--line)] text-[var(--chalk)]" /></label>
          <label className="text-xs" style={{ color: "var(--chalk-dim)", fontFamily: "var(--font-mono)" }}>Points — draw<input type="number" value={pointsDraw} onChange={(e) => setPointsDraw(Number(e.target.value))} className="w-full mt-1 px-3 py-2 rounded-md text-sm bg-[var(--pitch-950)] border border-[var(--line)] text-[var(--chalk)]" /></label>
        </div>
        <button onClick={() => onCreate({ name, teamIds, pitchIds, startDate, dailyStart, dailyEnd, matchDuration, gap, pointsWin, pointsDraw })} className="w-full py-2 rounded-md text-sm font-semibold bg-amber-500 text-[#101010]">Generate round-robin &amp; auto-schedule</button>
      </section>

      <section className="p-4 rounded-lg" style={{ background: "var(--pitch-800)", border: "1px solid var(--line)" }}>
        <div className="flex items-center gap-2 mb-3">
          <span style={{ color: "var(--chalk)", fontFamily: "var(--font-body)", fontWeight: 600 }}>All Tournaments</span>
        </div>
        <div className="space-y-2">
          {tournaments.map((t) => (
            <div key={t.id} className="flex items-center justify-between px-3 py-2 rounded-md" style={{ background: "var(--pitch-950)", border: "1px solid var(--line)" }}>
              <span className="text-sm" style={{ color: "var(--chalk)", fontFamily: "var(--font-body)" }}>{t.name}</span>
              <span className="text-[10px] uppercase tracking-wide" style={{ color: "var(--chalk-dim)", fontFamily: "var(--font-mono)" }}>{tMatches(t)} matches</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function tMatches(t: Tournament): number {
  return 0;
}