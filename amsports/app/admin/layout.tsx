"use client";

import Link from "next/link";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <div className="flex gap-1 p-1 rounded-lg overflow-x-auto" style={{ background: "var(--pitch-800)", border: "1px solid var(--line)" }}>
        {["teams", "pitches", "tournaments", "scoring", "audit"].map((tab) => (
          <AdminNavLink key={tab} href={`/admin?tab=${tab}`}>
            {tab}
          </AdminNavLink>
        ))}
      </div>
      {children}
    </div>
  );
}

function AdminNavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="px-3 py-1.5 rounded-md text-xs uppercase tracking-wide whitespace-nowrap"
      style={{ color: "var(--chalk-dim)", fontFamily: "var(--font-mono)" }}
    >
      {children}
    </Link>
  );
}