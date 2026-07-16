"use client";

import { MOCK_CLIENTS } from "@/lib/types";

interface ClientSelectorProps {
  value: string;
  onChange: (clientId: string) => void;
}

export function ClientSelector({ value, onChange }: ClientSelectorProps) {
  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-400">
        Client Isolation
      </h2>
      <p className="mb-4 text-sm text-zinc-400">
        Each mock client has its own rate-limit bucket in Redis — switch clients to
        simulate per-user isolation.
      </p>
      <div className="flex flex-wrap gap-2">
        {MOCK_CLIENTS.map((client) => {
          const selected = value === client.id;
          return (
            <button
              key={client.id}
              type="button"
              onClick={() => onChange(client.id)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                selected
                  ? "bg-sky-500/20 text-sky-300 ring-1 ring-sky-500/50"
                  : "bg-zinc-950 text-zinc-400 ring-1 ring-zinc-700 hover:ring-zinc-600"
              }`}
            >
              {client.label}
            </button>
          );
        })}
      </div>
    </section>
  );
}
