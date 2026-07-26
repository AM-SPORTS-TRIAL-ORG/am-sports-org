import { createSupabaseClient } from "@/lib/supabase";
import { computeStandings } from "@/lib/schedule";
import { MatchScoreboard } from "@/components/public/MatchScoreboard";
import { StandingsTable } from "@/components/public/StandingsTable";
import { TeamBadge } from "@/components/public/TeamBadge";
import { LiveMatchUpdater } from "@/components/public/LiveMatchUpdater";

export const revalidate = 30;

export default async function TournamentPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createSupabaseClient();

  const [
    { data: tournament, error: tErr },
    { data: teams },
    { data: matches },
    { data: pitches },
  ] = await Promise.all([
    supabase.from("tournaments").select("*").eq("id", params.id).maybeSingle(),
    supabase.from("teams").select("*"),
    supabase
      .from("matches")
      .select("*")
      .eq("tournament_id", params.id)
      .order("scheduled_date", { ascending: true })
      .order("scheduled_time", { ascending: true }),
    supabase.from("pitches").select("*"),
  ]);

  if (!tournament) {
    return (
      <div className="text-center py-12 space-y-2">
        <h2 className="text-xl" style={{ color: "var(--chalk)", fontFamily: "var(--font-body)" }}>
          Tournament not found
        </h2>
        {tErr && (
          <p className="text-xs" style={{ color: "var(--red-card)", fontFamily: "var(--font-mono)" }}>
            {tErr.message}
          </p>
        )}
        <a href="/" className="text-sm mt-4 inline-block" style={{ color: "var(--amber)" }}>
          ← Back to tournaments
        </a>
      </div>
    );
  }

  const teamsById = (teams ?? []).reduce<Record<string, { name: string; color: string }>>(
    (acc, t) => { acc[t.id] = { name: t.name, color: t.color }; return acc; },
    {}
  );

  const pitchesById = (pitches ?? []).reduce<Record<string, { name: string }>>(
    (acc, p) => { acc[p.id] = { name: p.name }; return acc; },
    {}
  );

  // Derive team IDs from matches — tournaments table has no team_ids column
  const teamIdSet = new Set<string>();
  (matches ?? []).forEach((m) => {
    teamIdSet.add(m.home_team_id);
    teamIdSet.add(m.away_team_id);
  });
  const teamIds = Array.from(teamIdSet);

  const matchesForStandings = (matches ?? []).map((m) => ({
    homeId: m.home_team_id,
    awayId: m.away_team_id,
    homeScore: m.home_score,
    awayScore: m.away_score,
    status: m.status,
  }));

  const standings = computeStandings(
    matchesForStandings,
    teamIds,
    teamsById,
    tournament.points_win,
    tournament.points_draw
  );

  const liveMatches = (matches ?? []).filter((m) => m.status === "live");

  // Group matches by matchday for better display
  const matchdays = (matches ?? []).reduce<Record<number, typeof matches>>((acc, m) => {
    const day = m.matchday ?? 0;
    if (!acc[day]) acc[day] = [];
    acc[day]!.push(m);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <LiveMatchUpdater tournamentId={params.id} />

      <a href="/" style={{ color: "var(--chalk-dim)", fontFamily: "var(--font-body)", fontSize: "13px" }}>
        ← All tournaments
      </a>

      <div>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "28px", color: "var(--chalk)" }}>
          {tournament.name}
        </h1>
        <p className="text-xs mt-1 uppercase tracking-widest" style={{ color: "var(--chalk-dim)", fontFamily: "var(--font-mono)" }}>
          {tournament.status} · {tournament.points_win} pts/win · {tournament.points_draw} pt/draw
          · {(matches ?? []).length} matches
        </p>
      </div>

      {liveMatches.length > 0 && (
        <div className="flex items-center gap-2 text-sm" style={{ color: "var(--amber)", fontFamily: "var(--font-mono)" }}>
          <span className="pulse-dot" /> {liveMatches.length} live match{liveMatches.length > 1 ? "es" : ""}
        </div>
      )}

      {/* Standings */}
      <section>
        <h2 className="text-sm uppercase tracking-widest mb-3" style={{ color: "var(--chalk-dim)", fontFamily: "var(--font-mono)" }}>
          Standings
        </h2>
        {standings.length > 0 ? (
          <StandingsTable standings={standings} />
        ) : (
          <p className="text-sm" style={{ color: "var(--chalk-dim)", fontFamily: "var(--font-body)" }}>
            No results yet — standings will appear once matches are played.
          </p>
        )}
      </section>

      {/* Fixtures grouped by matchday */}
      <section>
        <h2 className="text-sm uppercase tracking-widest mb-3" style={{ color: "var(--chalk-dim)", fontFamily: "var(--font-mono)" }}>
          Fixtures
        </h2>
        {(matches ?? []).length === 0 ? (
          <p className="text-sm" style={{ color: "var(--chalk-dim)", fontFamily: "var(--font-body)" }}>
            No matches scheduled yet.
          </p>
        ) : (
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
                    {(dayMatches ?? []).map((m) => (
                      <MatchScoreboard
                        key={m.id}
                        match={m}
                        homeTeam={teamsById[m.home_team_id]}
                        awayTeam={teamsById[m.away_team_id]}
                        pitchesById={pitchesById}
                      />
                    ))}
                  </div>
                </div>
              ))}
          </div>
        )}
      </section>

      {/* Teams */}
      <section>
        <h2 className="text-sm uppercase tracking-widest mb-3" style={{ color: "var(--chalk-dim)", fontFamily: "var(--font-mono)" }}>
          Teams
        </h2>
        {teamIds.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--chalk-dim)", fontFamily: "var(--font-body)" }}>
            No teams in this tournament yet.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {teamIds.map((id) => {
              const team = teamsById[id];
              if (!team) return null;
              return (
                <div
                  key={id}
                  className="flex items-center gap-2 p-3 rounded-lg"
                  style={{ background: "var(--pitch-800)", border: "1px solid var(--line)" }}
                >
                  <TeamBadge team={team} size={30} />
                  <span style={{ color: "var(--chalk)", fontFamily: "var(--font-body)", fontSize: "14px" }}>
                    {team.name}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
