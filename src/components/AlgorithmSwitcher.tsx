"use client";

import type { Algorithm } from "@/lib/types";
import { ALGORITHMS } from "@/lib/types";

interface AlgorithmSwitcherProps {
  value: Algorithm;
  onChange: (algorithm: Algorithm) => void;
}

export function AlgorithmSwitcher({ value, onChange }: AlgorithmSwitcherProps) {
  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-400">
        Algorithm
      </h2>
      <div className="grid gap-3 sm:grid-cols-3">
        {ALGORITHMS.map((algo) => {
          const selected = value === algo.id;
          return (
            <button
              key={algo.id}
              type="button"
              onClick={() => onChange(algo.id)}
              className={`rounded-lg border p-4 text-left transition ${
                selected
                  ? "border-emerald-500/60 bg-emerald-500/10 ring-1 ring-emerald-500/40"
                  : "border-zinc-700 bg-zinc-950/50 hover:border-zinc-600"
              }`}
            >
              <div className="font-medium text-zinc-100">{algo.label}</div>
              <p className="mt-1 text-xs leading-relaxed text-zinc-400">
                {algo.description}
              </p>
            </button>
          );
        })}
      </div>
    </section>
  );
}
