"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabase";

/**
 * Invisible client component that subscribes to Supabase Realtime for
 * the given tournament's matches and triggers a Next.js router refresh
 * whenever a score or status changes, causing the Server Component above
 * to re-fetch and re-render with the latest data.
 */
export function LiveMatchUpdater({ tournamentId }: { tournamentId: string }) {
  const router = useRouter();

  useEffect(() => {
    const supabase = createSupabaseClient();

    const channel = supabase
      .channel(`tournament-matches-${tournamentId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "matches",
          filter: `tournament_id=eq.${tournamentId}`,
        },
        () => {
          // Re-run the Server Component to pick up the updated scores
          router.refresh();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tournamentId, router]);

  return null;
}
