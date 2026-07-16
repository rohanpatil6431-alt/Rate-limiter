"use client";

import type { LimiterConfig } from "@/lib/types";

interface ConfigPanelProps {
  config: LimiterConfig;
  onChange: (config: LimiterConfig) => void;
}

export function ConfigPanel({ config, onChange }: ConfigPanelProps) {
  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-400">
        Configuration
      </h2>
      <div className="grid gap-4 sm:grid-cols-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-zinc-400">
            Limit (requests / window)
          </span>
          <input
            type="number"
            min={1}
            max={1000}
            value={config.limit}
            onChange={(e) =>
              onChange({ ...config, limit: Math.max(1, Number(e.target.value)) })
            }
            className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-emerald-500"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-zinc-400">
            Window (seconds)
          </span>
          <input
            type="number"
            min={1}
            max={3600}
            value={config.windowMs / 1000}
            onChange={(e) =>
              onChange({
                ...config,
                windowMs: Math.max(1000, Number(e.target.value) * 1000),
              })
            }
            className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-emerald-500"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-zinc-400">
            Burst capacity (token bucket)
          </span>
          <input
            type="number"
            min={1}
            max={1000}
            value={config.burstCapacity}
            onChange={(e) =>
              onChange({
                ...config,
                burstCapacity: Math.max(1, Number(e.target.value)),
              })
            }
            className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-emerald-500"
          />
        </label>
      </div>
    </section>
  );
}
