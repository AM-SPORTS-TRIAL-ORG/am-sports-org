import { createClient as createPublicClient } from "@/utils/supabase/server";
import Link from "next/link";

export const revalidate = 0;

export default async function HomePage() {
  const supabase = await createPublicClient();
  const { data: tournaments } = await supabase.from("tournaments").select("*").order("created_at", { ascending: false });
  const { data: teams } = await supabase.from("teams").select("*");
  const { data: matches } = await supabase.from("matches").select("*");

  const teamsById = (teams ?? []).reduce<Record<string, { name: string; color: string }>>((acc, t) => {
    acc[t.id] = { name: t.name, color: t.color };
    return acc;
  }, {});

  const liveMatchCount = (matches ?? []).filter((m) => m.status === "live").length;

  return (
    <div className="space-y-6">
      <section>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "34px", color: "var(--chalk)" }}>AM SPORTS</h1>
        <p className="text-sm mt-1" style={{ color: "var(--chalk-dim)", fontFamily: "var(--font-mono)" }}>
          Round-Robin League System
          {liveMatchCount > 0 && (
            <span className="ml-3 flex items-center gap-1" style={{ color: "var(--amber)" }}>
              <span className="pulse-dot" /> {liveMatchCount} live
            </span>
          )}
        </p>
      </section>

      <section>
        <h2 className="text-sm uppercase tracking-widest mb-3" style={{ color: "var(--chalk-dim)", fontFamily: "var(--font-mono)" }}>Tournaments</h2>
        {(tournaments ?? []).length === 0 && (
          <p className="text-sm" style={{ color: "var(--chalk-dim)" }}>No tournaments yet.</p>
        )}
        <div className="space-y-3">
          {(tournaments ?? []).map((t) => {
            const tMatches = (matches ?? []).filter((m) => m.tournament_id === t.id);
            const isLive = tMatches.some((m) => m.status === "live");
            return (
              <Link
                key={t.id}
                href={`/tournament/${t.id}`}
                className="flex items-center justify-between p-4 rounded-lg gap-3"
                style={{ background: "var(--pitch-800)", border: "1px solid var(--line)" }}
              >
                <div>
                  <div style={{ color: "var(--chalk)", fontFamily: "var(--font-body)", fontWeight: 600 }}>{t.name}</div>
                  <div className="text-xs mt-1 uppercase tracking-wide" style={{ color: "var(--chalk-dim)", fontFamily: "var(--font-mono)" }}>
                    {tMatches.length} matches · {t.status}
                  </div>
                </div>
                {isLive && (
                  <span className="text-[10px] px-2 py-1 rounded uppercase tracking-wide flex items-center gap-1 shrink-0" style={{ color: "var(--amber)", border: "1px solid var(--amber)", fontFamily: "var(--font-mono)" }}>
                    <span className="pulse-dot" /> Live
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}