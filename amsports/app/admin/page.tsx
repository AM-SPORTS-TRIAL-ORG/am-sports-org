"use client";

import { useState, useEffect } from "react";
import { createSupabaseClient } from "@/lib/supabase";
import type { Team, Pitch, Tournament, Match, AuditLog, User } from "@/lib/types";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminTeams } from "@/components/admin/AdminTeams";
import { AdminPitches } from "@/components/admin/AdminPitches";
import { AdminTournaments } from "@/components/admin/AdminTournaments";
import { AdminScoring } from "@/components/admin/AdminScoring";
import { AdminAudit } from "@/components/admin/AdminAudit";

export default function AdminPage() {
  const [tab, setTab] = useState("teams");
  const [teams, setTeams] = useState<Team[]>([]);
  const [pitches, setPitches] = useState<Pitch[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [auditLog, setAuditLog] = useState<AuditLog[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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

  async function addTeam(name: string) {
    const supabase = createSupabaseClient();
    const color = ["#E8B93A", "#4F8FC0", "#C4432E", "#4FA36A", "#8B5FA3", "#D9782B"][teams.length % 6];
    const { data } = await supabase.from("teams").insert({ id: `t-${Date.now()}`, name, color, captain_user_id: null }).select().single();
    if (data) setTeams((prev) => [...prev, data]);
  }

  async function deleteTeam(teamId: string) {
    const supabase = createSupabaseClient();
    await supabase.from("teams").delete().eq("id", teamId);
    setTeams((prev) => prev.filter((t) => t.id !== teamId));
  }

  async function addPitch(name: string) {
    const supabase = createSupabaseClient();
    const { data } = await supabase.from("pitches").insert({ id: `pitch-${Date.now()}`, name }).select().single();
    if (data) setPitches((prev) => [...prev, data]);
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
    const teamIds = cfg.teamIds;
    let ids = [...teamIds];
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

    const config = {
      pitchIds: cfg.pitchIds,
      dailyStart: cfg.dailyStart,
      dailyEnd: cfg.dailyEnd,
      matchDuration: cfg.matchDuration,
      gap: cfg.gap,
      startDate: cfg.startDate,
    };
    const slotsTemplate = generateDaySlots(config.pitchIds, config.dailyStart, config.dailyEnd, config.matchDuration, config.gap);
    const scheduled: any[] = [];
    let overflowDayOffset = matchdays.length;
    matchdays.forEach((matchday, d) => {
      const date = new Date(cfg.startDate + "T00:00:00");
      date.setDate(date.getDate() + d);
      matchday.forEach((pair, i) => {
        const [homeId, awayId] = pair.split(":");
        if (i < slotsTemplate.length) {
          const slot = slotsTemplate[i];
          scheduled.push({ tournament_id: cfg.name, home_team_id: homeId, away_team_id: awayId, pitch_id: slot.pitchId, scheduled_date: date.toISOString().slice(0, 10), scheduled_time: slot.time, matchday: d, home_score: 0, away_score: 0, status: "scheduled" });
        } else {
          const overflowIdx = i - slotsTemplate.length;
          const overflowDate = new Date(cfg.startDate + "T00:00:00");
          overflowDate.setDate(overflowDate.getDate() + overflowDayOffset + Math.floor(overflowIdx / slotsTemplate.length));
          const slot = slotsTemplate[overflowIdx % slotsTemplate.length];
          scheduled.push({ tournament_id: cfg.name, home_team_id: homeId, away_team_id: awayId, pitch_id: slot.pitchId, scheduled_date: overflowDate.toISOString().slice(0, 10), scheduled_time: slot.time, matchday: d, home_score: 0, away_score: 0, status: "scheduled", overflow: true });
        }
      });
      if (matchday.length > slotsTemplate.length) overflowDayOffset += Math.ceil((matchday.length - slotsTemplate.length) / slotsTemplate.length);
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

    await supabase.from("tournament_pitches").insert(cfg.pitchIds.map((pid) => ({ tournament_id: tourId, pitch_id: pid })));

    const { data } = await supabase.from("matches").insert(
      scheduled.map((m) => ({
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
      }))
    );

    setTournaments((prev) => [...prev, { id: tourId, name: cfg.name, start_date: cfg.startDate, end_date: endDate.toISOString().slice(0, 10), status: "upcoming", match_duration_minutes: cfg.matchDuration, gap_minutes: cfg.gap, daily_start_time: cfg.dailyStart, daily_end_time: cfg.dailyEnd, points_win: cfg.pointsWin, points_draw: cfg.pointsDraw }]);
    setMatches((prev) => [...prev, ...scheduled.map((m) => ({ id: `m-${Date.now()}-${m.matchday}-${Math.random().toString(36).slice(2, 6)}`, tournament_id: tourId, home_team_id: m.home_team_id, away_team_id: m.away_team_id, pitch_id: m.pitch_id, scheduled_date: m.scheduled_date, scheduled_time: m.scheduled_time, matchday: m.matchday, home_score: 0, away_score: 0, status: m.status as string }))]);
  }

  async function updateMatch(matchId: string, updates: Partial<Match>) {
    const supabase = createSupabaseClient();
    await supabase.from("matches").update(updates).eq("id", matchId);
    setMatches((prev) => prev.map((m) => (m.id === matchId ? { ...m, ...updates } : m)));
  }

  if (loading) {
    return <div className="py-12 text-center" style={{ color: "var(--chalk-dim)" }}>Loading...</div>;
  }

  return (
    <div>
      <div className="flex gap-1 p-1 rounded-lg mb-4 overflow-x-auto" style={{ background: "var(--pitch-800)", border: "1px solid var(--line)" }}>
        {["teams", "pitches", "tournaments", "scoring", "audit"].map((tkey) => (
          <button
            key={tkey}
            onClick={() => setTab(tkey)}
            className="px-3 py-1.5 rounded-md text-xs uppercase tracking-wide whitespace-nowrap"
            style={{ background: tab === tkey ? "var(--amber)" : "transparent", color: tab === tkey ? "#101010" : "var(--chalk-dim)", fontFamily: "var(--font-mono)", fontWeight: 600 }}
          >
            {tkey}
          </button>
        ))}
      </div>
      {tab === "teams" && <AdminTeams teams={teams} onAdd={addTeam} onDelete={deleteTeam} />}
      {tab === "pitches" && <AdminPitches pitches={pitches} onAdd={addPitch} />}
      {tab === "tournaments" && <AdminTournaments tournaments={tournaments} pitches={pitches} teams={teams} onCreate={createTournament} />}
      {tab === "scoring" && <AdminScoring matches={matches} tournaments={tournaments} teams={teams} pitches={pitches} onUpdate={updateMatch} />}
      {tab === "audit" && <AdminAudit auditLog={auditLog} />}
    </div>
  );
}