"use client";

import { useState, useMemo, useEffect } from "react";
import { createSupabaseClient } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import type { Team, Player, Match, Tournament } from "@/lib/types";
import { TeamBadge } from "@/components/public/TeamBadge";

export default function CaptainPage() {
  const { user } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.team_id) {
      setLoading(false);
      return;
    }
    fetchAll();
  }, [user]);

  async function fetchAll() {
    const supabase = createSupabaseClient();
    const [teamsRes, playersRes, tournamentsRes, matchesRes] = await Promise.all([
      supabase.from("teams").select("*").eq("id", user?.team_id).single(),
      supabase.from("players").select("*").eq("team_id", user?.team_id).order("jersey_number"),
      supabase.from("tournaments").select("*").order("start_date"),
      supabase.from("matches").select("*").order("scheduled_date"),
    ]);
    setTeams(teamsRes.data ? [teamsRes.data] : []);
    setPlayers(playersRes.data ?? []);
    setTournaments(tournamentsRes.data ?? []);
    setMatches(matchesRes.data ?? []);
    setLoading(false);
  }

  async function addPlayer(name: string, jersey: number) {
    const supabase = createSupabaseClient();
    const { data } = await supabase.from("players").insert({ id: `p-${Date.now()}`, team_id: user?.team_id, name, jersey_number: jersey }).select().single();
    if (data) setPlayers((prev) => [...prev, data]);
  }

  async function removePlayer(playerId: string) {
    const supabase = createSupabaseClient();
    await supabase.from("players").delete().eq("id", playerId);
    setPlayers((prev) => prev.filter((p) => p.id !== playerId));
  }

  async function submitLineup(matchId: string, playerIds: string[]) {
    const supabase = createSupabaseClient();
    const existing = await supabase.from("lineups").select("*").eq("match_id", matchId).eq("team_id", user?.team_id);
    if (existing.data && existing.data.length > 0) {
      await supabase.from("lineups").delete().eq("match_id", matchId).eq("team_id", user?.team_id);
    }
    const inserts = playerIds.map((pid) => ({ id: `l-${Date.now()}-${pid}`, match_id: matchId, team_id: user?.team_id, player_id: pid }));
    await supabase.from("lineups").insert(inserts);
  }

  if (loading) {
    return <div className="py-12 text-center" style={{ color: "var(--chalk-dim)" }}>Loading...</div>;
  }

  if (!user?.team_id) {
    return (
      <div className="py-12 text-center">
        <p style={{ color: "var(--chalk-dim)", fontFamily: "var(--font-body)" }}>No team assigned to your account.</p>
      </div>
    );
  }

  const team = teams[0];
  const roster = players;
  const myMatches = matches.filter(
    (m) => m.home_team_id === team.id || m.away_team_id === team.id
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl" style={{ fontFamily: "var(--font-display)", color: "var(--chalk)" }}>
        {team.name} — Captain Dashboard
      </h1>

      <section>
        <h2 className="text-sm uppercase tracking-widest mb-3" style={{ color: "var(--chalk-dim)", fontFamily: "var(--font-mono)" }}>Roster</h2>
        <Roster roster={roster} teamId={team.id} onAdd={addPlayer} onRemove={removePlayer} />
      </section>

      <section>
        <h2 className="text-sm uppercase tracking-widest mb-3" style={{ color: "var(--chalk-dim)", fontFamily: "var(--font-mono)" }}>Fixtures</h2>
        <div className="space-y-3">
          {myMatches.map((m) => {
            const opponentId = m.home_team_id === team.id ? m.away_team_id : m.home_team_id;
            const opponent = teams.find((t) => t.id === opponentId);
            const isHome = m.home_team_id === team.id;
            const locked = m.status !== "scheduled" && m.status !== "postponed";
            return (
              <div key={m.id} className="rounded-lg p-3" style={{ background: "var(--pitch-800)", border: "1px solid var(--line)" }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs" style={{ color: "var(--chalk-dim)", fontFamily: "var(--font-mono)" }}>
                    {m.scheduled_date} {m.scheduled_time}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded" style={{ background: "var(--pitch-950)", color: "var(--chalk-dim)", fontFamily: "var(--font-mono)" }}>
                    {m.status}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span style={{ color: "var(--chalk)", fontFamily: "var(--font-body)" }}>
                    {isHome ? "vs" : "Home"} {opponent?.name ?? "TBD"}
                  </span>
                  {!locked && (
                    <LineupDialog matchId={m.id} roster={roster} onSubmit={submitLineup} />
                  )}
                </div>
              </div>
            );
          })}
          {myMatches.length === 0 && (
            <p className="text-sm" style={{ color: "var(--chalk-dim)" }}>No upcoming fixtures.</p>
          )}
        </div>
      </section>
    </div>
  );
}

