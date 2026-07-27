"use client";

import { useState, useTransition } from "react";
import { saveMatchScore } from "@/app/admin/scoring/[matchId]/actions";
import type { Match, Team, Tournament, Pitch } from "@/lib/types";

const INPUT = "w-full px-3 py-2 rounded-md text-sm bg-[var(--pitch-950)] border border-[var(--line)] text-[var(--chalk)]";

export function MatchScoreForm({
  match,
  homeTeam,
  awayTeam,
  tournament,
  pitch,
}: {
  match: Match;
  homeTeam: Team | null;
  awayTeam: Team | null;
  tournament: Tournament | null;
  pitch: Pitch | null;
}) {
  const [homeScore, setHomeScore] = useState(match.home_score);
  const [awayScore, setAwayScore] = useState(match.away_score);
  const [status, setStatus] = useState<Match["status"]>(match.status);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    setError("");
    startTransition(async () => {
      try {
        await saveMatchScore(
          match.id,
          homeScore,
          awayScore,
          status,
          `${match.home_score}-${match.away_score} (${match.status})`
        );
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Failed to save. Check you are logged in as admin.");
      }
    });
  }

  const teamColor = (team: Team | null) => team?.color ?? "#4FA36A";
  const teamInitials = (team: Team | null) =>
    team ? team.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase() : "?";

  return (
    <div className="max-w-md mx-auto space-y-6">

      <a href="/admin" className="text-xs" style={{ color: "var(--chalk-dim)", fontFamily: "var(--font-mono)" }}>
        ← Back to admin
      </a>

      {/* Match header */}
      <div className="p-4 rounded-lg" style={{ background: "var(--pitch-800)", border: "1px solid var(--line)" }}>
        <p className="text-xs uppercase tracking-widest mb-3" style={{ color: "var(--chalk-dim)", fontFamily: "var(--font-mono)" }}>
          {tournament?.name ?? "Tournament"} · {match.scheduled_date} {match.scheduled_time}
          {pitch && ` · ${pitch.name}`}
        </p>

        <div className="flex items-center justify-between gap-4">
          {/* Home team */}
          <div className="flex flex-col items-center gap-2 flex-1">
            <div
              className="flex items-center justify-center rounded-full font-bold"
              style={{ width: 48, height: 48, background: teamColor(homeTeam), color: "#101010", fontFamily: "var(--font-mono)", fontSize: "14px" }}
            >
              {teamInitials(homeTeam)}
            </div>
            <span className="text-sm text-center" style={{ color: "var(--chalk)", fontFamily: "var(--font-body)" }}>
              {homeTeam?.name ?? "Home"}
            </span>
          </div>

          {/* Live score display */}
          <div className="px-4 py-2 rounded-lg text-center" style={{ background: "var(--pitch-950)", border: "1px solid var(--line)" }}>
            <span style={{ fontFamily: "var(--font-display)", fontSize: "32px", color: "var(--chalk)" }}>
              {homeScore} : {awayScore}
            </span>
            <p className="text-[10px] uppercase tracking-wide mt-1" style={{ color: "var(--amber)", fontFamily: "var(--font-mono)" }}>
              {status}
            </p>
          </div>

          {/* Away team */}
          <div className="flex flex-col items-center gap-2 flex-1">
            <div
              className="flex items-center justify-center rounded-full font-bold"
              style={{ width: 48, height: 48, background: teamColor(awayTeam), color: "#101010", fontFamily: "var(--font-mono)", fontSize: "14px" }}
            >
              {teamInitials(awayTeam)}
            </div>
            <span className="text-sm text-center" style={{ color: "var(--chalk)", fontFamily: "var(--font-body)" }}>
              {awayTeam?.name ?? "Away"}
            </span>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="p-4 rounded-lg space-y-5" style={{ background: "var(--pitch-800)", border: "1px solid var(--line)" }}>
        <p className="text-xs uppercase tracking-widest" style={{ color: "var(--chalk-dim)", fontFamily: "var(--font-mono)" }}>
          Update Score
        </p>

        <div className="grid grid-cols-2 gap-6">
          {/* Home score */}
          <div className="flex flex-col items-center gap-2">
            <span className="text-xs" style={{ color: "var(--chalk-dim)", fontFamily: "var(--font-mono)" }}>
              {homeTeam?.name ?? "Home"}
            </span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setHomeScore((v) => Math.max(0, v - 1))}
                className="w-10 h-10 rounded-full text-xl font-bold"
                style={{ background: "var(--pitch-950)", color: "var(--chalk)", border: "1px solid var(--line)" }}
              >−</button>
              <span style={{ fontFamily: "var(--font-display)", fontSize: "40px", color: "var(--chalk)", minWidth: "36px", textAlign: "center" }}>
                {homeScore}
              </span>
              <button
                onClick={() => setHomeScore((v) => v + 1)}
                className="w-10 h-10 rounded-full text-xl font-bold"
                style={{ background: "var(--amber)", color: "#101010" }}
              >+</button>
            </div>
          </div>

          {/* Away score */}
          <div className="flex flex-col items-center gap-2">
            <span className="text-xs" style={{ color: "var(--chalk-dim)", fontFamily: "var(--font-mono)" }}>
              {awayTeam?.name ?? "Away"}
            </span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setAwayScore((v) => Math.max(0, v - 1))}
                className="w-10 h-10 rounded-full text-xl font-bold"
                style={{ background: "var(--pitch-950)", color: "var(--chalk)", border: "1px solid var(--line)" }}
              >−</button>
              <span style={{ fontFamily: "var(--font-display)", fontSize: "40px", color: "var(--chalk)", minWidth: "36px", textAlign: "center" }}>
                {awayScore}
              </span>
              <button
                onClick={() => setAwayScore((v) => v + 1)}
                className="w-10 h-10 rounded-full text-xl font-bold"
                style={{ background: "var(--amber)", color: "#101010" }}
              >+</button>
            </div>
          </div>
        </div>

        {/* Status */}
        <div>
          <label className="text-xs block mb-1" style={{ color: "var(--chalk-dim)", fontFamily: "var(--font-mono)" }}>
            Match status
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as Match["status"])}
            className={INPUT}
          >
            <option value="scheduled">Scheduled</option>
            <option value="live">Live</option>
            <option value="finished">Finished</option>
            <option value="postponed">Postponed</option>
            <option value="forfeited">Forfeited</option>
          </select>
        </div>

        {error && (
          <p className="text-xs p-2 rounded" style={{ color: "var(--red-card)", background: "rgba(196,67,46,0.1)", fontFamily: "var(--font-body)" }}>
            {error}
          </p>
        )}

        <button
          onClick={handleSave}
          disabled={isPending}
          className="w-full py-3 rounded-md text-sm font-semibold"
          style={{
            background: isPending ? "var(--pitch-700)" : "var(--amber)",
            color: "#101010",
            cursor: isPending ? "not-allowed" : "pointer",
            fontFamily: "var(--font-body)",
          }}
        >
          {isPending ? "Saving…" : "Save & update standings"}
        </button>
      </div>
    </div>
  );
}
