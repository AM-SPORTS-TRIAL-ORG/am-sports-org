"use client";

import { useEffect, useState } from "react";
import { createSupabaseClient } from "@/lib/supabase";
import { TeamBadge } from "@/components/public/TeamBadge";
import type { Match } from "@/lib/types";

const STATUS_LABEL: Record<string, string> = {
  scheduled: "Scheduled",
  live: "Live",
  finished: "Full Time",
  postponed: "Postponed",
  forfeited: "Forfeited",
};
const STATUS_COLOR: Record<string, string> = {
  scheduled: "var(--chalk-dim)",
  live: "var(--amber)",
  finished: "var(--win-green)",
  postponed: "var(--red-card)",
  forfeited: "var(--red-card)",
};

interface Props {
  initialMatches: Match[];
  teamsById: Record<string, { name: string; color: string }>;
  pitchesById: Record<string, { name: string }>;
  tournamentId: string;
}

export function LiveScoreboard({
  initialMatches,
  teamsById,
  pitchesById,
  tournamentId,
}: Props) {
  const [matches, setMatches] = useState<Match[]>(initialMatches);

  // Group into matchdays
  const matchdays = matches.reduce<Record<number, Match[]>>((acc, m) => {
    const day = m.matchday ?? 0;
    if (!acc[day]) acc[day] = [];
    acc[day]!.push(m);
    return acc;
  }, {});

  // Subscribe to Realtime score/status changes
  useEffect(() => {
    const supabase = createSupabaseClient();

    const channel = supabase
      .channel(`live-scores-${tournamentId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "matches",
          filter: `tournament_id=eq.${tournamentId}`,
        },
        (payload) => {
          const updated = payload.new as Match;
          setMatches((prev) =>
            prev.map((m) => (m.id === updated.id ? { ...m, ...updated } : m))
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tournamentId]);

  if (matches.length === 0) {
    return (
      <p className="text-sm" style={{ color: "var(--chalk-dim)", fontFamily: "var(--font-body)" }}>
        No matches scheduled yet.
      </p>
    );
  }

  return (
    <div className="space-y-5">
      {Object.entries(matchdays)
        .sort(([a], [b]) => Number(a) - Number(b))
        .map(([day, dayMatches]) => (
          <div key={day}>
            <div
              className="text-[10px] uppercase tracking-widest mb-2"
              style={{ color: "var(--chalk-dim)", fontFamily: "var(--font-mono)" }}
            >
              Matchday {Number(day) + 1}
            </div>
            <div className="space-y-2">
              {dayMatches
                .sort((a, b) => a.scheduled_time.localeCompare(b.scheduled_time))
                .map((m) => {
                  const home = teamsById[m.home_team_id];
                  const away = teamsById[m.away_team_id];
                  const isLive = m.status === "live";
                  const dash = m.status === "scheduled" || m.status === "postponed";

                  return (
                    <div
                      key={m.id}
                      className="rounded-lg overflow-hidden"
                      style={{
                        background: "var(--pitch-800)",
                        border: `1px solid ${isLive ? "var(--amber)" : "var(--line)"}`,
                        transition: "border-color 0.3s",
                      }}
                    >
                      {/* Live banner */}
                      {isLive && (
                        <div
                          className="flex items-center gap-2 px-3 py-1 text-[10px] uppercase tracking-widest font-semibold"
                          style={{
                            background: "rgba(232,185,58,0.12)",
                            color: "var(--amber)",
                            fontFamily: "var(--font-mono)",
                          }}
                        >
                          <span className="pulse-dot" />
                          Live now
                        </div>
                      )}

                      {/* Teams & score */}
                      <div className="flex items-center justify-between px-3 py-2 gap-2">
                        {/* Home */}
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          {home && <TeamBadge team={home} size={24} />}
                          <span
                            className="truncate text-sm"
                            style={{
                              color: "var(--chalk)",
                              fontFamily: "var(--font-body)",
                              fontWeight: isLive ? 600 : 400,
                            }}
                          >
                            {home?.name ?? "TBD"}
                          </span>
                        </div>

                        {/* Score */}
                        <div
                          className="flex items-center gap-1 px-3 py-1 rounded shrink-0"
                          style={{
                            background: isLive ? "rgba(232,185,58,0.1)" : "var(--pitch-950)",
                            border: `1px solid ${isLive ? "var(--amber)" : "var(--line)"}`,
                            transition: "all 0.3s",
                          }}
                        >
                          <span
                            style={{
                              fontFamily: "var(--font-display)",
                              fontSize: "22px",
                              color: isLive ? "var(--amber)" : "var(--chalk)",
                              minWidth: "18px",
                              textAlign: "center",
                              transition: "color 0.3s",
                            }}
                          >
                            {dash ? "-" : m.home_score}
                          </span>
                          <span style={{ color: "var(--chalk-dim)", fontSize: "14px" }}>:</span>
                          <span
                            style={{
                              fontFamily: "var(--font-display)",
                              fontSize: "22px",
                              color: isLive ? "var(--amber)" : "var(--chalk)",
                              minWidth: "18px",
                              textAlign: "center",
                              transition: "color 0.3s",
                            }}
                          >
                            {dash ? "-" : m.away_score}
                          </span>
                        </div>

                        {/* Away */}
                        <div className="flex items-center gap-2 min-w-0 flex-1 flex-row-reverse text-right">
                          {away && <TeamBadge team={away} size={24} />}
                          <span
                            className="truncate text-sm"
                            style={{
                              color: "var(--chalk)",
                              fontFamily: "var(--font-body)",
                              fontWeight: isLive ? 600 : 400,
                            }}
                          >
                            {away?.name ?? "TBD"}
                          </span>
                        </div>
                      </div>

                      {/* Meta */}
                      <div
                        className="flex items-center gap-3 px-3 pb-2 text-[10px] uppercase tracking-wide"
                        style={{ color: "var(--chalk-dim)", fontFamily: "var(--font-mono)" }}
                      >
                        <span>📅 {m.scheduled_date} · {m.scheduled_time}</span>
                        {m.pitch_id && pitchesById[m.pitch_id] && (
                          <span>📍 {pitchesById[m.pitch_id]!.name}</span>
                        )}
                        <span style={{ color: STATUS_COLOR[m.status] }}>
                          {STATUS_LABEL[m.status]}
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        ))}
    </div>
  );
}
