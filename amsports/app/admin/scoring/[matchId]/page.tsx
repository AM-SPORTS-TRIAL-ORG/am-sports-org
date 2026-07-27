import { createClient as createServerClient } from "@/utils/supabase/server";
import { MatchScoreForm } from "@/components/admin/MatchScoreForm";
import { notFound } from "next/navigation";

export default async function MatchScoringPage({
  params,
}: {
  params: Promise<{ matchId: string }>;
}) {
  const { matchId } = await params;
  const supabase = await createServerClient();

  const [
    { data: match },
    { data: teams },
    { data: tournaments },
    { data: pitches },
  ] = await Promise.all([
    supabase.from("matches").select("*").eq("id", matchId).maybeSingle(),
    supabase.from("teams").select("*"),
    supabase.from("tournaments").select("*"),
    supabase.from("pitches").select("*"),
  ]);

  if (!match) notFound();

  const homeTeam = teams?.find((t) => t.id === match.home_team_id) ?? null;
  const awayTeam = teams?.find((t) => t.id === match.away_team_id) ?? null;
  const tournament = tournaments?.find((t) => t.id === match.tournament_id) ?? null;
  const pitch = pitches?.find((p) => p.id === match.pitch_id) ?? null;

  return (
    <div className="py-4">
      <MatchScoreForm
        match={match}
        homeTeam={homeTeam}
        awayTeam={awayTeam}
        tournament={tournament}
        pitch={pitch}
      />
    </div>
  );
}
