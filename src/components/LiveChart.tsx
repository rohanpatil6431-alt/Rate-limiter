"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { RequestLogEntry } from "@/lib/types";

interface LiveChartProps {
  entries: RequestLogEntry[];
}

interface ChartBucket {
  time: string;
  allowed: number;
  blocked: number;
}

function bucketEntries(entries: RequestLogEntry[]): ChartBucket[] {
  if (entries.length === 0) return [];

  const buckets = new Map<string, ChartBucket>();

  for (const entry of entries) {
    const date = new Date(entry.timestamp);
    const key = date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

    const existing = buckets.get(key) ?? { time: key, allowed: 0, blocked: 0 };

    if (entry.allowed) {
      existing.allowed += 1;
    } else {
      existing.blocked += 1;
    }

    buckets.set(key, existing);
  }

  return Array.from(buckets.values()).slice(-30);
}

export function LiveChart({ entries }: LiveChartProps) {
  const data = bucketEntries(entries);

  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-400">
        Live Traffic
      </h2>

      {data.length === 0 ? (
        <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-zinc-700 text-sm text-zinc-500">
          Fire requests to see allowed vs blocked over time
        </div>
      ) : (
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
              <XAxis
                dataKey="time"
                tick={{ fill: "#a1a1aa", fontSize: 11 }}
                interval="preserveStartEnd"
              />
              <YAxis
                allowDecimals={false}
                tick={{ fill: "#a1a1aa", fontSize: 11 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#18181b",
                  border: "1px solid #3f3f46",
                  borderRadius: "8px",
                }}
                labelStyle={{ color: "#e4e4e7" }}
              />
              <Legend />
              <Bar
                dataKey="allowed"
                name="Allowed"
                stackId="requests"
                fill="#34d399"
                radius={[0, 0, 0, 0]}
              />
              <Bar
                dataKey="blocked"
                name="Blocked (429)"
                stackId="requests"
                fill="#f87171"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <p className="mt-3 text-xs text-zinc-500">
        {entries.length} total requests logged this session
      </p>
    </section>
  );
}
