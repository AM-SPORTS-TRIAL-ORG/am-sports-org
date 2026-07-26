"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";

export default function CaptainLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || user.role !== "captain")) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="py-12 text-center" style={{ color: "var(--chalk-dim)" }}>
        Loading…
      </div>
    );
  }

  if (!user || user.role !== "captain") return null;

  return (
    <div className="space-y-4">
      <Link
        href="/captain"
        className="text-xs"
        style={{ color: "var(--chalk-dim)", fontFamily: "var(--font-body)" }}
      >
        ← Dashboard
      </Link>
      {children}
    </div>
  );
}
