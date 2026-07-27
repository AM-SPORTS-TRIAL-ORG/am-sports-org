"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { MatchStatus } from "@/lib/types";

export async function saveMatchScore(
  matchId: string,
  homeScore: number,
  awayScore: number,
  status: MatchStatus,
  oldScore: string
) {
  const supabase = await createClient();

  // Check session
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    throw new Error("Not authenticated");
  }

  const { error } = await supabase
    .from("matches")
    .update({ home_score: homeScore, away_score: awayScore, status })
    .eq("id", matchId);

  if (error) {
    throw new Error(error.message);
  }

  // Audit log
  await supabase.from("audit_log").insert({
    id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    actor_user_id: session.user.id,
    match_id: matchId,
    action: "score_updated",
    old_value: oldScore,
    new_value: `${homeScore}-${awayScore} (${status})`,
  });

  // Bust the public tournament page cache
  revalidatePath("/tournament/[id]", "page");
  revalidatePath("/");

  redirect("/admin");
}
