"use client";

import { useState } from "react";
import type { Team, Match } from "@/lib/types";

export function AdminTeams({
  teams,
  matches,
  onAdd,
  onEdit,
  onDelete,
}: {
  teams: Team[];
  matches: Match[];
  onAdd: (name: string) => void;
  onEdit: (id: string, name: string) => void;
  onDelete: (id: string) => void;
}) {
  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  function startEdit(team: Team) {
    setEditingId(team.id);
    setEditName(team.name);
  }

  function commitEdit(id: string) {
    if (editName.trim()) onEdit(id, editName.trim());
    setEditingId(null);
  }

  function hasActiveMatches(teamId: string) {
    return matches.some(
      (m) =>
        (m.home_team_id === teamId || m.away_team_id === teamId) &&
        m.status !== "finished" &&
        m.status !== "forfeited"
    );
  }

  return (
    <section className="p-4 rounded-lg mb-4" style={{ background: "var(--pitch-800)", border: "1px solid var(--line)" }}>
      <div className="flex items-center gap-2 mb-3">
        <span style={{ color: "var(--chalk)", fontFamily: "var(--font-body)", fontWeight: 600 }}>Team Directory</span>
      </div>

      {/* Add team */}
      <div className="flex gap-2 mb-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="New team name"
          className="flex-1 px-3 py-2 rounded-md text-sm bg-[var(--pitch-950)] border border-[var(--line)] text-[var(--chalk)]"
          onKeyDown={(e) => { if (e.key === "Enter" && name.trim()) { onAdd(name.trim()); setName(""); } }}
        />
        <button
          onClick={() => { if (name.trim()) { onAdd(name.trim()); setName(""); } }}
          className="px-3 py-2 rounded-md text-sm font-semibold bg-amber-500 text-[#101010]"
        >
          +
        </button>
      </div>

      <div className="space-y-2">
        {teams.map((team) => (
          <div
            key={team.id}
            className="flex items-center justify-between px-3 py-2 rounded-md"
            style={{ background: "var(--pitch-950)", border: "1px solid var(--line)" }}
          >
            <div className="flex items-center gap-2 min-w-0">
              <TeamBadge team={team} size={22} />
              {editingId === team.id ? (
                <input
                  autoFocus
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onBlur={() => commitEdit(team.id)}
                  onKeyDown={(e) => { if (e.key === "Enter") commitEdit(team.id); if (e.key === "Escape") setEditingId(null); }}
                  className="px-2 py-0.5 rounded text-sm bg-[var(--pitch-800)] border border-[var(--amber)] text-[var(--chalk)]"
                  style={{ fontFamily: "var(--font-body)" }}
                />
              ) : (
                <span className="text-sm truncate" style={{ color: "var(--chalk)", fontFamily: "var(--font-body)" }}>
                  {team.name}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0 ml-2">
              {team.captain_user_id ? (
                <span className="text-[10px] uppercase tracking-wide" style={{ color: "var(--win-green)", fontFamily: "var(--font-mono)" }}>
                  Captain assigned
                </span>
              ) : (
                <span className="text-[10px] uppercase tracking-wide" style={{ color: "var(--chalk-dim)", fontFamily: "var(--font-mono)" }}>
                  No captain
                </span>
              )}
              <button
                onClick={() => startEdit(team)}
                title="Rename team"
                className="px-2 py-1 rounded text-xs"
                style={{ color: "var(--chalk-dim)", fontFamily: "var(--font-mono)" }}
              >
                ✎
              </button>
              <button
                onClick={() => onDelete(team.id)}
                title={hasActiveMatches(team.id) ? "Team has active matches" : "Delete team"}
                className="px-2 py-1 rounded text-xs"
                style={{ color: hasActiveMatches(team.id) ? "var(--chalk-dim)" : "var(--red-card)", opacity: hasActiveMatches(team.id) ? 0.4 : 1 }}
              >
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
    <div
      className="flex items-center justify-center rounded-full shrink-0 font-bold"
      style={{ width: size, height: size, background: team.color, color: "#101010", fontFamily: "var(--font-mono)", fontSize: size * 0.34 }}
    >
      {team.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()}
    </div>
  );
}
