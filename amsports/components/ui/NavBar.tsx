"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

export function NavBar() {
  const { user, loading, isAdmin, isCaptain, signOut } = useAuth();
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <nav
      className="flex items-center justify-between px-4 py-3 border-b"
      style={{ borderColor: "var(--line)", background: "var(--pitch-800)" }}
    >
      {/* Brand */}
      <Link href="/" className="flex items-center gap-2">
        <span
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "22px",
            letterSpacing: "1px",
            color: "var(--chalk)",
          }}
        >
          AM SPORTS
        </span>
        <span
          className="text-[10px] uppercase tracking-widest hidden sm:inline"
          style={{ color: "var(--amber)", fontFamily: "var(--font-mono)" }}
        >
          Round-Robin
        </span>
      </Link>

      {/* Right side */}
      <div className="flex items-center gap-2">
        {/* Role-based nav links */}
        <div
          className="flex gap-1 p-1 rounded-lg"
          style={{ background: "var(--pitch-950)" }}
        >
          <NavLink href="/">Public</NavLink>
          {isAdmin && <NavLink href="/admin">Admin</NavLink>}
          {isCaptain && <NavLink href="/captain">Captain</NavLink>}
        </div>

        {/* Auth area */}
        {!loading && (
          user ? (
            <div className="flex items-center gap-2 ml-2">
              <span
                className="text-xs hidden sm:inline truncate max-w-[140px]"
                style={{ color: "var(--chalk-dim)", fontFamily: "var(--font-mono)" }}
                title={user.email}
              >
                {user.email}
              </span>
              <span
                className="text-[10px] px-1.5 py-0.5 rounded uppercase tracking-wide"
                style={{
                  background: isAdmin ? "rgba(232,185,58,0.15)" : "rgba(79,163,106,0.15)",
                  color: isAdmin ? "var(--amber)" : "var(--win-green)",
                  fontFamily: "var(--font-mono)",
                }}
              >
                {user.role}
              </span>
              <button
                onClick={handleSignOut}
                className="text-xs px-2 py-1 rounded"
                style={{
                  background: "var(--pitch-700)",
                  color: "var(--chalk-dim)",
                  fontFamily: "var(--font-mono)",
                }}
              >
                Sign out
              </button>
            </div>
          ) : (
            <NavLink href="/login">Sign in</NavLink>
          )
        )}
      </div>
    </nav>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="px-3 py-1.5 rounded-md text-xs uppercase tracking-wide"
      style={{ color: "var(--chalk-dim)", fontFamily: "var(--font-mono)" }}
    >
      {children}
    </Link>
  );
}
