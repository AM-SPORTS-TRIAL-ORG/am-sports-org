"use client";

import { useState } from "react";
import { createSupabaseClient } from "@/lib/supabase";
import type { User, Team } from "@/lib/types";

export function AdminUsers({
  users,
  teams,
  onRefresh,
}: {
  users: User[];
  teams: Team[];
  onRefresh: () => void;
}) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"admin" | "captain">("captain");
  const [teamId, setTeamId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRole, setEditRole] = useState<"admin" | "captain">("captain");
  const [editTeamId, setEditTeamId] = useState("");

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);

    const supabase = createSupabaseClient();

    // 1. Create the auth account
    const { data: authData, error: authError } = await supabase.auth.admin
      ? // admin API not available from browser — use signUp instead
        await supabase.auth.signUp({ email: email.trim(), password })
      : await supabase.auth.signUp({ email: email.trim(), password });

    if (authError || !authData.user) {
      setError(authError?.message ?? "Failed to create auth account.");
      setSaving(false);
      return;
    }

    // 2. Insert the profile row
    const { error: profileError } = await supabase.from("users").insert({
      id: authData.user.id,
      email: email.trim(),
      role,
      team_id: teamId || null,
    });

    if (profileError) {
      setError(profileError.message);
      setSaving(false);
      return;
    }

    // 3. If captain, link team
    if (role === "captain" && teamId) {
      await supabase
        .from("teams")
        .update({ captain_user_id: authData.user.id })
        .eq("id", teamId);
    }

    setEmail("");
    setPassword("");
    setTeamId("");
    setSaving(false);
    onRefresh();
  }

  async function handleSaveEdit(userId: string) {
    const supabase = createSupabaseClient();
    await supabase
      .from("users")
      .update({ role: editRole, team_id: editTeamId || null })
      .eq("id", userId);

    // Update captain link on team
    if (editRole === "captain" && editTeamId) {
      await supabase
        .from("teams")
        .update({ captain_user_id: userId })
        .eq("id", editTeamId);
    }

    setEditingId(null);
    onRefresh();
  }

  async function handleDelete(userId: string) {
    if (!confirm("Delete this user? They will no longer be able to log in.")) return;
    const supabase = createSupabaseClient();
    await supabase.from("users").delete().eq("id", userId);
    onRefresh();
  }

  function startEdit(u: User) {
    setEditingId(u.id);
    setEditRole(u.role);
    setEditTeamId(u.team_id ?? "");
  }

  return (
    <div className="space-y-4">
      {/* Create user form */}
      <section
        className="p-4 rounded-lg"
        style={{ background: "var(--pitch-800)", border: "1px solid var(--line)" }}
      >
        <p
          className="text-sm font-semibold mb-3"
          style={{ color: "var(--chalk)", fontFamily: "var(--font-body)" }}
        >
          Add User
        </p>
        <form onSubmit={handleCreate} className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <label className="text-xs col-span-2" style={{ color: "var(--chalk-dim)", fontFamily: "var(--font-mono)" }}>
              Email
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1 w-full px-3 py-2 rounded-md text-sm"
                style={{ background: "var(--pitch-950)", border: "1px solid var(--line)", color: "var(--chalk)" }}
              />
            </label>
            <label className="text-xs" style={{ color: "var(--chalk-dim)", fontFamily: "var(--font-mono)" }}>
              Password
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="mt-1 w-full px-3 py-2 rounded-md text-sm"
                style={{ background: "var(--pitch-950)", border: "1px solid var(--line)", color: "var(--chalk)" }}
              />
            </label>
            <label className="text-xs" style={{ color: "var(--chalk-dim)", fontFamily: "var(--font-mono)" }}>
              Role
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as "admin" | "captain")}
                className="mt-1 w-full px-3 py-2 rounded-md text-sm"
                style={{ background: "var(--pitch-950)", border: "1px solid var(--line)", color: "var(--chalk)" }}
              >
                <option value="captain">Captain</option>
                <option value="admin">Admin</option>
              </select>
            </label>
            {role === "captain" && (
              <label className="text-xs col-span-2" style={{ color: "var(--chalk-dim)", fontFamily: "var(--font-mono)" }}>
                Assign Team
                <select
                  value={teamId}
                  onChange={(e) => setTeamId(e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-md text-sm"
                  style={{ background: "var(--pitch-950)", border: "1px solid var(--line)", color: "var(--chalk)" }}
                >
                  <option value="">— No team yet —</option>
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </label>
            )}
          </div>

          {error && (
            <p className="text-xs" style={{ color: "var(--red-card)", fontFamily: "var(--font-body)" }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full py-2 rounded-md text-sm font-semibold"
            style={{
              background: saving ? "var(--pitch-700)" : "var(--amber)",
              color: "#101010",
              cursor: saving ? "not-allowed" : "pointer",
              fontFamily: "var(--font-body)",
            }}
          >
            {saving ? "Creating…" : "Create User"}
          </button>
        </form>
      </section>

      {/* User list */}
      <section
        className="p-4 rounded-lg"
        style={{ background: "var(--pitch-800)", border: "1px solid var(--line)" }}
      >
        <p
          className="text-sm font-semibold mb-3"
          style={{ color: "var(--chalk)", fontFamily: "var(--font-body)" }}
        >
          All Users
        </p>
        {users.length === 0 && (
          <p className="text-xs" style={{ color: "var(--chalk-dim)", fontFamily: "var(--font-body)" }}>
            No users yet.
          </p>
        )}
        <div className="space-y-2">
          {users.map((u) => (
            <div
              key={u.id}
              className="px-3 py-2 rounded-md"
              style={{ background: "var(--pitch-950)", border: "1px solid var(--line)" }}
            >
              {editingId === u.id ? (
                <div className="space-y-2">
                  <p className="text-xs truncate" style={{ color: "var(--chalk)", fontFamily: "var(--font-mono)" }}>
                    {u.email}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={editRole}
                      onChange={(e) => setEditRole(e.target.value as "admin" | "captain")}
                      className="px-2 py-1 rounded text-xs"
                      style={{ background: "var(--pitch-800)", border: "1px solid var(--line)", color: "var(--chalk)" }}
                    >
                      <option value="captain">Captain</option>
                      <option value="admin">Admin</option>
                    </select>
                    <select
                      value={editTeamId}
                      onChange={(e) => setEditTeamId(e.target.value)}
                      className="px-2 py-1 rounded text-xs"
                      style={{ background: "var(--pitch-800)", border: "1px solid var(--line)", color: "var(--chalk)" }}
                    >
                      <option value="">— No team —</option>
                      {teams.map((t) => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSaveEdit(u.id)}
                      className="flex-1 py-1 rounded text-xs font-semibold"
                      style={{ background: "var(--amber)", color: "#101010", fontFamily: "var(--font-mono)" }}
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="flex-1 py-1 rounded text-xs"
                      style={{ background: "var(--pitch-700)", color: "var(--chalk-dim)", fontFamily: "var(--font-mono)" }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <p
                      className="text-sm truncate"
                      style={{ color: "var(--chalk)", fontFamily: "var(--font-body)" }}
                    >
                      {u.email}
                    </p>
                    <p
                      className="text-[10px] uppercase tracking-wide mt-0.5"
                      style={{ color: "var(--chalk-dim)", fontFamily: "var(--font-mono)" }}
                    >
                      {u.role}
                      {u.team_id && (
                        <span style={{ color: "var(--amber)" }}>
                          {" · "}
                          {teams.find((t) => t.id === u.team_id)?.name ?? u.team_id}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <button
                      onClick={() => startEdit(u)}
                      className="px-2 py-1 rounded text-xs"
                      style={{ color: "var(--chalk-dim)", fontFamily: "var(--font-mono)" }}
                      title="Edit user"
                    >
                      ✎
                    </button>
                    <button
                      onClick={() => handleDelete(u.id)}
                      className="px-2 py-1 rounded text-xs"
                      style={{ color: "var(--red-card)", fontFamily: "var(--font-mono)" }}
                      title="Delete user"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
