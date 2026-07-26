"use client";

import type { Match } from "@/lib/types";
import { TeamBadge } from "@/components/public/TeamBadge";

export function MatchScoreboard({ match, homeTeam, awayTeam, pitchesById }: { match: Match; homeTeam: { name: string; color: string } | undefined; awayTeam: { name: string; color: string } | undefined; pitchesById: Record<string, { name: string }> }) {
  const dash = match.status === "scheduled" || match.status === "postponed";
  return (
    <div className="rounded-lg overflow-hidden" style={{ background: "var(--pitch-800)", border: "1px solid var(--line)" }}>
      <div className="flex items-center justify-between px-3 py-2 gap-2">
        <TeamRow team={homeTeam} />
        <ScoreDigits match={match} dash={dash} />
        <TeamRow team={awayTeam} reverse />
      </div>
      <MatchMeta match={match} pitchesById={pitchesById} />
    </div>
  );
}

function TeamRow({ team, reverse }: { team: { name: string; color: string } | undefined; reverse?: boolean }) {
  return (
    <div className={`flex items-center gap-2 min-w-0 flex-1 ${reverse ? "flex-row-reverse text-right" : ""}`}>
      <TeamBadge team={team} size={24} />
      <span className="truncate text-sm" style={{ color: "var(--chalk)", fontFamily: "var(--font-body)" }}>
        {team ? team.name : "TBD"}
      </span>
    </div>
  );
}

function ScoreDigits({ match, dash }: { match: Match; dash: boolean }) {
  return (
    <div className="flex items-center gap-1 px-2 py-1 rounded shrink-0" style={{ background: "var(--pitch-950)", border: "1px solid var(--line)" }}>
      <span style={{ fontFamily: "var(--font-display)", fontSize: "20px", color: "var(--chalk)", minWidth: "16px", textAlign: "center" }}>{dash ? "-" : match.home_score}</span>
      <span style={{ color: "var(--chalk-dim)" }}>:</span>
      <span style={{ fontFamily: "var(--font-display)", fontSize: "20px", color: "var(--chalk)", minWidth: "16px", textAlign: "center" }}>{dash ? "-" : match.away_score}</span>
    </div>
  );
}

const STATUS_LABEL: Record<string, string> = { scheduled: "Scheduled", live: "Live", finished: "Full Time", postponed: "Postponed", forfeited: "Forfeited" };
const STATUS_COLOR: Record<string, string> = { scheduled: "var(--chalk-dim)", live: "var(--amber)", finished: "var(--win-green)", postponed: "var(--red-card)", forfeited: "var(--red-card)" };

function MatchMeta({ match, pitchesById }: { match: Match; pitchesById: Record<string, { name: string }> }) {
  return (
    <div className="flex items-center gap-3 px-3 pb-2 text-[10px] uppercase tracking-wide" style={{ color: "var(--chalk-dim)", fontFamily: "var(--font-mono)" }}>
      <span className="flex items-center gap-1">
        📅 {match.scheduled_date} · {match.scheduled_time}
      </span>
      <span className="flex items-center gap-1">
        📍 {pitchesById[match.pitch_id ?? ""]?.name ?? "TBD"}
      </span>
      {match.status === "live" && <span className="pulse-dot" />}
      <span style={{ color: STATUS_COLOR[match.status] }}>{STATUS_LABEL[match.status]}</span>
      {match.overflow && (
        <span className="flex items-center gap-1" style={{ color: "var(--red-card)" }}>
          ⚠ overflow day
        </span>
      )}
    </div>
  );
}