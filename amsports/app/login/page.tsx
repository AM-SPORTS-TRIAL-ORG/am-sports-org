"use client";

import { useState } from "react";
import { createSupabaseClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createSupabaseClient();
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (signInError) {
      setError("Invalid email or password.");
      setLoading(false);
      return;
    }

    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", data.user.id)
      .single();

    if (!profile) {
      await supabase.auth.signOut();
      setError("No profile found for this account. Ask an admin to add you.");
      setLoading(false);
      return;
    }

    router.push(profile.role === "admin" ? "/admin" : "/captain");
    router.refresh();
  }

  return (
    <div className="max-w-sm mx-auto mt-8">
      <h1
        className="text-2xl mb-6"
        style={{ fontFamily: "var(--font-display)", color: "var(--chalk)" }}
      >
        Sign In
      </h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            className="text-xs block mb-1"
            style={{ color: "var(--chalk-dim)", fontFamily: "var(--font-mono)" }}
          >
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="w-full px-3 py-2 rounded-md text-sm"
            style={{
              background: "var(--pitch-950)",
              border: "1px solid var(--line)",
              color: "var(--chalk)",
            }}
          />
        </div>

        <div>
          <label
            className="text-xs block mb-1"
            style={{ color: "var(--chalk-dim)", fontFamily: "var(--font-mono)" }}
          >
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            className="w-full px-3 py-2 rounded-md text-sm"
            style={{
              background: "var(--pitch-950)",
              border: "1px solid var(--line)",
              color: "var(--chalk)",
            }}
          />
        </div>

        {error && (
          <p
            className="text-xs"
            style={{ color: "var(--red-card)", fontFamily: "var(--font-body)" }}
          >
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 rounded-md text-sm font-semibold"
          style={{
            background: loading ? "var(--pitch-700)" : "var(--amber)",
            color: "#101010",
            cursor: loading ? "not-allowed" : "pointer",
            fontFamily: "var(--font-body)",
          }}
        >
          {loading ? "Signing in…" : "Sign In"}
        </button>
      </form>
    </div>
  );
}
