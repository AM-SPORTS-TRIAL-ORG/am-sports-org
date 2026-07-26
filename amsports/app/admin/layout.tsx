"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || user.role !== "admin")) {
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

  if (!user || user.role !== "admin") return null;

  return <>{children}</>;
}
