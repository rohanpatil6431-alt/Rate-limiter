"use client";

import {
  buildProtectedUrl,
  formatResetTime,
  type Algorithm,
  type LimiterConfig,
  type RateLimitStatus,
  type RequestLogEntry,
} from "@/lib/types";

interface TrafficSimulatorProps {
  algorithm: Algorithm;
  config: LimiterConfig;
  clientId: string;
  isRunning: boolean;
  requestsPerSecond: number;
  onRequestsPerSecondChange: (value: number) => void;
  onFireRequest: () => void;
  onStartBurst: () => void;
  onStopBurst: () => void;
  onResetLimits: () => void;
  status: RateLimitStatus;
  isLoading: boolean;
  error: string | null;
}

export function TrafficSimulator({
  algorithm,
  config,
  clientId,
  isRunning,
  requestsPerSecond,
  onRequestsPerSecondChange,
  onFireRequest,
  onStartBurst,
  onStopBurst,
  onResetLimits,
  status,
  isLoading,
  error,
}: TrafficSimulatorProps) {
  const endpoint = buildProtectedUrl(config, algorithm, clientId);

  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">
          Traffic Simulator
        </h2>
        <code className="rounded bg-zinc-950 px-2 py-1 text-xs text-emerald-400">
          GET {endpoint}
        </code>
      </div>

      <div className="mb-5 grid gap-3 rounded-lg border border-zinc-800 bg-zinc-950/70 p-4 sm:grid-cols-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-zinc-500">Remaining</p>
          <p className="mt-1 text-3xl font-semibold tabular-nums text-emerald-400">
            {status.remaining}
            <span className="text-lg text-zinc-500"> / {status.limit}</span>
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-zinc-500">Resets in</p>
          <p className="mt-1 text-3xl font-semibold tabular-nums text-zinc-100">
            {status.resetAt ? formatResetTime(status.resetAt) : "—"}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-zinc-500">Last status</p>
          <p
            className={`mt-1 text-3xl font-semibold tabular-nums ${
              status.lastStatusCode === 429
                ? "text-red-400"
                : status.lastStatusCode === 200
                  ? "text-emerald-400"
                  : "text-zinc-500"
            }`}
          >
            {status.lastStatusCode ?? "—"}
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="flex flex-wrap items-end gap-3">
        <button
          type="button"
          onClick={onFireRequest}
          disabled={isLoading}
          className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:opacity-50"
        >
          Fire request
        </button>

        <label className="flex flex-col gap-1">
          <span className="text-xs text-zinc-500">Requests / sec</span>
          <input
            type="number"
            min={1}
            max={50}
            value={requestsPerSecond}
            onChange={(e) =>
              onRequestsPerSecondChange(Math.max(1, Number(e.target.value)))
            }
            className="w-24 rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-emerald-500"
          />
        </label>

        {isRunning ? (
          <button
            type="button"
            onClick={onStopBurst}
            className="rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-2.5 text-sm font-medium text-red-300 transition hover:bg-red-500/20"
          >
            Stop burst
          </button>
        ) : (
          <button
            type="button"
            onClick={onStartBurst}
            disabled={isLoading}
            className="rounded-lg border border-amber-500/50 bg-amber-500/10 px-4 py-2.5 text-sm font-medium text-amber-200 transition hover:bg-amber-500/20 disabled:opacity-50"
          >
            Start burst
          </button>
        )}

        <button
          type="button"
          onClick={onResetLimits}
          className="rounded-lg border border-zinc-600 px-4 py-2.5 text-sm font-medium text-zinc-300 transition hover:bg-zinc-800"
        >
          Reset limits
        </button>
      </div>
    </section>
  );
}

export type { RequestLogEntry };
