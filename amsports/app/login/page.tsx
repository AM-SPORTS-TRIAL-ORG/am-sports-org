"use client";

import { useState } from "react";
import { createSupabaseClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const supabase = createSupabaseClient();
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: "demo-password",
    });

    if (signInError) {
      setError("Invalid credentials. Try admin@amsports.demo or captain.comets@amsports.demo.");
      return;
    }

    const { data: profile } = await supabase.from("users").select("*").eq("id", data.user?.id).single();

    if (!profile) {
      await supabase.auth.signOut();
      setError("No profile found for this account.");
      return;
    }

    router.push(profile.role === "admin" ? "/admin" : "/captain");
    router.refresh();
  }

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl mb-2" style={{ fontFamily: "var(--font-display)", color: "var(--chalk)" }}>Sign In</h1>
      <p className="text-xs mb-6" style={{ color: "var(--chalk-dim)", fontFamily: "var(--font-body)" }}>
        Demo accounts — <code style={{ fontFamily: "var(--font-mono)" }}>admin@amsports.demo</code> (Admin) or{" "}
        <code style={{ fontFamily: "var(--font-mono)" }}>captain.comets@amsports.demo</code> (Captain).
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-xs block mb-1" style={{ color: "var(--chalk-dim)", fontFamily: "var(--font-mono)" }}>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-3 py-2 rounded-md text-sm ams-input"
            placeholder="you@amsports.demo"
          />
        </div>
        <div>
          <label className="text-xs block mb-1" style={{ color: "var(--chalk-dim)", fontFamily: "var(--font-mono)" }}>Password</label>
          <input
            type="password"
            value="demo-password"
            readOnly
            className="w-full px-3 py-2 rounded-md text-sm ams-input"
            style={{ opacity: 0.5 }}
          />
        </div>
        {error && <p className="text-xs" style={{ color: "var(--red-card)", fontFamily: "var(--font-body)" }}>{error}</p>}
        <button type="submit" className="w-full py-2 rounded-md text-sm font-semibold" style={{ background: "var(--amber)", color: "#101010", fontFamily: "var(--font-body)" }}>
          Sign In
        </button>
      </form>
    </div>
  );
}