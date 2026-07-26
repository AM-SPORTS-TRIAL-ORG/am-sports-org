import { createSupabaseServerClient } from "@/lib/supabase";
import { computeStandings } from "@/lib/schedule";
import { MatchScoreboard } from "@/components/public/MatchScoreboard";
import { StandingsTable } from "@/components/public/StandingsTable";
import { TeamBadge } from "@/components/public/TeamBadge";

export const revalidate = 30;

export default async function TournamentPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createSupabaseServerClient();

  const { data: tournament } = await supabase
    .from("tournaments")
    .select("*")
    .eq("id", params.id)
    .single();

  const { data: teams } = await supabase.from("teams").select("*");
  const { data: matches } = await supabase
    .from("matches")
    .select("*")
    .eq("tournament_id", params.id)
    .order("matchday", { ascending: true })
    .order("scheduled_date", { ascending: true })
    .order("scheduled_time", { ascending: true });

  const { data: pitches } = await supabase.from("pitches").select("*");

  if (!tournament) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl" style={{ color: "var(--chalk)", fontFamily: "var(--font-body)" }}>
          Tournament not found
        </h2>
        <a href="/" className="text-sm mt-4 inline-block" style={{ color: "var(--amber)" }}>
          ← Back to tournaments
        </a>
      </div>
    );
  }

  const teamsById = (teams ?? []).reduce<Record<string, { name: string; color: string }>>((acc, t) => {
    acc[t.id] = { name: t.name, color: t.color };
    return acc;
  }, {});

  const pitchesById = (pitches ?? []).reduce<Record<string, { name: string }>>((acc, p) => {
    acc[p.id] = { name: p.name };
    return acc;
  }, {});

  const standings = computeStandings(
    (matches ?? []) as { homeId: string; awayId: string; homeScore: number; awayScore: number; status: string }[],
    tournament.team_ids,
    teamsById,
    tournament.points_win,
    tournament.points_draw
  );

  const liveMatches = (matches ?? []).filter((m) => m.status === "live");

  return (
    <div className="space-y-6">
      <a href="/" className="flex items-center gap-1 text-sm" style={{ color: "var(--chalk-dim)", fontFamily: "var(--font-body)" }}>
        ← All tournaments
      </a>

      <div>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "28px", color: "var(--chalk)" }}>{tournament.name}</h1>
        <p className="text-xs mt-1 uppercase tracking-widest" style={{ color: "var(--chalk-dim)", fontFamily: "var(--font-mono)" }}>
          {tournament.status} · Matchday format · {tournament.points_win} pts/win {tournament.points_draw} pts/draw
        </p>
      </div>

      {liveMatches.length > 0 && (
        <div className="flex items-center gap-2 text-sm" style={{ color: "var(--amber)", fontFamily: "var(--font-mono)" }}>
          <span className="pulse-dot" /> {liveMatches.length} live match{liveMatches.length > 1 ? "es" : ""}
        </div>
      )}

      <section>
        <h2 className="text-sm uppercase tracking-widest mb-3" style={{ color: "var(--chalk-dim)", fontFamily: "var(--font-mono)" }}>Standings</h2>
        <StandingsTable standings={standings} />
      </section>

      <section>
        <h2 className="text-sm uppercase tracking-widest mb-3" style={{ color: "var(--chalk-dim)", fontFamily: "var(--font-mono)" }}>Fixtures</h2>
        <div className="space-y-2">
          {(matches ?? []).map((m) => (
            <MatchScoreboard
              key={m.id}
              match={m}
              homeTeam={teamsById[m.home_team_id]}
              awayTeam={teamsById[m.away_team_id]}
              pitchesById={pitchesById}
            />
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-sm uppercase tracking-widest mb-3" style={{ color: "var(--chalk-dim)", fontFamily: "var(--font-mono)" }}>Teams</h2>
        <div className="grid grid-cols-2 gap-3">
          {tournament.team_ids.map((id: string) => {
            const team = teamsById[id];
            if (!team) return null;
            return (
              <div key={id} className="flex items-center gap-2 p-3 rounded-lg" style={{ background: "var(--pitch-800)", border: "1px solid var(--line)" }}>
                <TeamBadge team={team} size={30} />
                <span style={{ color: "var(--chalk)", fontFamily: "var(--font-body)", fontSize: "14px" }}>{team.name}</span>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}