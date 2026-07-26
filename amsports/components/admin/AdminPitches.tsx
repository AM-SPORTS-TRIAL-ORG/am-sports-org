"use client";

import { useState } from "react";
import type { Pitch } from "@/lib/types";

export function AdminPitches({
  pitches,
  onAdd,
  onDelete,
}: {
  pitches: Pitch[];
  onAdd: (name: string) => void;
  onDelete: (id: string) => void;
}) {
  const [name, setName] = useState("");

  return (
    <section className="p-4 rounded-lg mb-4" style={{ background: "var(--pitch-800)", border: "1px solid var(--line)" }}>
      <div className="flex items-center gap-2 mb-3">
        <span style={{ color: "var(--chalk)", fontFamily: "var(--font-body)", fontWeight: 600 }}>Pitches</span>
      </div>
      <div className="flex gap-2 mb-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Pitch name (e.g. Pitch 2)"
          className="flex-1 px-3 py-2 rounded-md text-sm bg-[var(--pitch-950)] border border-[var(--line)] text-[var(--chalk)]"
          onKeyDown={(e) => { if (e.key === "Enter" && name.trim()) { onAdd(name.trim()); setName(""); } }}
        />
        <button
          onClick={() => { if (name.trim()) { onAdd(name.trim()); setName(""); } }}
          className="px-3 py-2 rounded-md text-sm font-semibold bg-amber-500 text-[#101010]"
        >
          +
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {pitches.map((p) => (
          <div
            key={p.id}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs"
            style={{ background: "var(--pitch-950)", border: "1px solid var(--line)" }}
          >
            <span style={{ color: "var(--chalk-dim)", fontFamily: "var(--font-mono)" }}>{p.name}</span>
            <button
              onClick={() => onDelete(p.id)}
              title="Delete pitch"
              className="ml-1 leading-none"
              style={{ color: "var(--red-card)", fontFamily: "var(--font-mono)" }}
              aria-label={`Delete ${p.name}`}
            >
              ✕
            </button>
          </div>
        ))}
        {pitches.length === 0 && (
          <p className="text-xs" style={{ color: "var(--chalk-dim)", fontFamily: "var(--font-body)" }}>
            No pitches yet.
          </p>
        )}
      </div>
    </section>
  );
}
