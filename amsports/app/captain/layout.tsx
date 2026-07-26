"use client";

import Link from "next/link";

export default function CaptainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <Link href="/captain" className="text-xs" style={{ color: "var(--chalk-dim)", fontFamily: "var(--font-body)" }}>
        ← Dashboard
      </Link>
      {children}
    </div>
  );
}