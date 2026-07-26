"use client";

import { useState } from "react";
import type { Team } from "@/lib/types";

export function AdminTeams({ teams, onAdd, onDelete }: { teams: Team[]; onAdd: (name: string) => void; onDelete: (id: string) => void }) {
  const [name, setName] = useState("");
  return (
    <section className="p-4 rounded-lg mb-4" style={{ background: "var(--pitch-800)", border: "1px solid var(--line)" }}>
      <div className="flex items-center gap-2 mb-3">
        <span style={{ color: "var(--chalk)", fontFamily: "var(--font-body)", fontWeight: 600 }}>Team Directory</span>
      </div>
      <div className="flex gap-2 mb-3">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="New team name" className="flex-1 px-3 py-2 rounded-md text-sm bg-[var(--pitch-950)] border border-[var(--line)] text-[var(--chalk)]" />
        <button onClick={() => { onAdd(name); setName(""); }} className="px-3 py-2 rounded-md text-sm font-semibold bg-amber-500 text-[#101010]">+</button>
      </div>
      <div className="space-y-2">
        {teams.map((team) => (
          <div key={team.id} className="flex items-center justify-between px-3 py-2 rounded-md" style={{ background: "var(--pitch-950)", border: "1px solid var(--line)" }}>
            <div className="flex items-center gap-2">
              <TeamBadge team={team} size={22} />
              <span className="text-sm" style={{ color: "var(--chalk)", fontFamily: "var(--font-body)" }}>{team.name}</span>
            </div>
            <div className="flex items-center gap-2">
              {team.captain_user_id ? (
                <span className="text-[10px] uppercase tracking-wide" style={{ color: "var(--win-green)", fontFamily: "var(--font-mono)" }}>Captain assigned</span>
              ) : (
                <span className="text-[10px] uppercase tracking-wide" style={{ color: "var(--chalk-dim)", fontFamily: "var(--font-mono)" }}>No captain</span>
              )}
              <button onClick={() => onDelete(team.id)} className="px-2 py-1 rounded text-xs" style={{ color: "var(--red-card)" }}>
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function TeamBadge({ team, size = 22 }: { team: Pick<Team, "name" | "color">; size?: number }) {
  return (
    <div className="flex items-center justify-center rounded-full shrink-0 font-bold" style={{ width: size, height: size, background: team.color, color: "#101010", fontFamily: "var(--font-mono)", fontSize: size * 0.34 }}>
      {team.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()}
    </div>
  );
}