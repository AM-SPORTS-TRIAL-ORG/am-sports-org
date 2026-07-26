"use client";

import type { AuditLog } from "@/lib/types";

export function AdminAudit({ auditLog }: { auditLog: AuditLog[] }) {
  return (
    <section className="p-4 rounded-lg mb-4" style={{ background: "var(--pitch-800)", border: "1px solid var(--line)" }}>
      <div className="flex items-center gap-2 mb-3">
        <span style={{ color: "var(--chalk)", fontFamily: "var(--font-body)", fontWeight: 600 }}>Audit Log</span>
      </div>
      {auditLog.length === 0 && <p className="text-xs" style={{ color: "var(--chalk-dim)", fontFamily: "var(--font-body)" }}>No actions logged yet.</p>}
      <div className="space-y-1.5 max-h-96 overflow-y-auto">
        {auditLog.map((entry) => (
          <div key={entry.id} className="text-xs px-2 py-1.5 rounded" style={{ background: "var(--pitch-950)", fontFamily: "var(--font-mono)", color: "var(--chalk-dim)" }}>
            <span style={{ color: "var(--amber)" }}>{entry.action}</span> — {entry.detail} <span className="opacity-60">({entry.actor_user_id ?? "system"}, {new Date(entry.timestamp).toLocaleString()})</span>
          </div>
        ))}
      </div>
    </section>
  );
}