import type { Team } from "@/lib/types";

export function TeamBadge({ team, size = 26 }: { team: Pick<Team, "name" | "color">; size?: number }) {
  if (!team) {
    return (
      <div className="flex items-center justify-center rounded-full shrink-0" style={{ width: size, height: size, background: "var(--pitch-700)", border: "1px dashed var(--line)", color: "var(--chalk-dim)", fontFamily: "var(--font-mono)", fontSize: size * 0.32 }}>
        ?
      </div>
    );
  }
  return (
    <div className="flex items-center justify-center rounded-full shrink-0 font-bold" style={{ width: size, height: size, background: team.color, color: "#101010", fontFamily: "var(--font-mono)", fontSize: size * 0.34 }}>
      {team.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()}
    </div>
  );
}