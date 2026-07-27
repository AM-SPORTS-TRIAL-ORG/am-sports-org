"use client";

import { useState, useEffect } from "react";
import { createSupabaseClient } from "@/lib/supabase";
import { generateDaySlots } from "@/lib/schedule";
import type { Team, Pitch, Tournament, Match, AuditLog, User } from "@/lib/types";
import { AdminTeams } from "@/components/admin/AdminTeams";
import { AdminPitches } from "@/components/admin/AdminPitches";
import { AdminTournaments } from "@/components/admin/AdminTournaments";
import { AdminScoring } from "@/components/admin/AdminScoring";
import { AdminAudit } from "@/components/admin/AdminAudit";
import { AdminUsers } from "@/components/admin/AdminUsers";

export default function AdminPage() {
  const [tab, setTab] = useState("teams");
  const [teams, setTeams] = useState<Team[]>([]);
  const [pitches, setPitches] = useState<Pitch[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [auditLog, setAuditLog] = useState<AuditLog[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    // Grab current session user id for audit log entries
    const supabase = createSupabaseClient();
    supabase.auth.getSession().then(({ data }) => {
      setCurrentUserId(data.session?.user?.id ?? null);
    });
    fetchAll();
    const interval = setInterval(fetchAll, 10000);
    return () => clearInterval(interval);
  }, []);

  async function fetchAll() {
    const supabase = createSupabaseClient();
    const [teamsRes, pitchesRes, tournamentsRes, matchesRes, auditRes, usersRes] = await Promise.all([
      supabase.from("teams").select("*").order("name"),
      supabase.from("pitches").select("*").order("name"),
      supabase.from("tournaments").select("*").order("created_at", { ascending: false }),
      supabase.from("matches").select("*").order("scheduled_date"),
      supabase.from("audit_log").select("*").order("timestamp", { ascending: false }).limit(100),
      supabase.from("users").select("*").order("email"),
    ]);
    setTeams(teamsRes.data ?? []);
    setPitches(pitchesRes.data ?? []);
    setTournaments(tournamentsRes.data ?? []);
    setMatches(matchesRes.data ?? []);
    setAuditLog(auditRes.data ?? []);
    setUsers(usersRes.data ?? []);
    setLoading(false);
  }

  async function writeAudit(action: string, matchId: string | null, oldValue: string | null, newValue: string | null) {
    const supabase = createSupabaseClient();
    await supabase.from("audit_log").insert({
      id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      actor_user_id: currentUserId,
      match_id: matchId,
      action,
      old_value: oldValue,
      new_value: newValue,
    });
    // Refresh audit log immediately
    const { data } = await supabase.from("audit_log").select("*").order("timestamp", { ascending: false }).limit(100);
    setAuditLog(data ?? []);
  }

  async function addTeam(name: string) {
    const supabase = createSupabaseClient();
    const color = ["#E8B93A", "#4F8FC0", "#C4432E", "#4FA36A", "#8B5FA3", "#D9782B"][teams.length % 6];
    await supabase.from("teams").insert({ id: `t-${Date.now()}`, name, color, captain_user_id: null });
    await fetchAll();
  }

  async function editTeam(teamId: string, name: string) {
    const supabase = createSupabaseClient();
    await supabase.from("teams").update({ name }).eq("id", teamId);
    await fetchAll();
  }

  async function deleteTeam(teamId: string) {
    // Guard: block if team has matches in an active tournament
    const activeMatch = matches.find(
      (m) =>
        (m.home_team_id === teamId || m.away_team_id === teamId) &&
        m.status !== "finished" &&
        m.status !== "forfeited"
    );
    if (activeMatch) {
      alert("Cannot delete a team that has unfinished matches scheduled.");
      return;
    }
    const supabase = createSupabaseClient();
    await supabase.from("teams").delete().eq("id", teamId);
    await fetchAll();
  }

  async function addPitch(name: string) {
    const supabase = createSupabaseClient();
    await supabase.from("pitches").insert({ id: `pitch-${Date.now()}`, name });
    await fetchAll();
  }

  async function deletePitch(pitchId: string) {
    const supabase = createSupabaseClient();
    await supabase.from("pitches").delete().eq("id", pitchId);
    await fetchAll();
  }

  async function createTournament(cfg: {
    name: string;
    teamIds: string[];
    pitchIds: string[];
    startDate: string;
    dailyStart: string;
    dailyEnd: string;
    matchDuration: number;
    gap: number;
    pointsWin: number;
    pointsDraw: number;
  }) {
    const supabase = createSupabaseClient();
    let ids = [...cfg.teamIds];
    if (ids.length % 2 !== 0) ids.push(null as unknown as string);
    const n = ids.length;
    const rounds = n - 1;
    const half = n / 2;
    let arr = [...ids];
    const matchdays: string[][] = [];
    for (let r = 0; r < rounds; r++) {
      const round: string[] = [];
      for (let i = 0; i < half; i++) {
        const a = arr[i];
        const b = arr[n - 1 - i];
        if (a !== null && b !== null) round.push(`${a}:${b}`);
      }
      matchdays.push(round);
      arr = [arr[0], arr[n - 1], ...arr.slice(1, n - 1)];
    }

    const slotsTemplate = generateDaySlots(cfg.pitchIds, cfg.dailyStart, cfg.dailyEnd, cfg.matchDuration, cfg.gap);

    // If no pitches selected or the window is too tight, fall back to one match
    // per day with no pitch assigned so scheduling never crashes.
    const hasSlots = slotsTemplate.length > 0;

    const scheduled: Array<{
      home_team_id: string;
      away_team_id: string;
      pitch_id: string | null;
      scheduled_date: string;
      scheduled_time: string;
      matchday: number;
      status: string;
      overflow?: boolean;
    }> = [];
    let overflowDayOffset = matchdays.length;

    matchdays.forEach((matchday, d) => {
      const date = new Date(cfg.startDate + "T00:00:00");
      date.setDate(date.getDate() + d);
      matchday.forEach((pair, i) => {
        const [homeId, awayId] = pair.split(":");

        if (!hasSlots) {
          // No slots — one match per day, no pitch
          const fallbackDate = new Date(cfg.startDate + "T00:00:00");
          fallbackDate.setDate(fallbackDate.getDate() + d + i);
          scheduled.push({
            home_team_id: homeId,
            away_team_id: awayId,
            pitch_id: null,
            scheduled_date: fallbackDate.toISOString().slice(0, 10),
            scheduled_time: cfg.dailyStart,
            matchday: d,
            status: "scheduled",
          });
        } else if (i < slotsTemplate.length) {
          const slot = slotsTemplate[i];
          scheduled.push({
            home_team_id: homeId,
            away_team_id: awayId,
            pitch_id: slot.pitchId,
            scheduled_date: date.toISOString().slice(0, 10),
            scheduled_time: slot.time,
            matchday: d,
            status: "scheduled",
          });
        } else {
          const overflowIdx = i - slotsTemplate.length;
          const overflowDate = new Date(cfg.startDate + "T00:00:00");
          overflowDate.setDate(
            overflowDate.getDate() + overflowDayOffset + Math.floor(overflowIdx / slotsTemplate.length)
          );
          const slot = slotsTemplate[overflowIdx % slotsTemplate.length];
          scheduled.push({
            home_team_id: homeId,
            away_team_id: awayId,
            pitch_id: slot.pitchId,
            scheduled_date: overflowDate.toISOString().slice(0, 10),
            scheduled_time: slot.time,
            matchday: d,
            status: "scheduled",
            overflow: true,
          });
        }
      });
      if (hasSlots && matchday.length > slotsTemplate.length) {
        overflowDayOffset += Math.ceil((matchday.length - slotsTemplate.length) / slotsTemplate.length);
      }
    });

    const tourId = `tour-${Date.now()}`;
    const endDate = new Date(cfg.startDate + "T00:00:00");
    endDate.setDate(endDate.getDate() + matchdays.length);

    await supabase.from("tournaments").insert({
      id: tourId,
      name: cfg.name,
      start_date: cfg.startDate,
      end_date: endDate.toISOString().slice(0, 10),
      status: "upcoming",
      match_duration_minutes: cfg.matchDuration,
      gap_minutes: cfg.gap,
      daily_start_time: cfg.dailyStart,
      daily_end_time: cfg.dailyEnd,
      points_win: cfg.pointsWin,
      points_draw: cfg.pointsDraw,
    });

    if (cfg.pitchIds.length > 0) {
      await supabase
        .from("tournament_pitches")
        .insert(cfg.pitchIds.map((pid) => ({ tournament_id: tourId, pitch_id: pid })));
    }

    const matchRows = scheduled.map((m) => ({
      id: `m-${Date.now()}-${m.matchday}-${Math.random().toString(36).slice(2, 6)}`,
      tournament_id: tourId,
      home_team_id: m.home_team_id,
      away_team_id: m.away_team_id,
      pitch_id: m.pitch_id,
      scheduled_date: m.scheduled_date,
      scheduled_time: m.scheduled_time,
      matchday: m.matchday,
      home_score: 0,
      away_score: 0,
      status: m.status,
    }));

    await supabase.from("matches").insert(matchRows);

    // Refresh from DB — avoids duplicate keys from optimistic + fetched state
    await fetchAll();
  }

  async function deleteTournament(tourId: string) {
    const supabase = createSupabaseClient();
    await supabase.from("tournament_pitches").delete().eq("tournament_id", tourId);
    await supabase.from("matches").delete().eq("tournament_id", tourId);
    await supabase.from("tournaments").delete().eq("id", tourId);
    await fetchAll();
  }

  async function updateTournamentStatus(tourId: string, status: "upcoming" | "active" | "completed") {
    const supabase = createSupabaseClient();
    await supabase.from("tournaments").update({ status }).eq("id", tourId);
    await fetchAll();
  }

  async function addMatch(match: Omit<Match, "id" | "home_score" | "away_score" | "status">) {
    const supabase = createSupabaseClient();
    await supabase.from("matches").insert({
      id: `m-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      ...match,
      home_score: 0,
      away_score: 0,
      status: "scheduled",
    });
    await fetchAll();
  }

  async function deleteMatch(matchId: string) {
    const supabase = createSupabaseClient();
    await supabase.from("matches").delete().eq("id", matchId);
    await fetchAll();
  }

  async function updateMatch(matchId: string, updates: Partial<Match>) {
    const supabase = createSupabaseClient();
    const prev = matches.find((m) => m.id === matchId);
    await supabase.from("matches").update(updates).eq("id", matchId);
    // Optimistic update is fine here — no duplication risk on update
    setMatches((prevMatches) => prevMatches.map((m) => (m.id === matchId ? { ...m, ...updates } : m)));

    // Write audit log entry
    if (prev) {
      if (updates.status && updates.status !== prev.status) {
        await writeAudit("status_changed", matchId, prev.status, updates.status);
      }
      const homeChanged = updates.home_score !== undefined && updates.home_score !== prev.home_score;
      const awayChanged = updates.away_score !== undefined && updates.away_score !== prev.away_score;
      if (homeChanged || awayChanged) {
        const oldScore = `${prev.home_score}-${prev.away_score}`;
        const newHome = homeChanged ? updates.home_score! : prev.home_score;
        const newAway = awayChanged ? updates.away_score! : prev.away_score;
        await writeAudit("score_changed", matchId, oldScore, `${newHome}-${newAway}`);
      }
    }
  }

  if (loading) {
    return (
      <div className="py-12 text-center" style={{ color: "var(--chalk-dim)" }}>
        Loading...
      </div>
    );
  }

  return (
    <div>
      <div
        className="flex gap-1 p-1 rounded-lg mb-4 overflow-x-auto"
        style={{ background: "var(--pitch-800)", border: "1px solid var(--line)" }}
      >
        {["teams", "pitches", "tournaments", "scoring", "users", "audit"].map((tkey) => (
          <button
            key={tkey}
            onClick={() => setTab(tkey)}
            className="px-3 py-1.5 rounded-md text-xs uppercase tracking-wide whitespace-nowrap"
            style={{
              background: tab === tkey ? "var(--amber)" : "transparent",
              color: tab === tkey ? "#101010" : "var(--chalk-dim)",
              fontFamily: "var(--font-mono)",
              fontWeight: 600,
            }}
          >
            {tkey}
          </button>
        ))}
      </div>
      {tab === "teams" && (
        <AdminTeams teams={teams} matches={matches} onAdd={addTeam} onEdit={editTeam} onDelete={deleteTeam} />
      )}
      {tab === "pitches" && (
        <AdminPitches pitches={pitches} onAdd={addPitch} onDelete={deletePitch} />
      )}
      {tab === "tournaments" && (
        <AdminTournaments
          tournaments={tournaments}
          matches={matches}
          pitches={pitches}
          teams={teams}
          onCreate={createTournament}
          onDelete={deleteTournament}
        />
      )}
      {tab === "scoring" && (
        <AdminScoring
          matches={matches}
          tournaments={tournaments}
          teams={teams}
          pitches={pitches}
          onUpdate={updateMatch}
          onUpdateTournament={updateTournamentStatus}
          onAddMatch={addMatch}
          onDeleteMatch={deleteMatch}
        />
      )}
      {tab === "audit" && <AdminAudit auditLog={auditLog} />}
      {tab === "users" && <AdminUsers users={users} teams={teams} onRefresh={fetchAll} />}
    </div>
  );
}
