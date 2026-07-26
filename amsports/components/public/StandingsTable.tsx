"use client";

import type { StandingsRow } from "@/lib/types";
import { TeamBadge } from "@/components/public/TeamBadge";

export function StandingsTable({ standings }: { standings: StandingsRow[] }) {
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
          {standings.map((r, i) => (
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