function Roster({ roster, onAdd, onRemove }: { roster: Player[]; teamId: string; onAdd: (name: string, jersey: number) => void; onRemove: (id: string) => void }) {
  const [name, setName] = useState("");
  const [jersey, setJersey] = useState("");

  return (
    <div>
      <div className="flex gap-2 mb-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Player name"
          className="flex-1 px-3 py-2 rounded-md text-sm ams-input"
        />
        <input
          value={jersey}
          onChange={(e) => setJersey(e.target.value)}
          placeholder="#"
          type="number"
          className="w-20 px-3 py-2 rounded-md text-sm ams-input"
        />
        <button
          onClick={() => { onAdd(name, Number(jersey) || roster.length + 1); setName(""); setJersey(""); }}
          className="px-3 py-2 rounded-md text-sm font-semibold"
          style={{ background: "var(--amber)", color: "#101010", fontFamily: "var(--font-body)" }}
        >
          Add
        </button>
      </div>
      <div className="space-y-1.5">
        {roster.map((p) => (
          <div key={p.id} className="flex items-center justify-between px-3 py-1.5 rounded-md" style={{ background: "var(--pitch-950)", border: "1px solid var(--line)" }}>
            <span className="text-sm" style={{ color: "var(--chalk)", fontFamily: "var(--font-body)" }}>
              #{p.jersey_number} {p.name}
            </span>
            <button onClick={() => onRemove(p.id)} aria-label="Remove player">
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#C4432E" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function LineupDialog({ matchId, roster, onSubmit }: { matchId: string; roster: Player[]; onSubmit: (matchId: string, playerIds: string[]) => void }) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  function toggle(playerId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(playerId)) next.delete(playerId);
      else next.add(playerId);
      return next;
    });
  }

  function handleSubmit() {
    if (selected.size < 5) return;
    onSubmit(matchId, Array.from(selected));
    setOpen(false);
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="text-xs px-2 py-1 rounded" style={{ color: "var(--amber)", fontFamily: "var(--font-mono)" }}>
        Lineup
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.6)" }}>
          <div className="rounded-lg p-4 max-w-sm w-full mx-4" style={{ background: "var(--pitch-800)", border: "1px solid var(--line)" }}>
            <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--chalk)", fontFamily: "var(--font-body)" }}>Select Starting Lineup (min 5)</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {roster.map((p) => (
                <label key={p.id} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={selected.has(p.id)} onChange={() => toggle(p.id)} className="accent-amber-500" />
                  <span className="text-sm" style={{ color: "var(--chalk)", fontFamily: "var(--font-body)" }}>
                    #{p.jersey_number} {p.name}
                  </span>
                </label>
              ))}
            </div>
            <div className="flex gap-2 mt-3">
              <button onClick={() => setOpen(false)} className="flex-1 py-2 rounded-md text-sm" style={{ background: "var(--pitch-950)", color: "var(--chalk-dim)", fontFamily: "var(--font-body)" }}>
                Cancel
              </button>
              <button onClick={handleSubmit} disabled={selected.size < 5} className="flex-1 py-2 rounded-md text-sm font-semibold" style={{ background: selected.size < 5 ? "var(--pitch-700)" : "var(--amber)", color: "#101010", fontFamily: "var(--font-body)" }}>
                Submit ({selected.size})
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}