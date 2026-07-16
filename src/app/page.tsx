"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AlgorithmSwitcher } from "@/components/AlgorithmSwitcher";
import { ClientSelector } from "@/components/ClientSelector";
import { ConfigPanel } from "@/components/ConfigPanel";
import { LiveChart } from "@/components/LiveChart";
import { TrafficSimulator } from "@/components/TrafficSimulator";
import {
  buildProtectedUrl,
  DEFAULT_CONFIG,
  type Algorithm,
  type LimiterConfig,
  type RateLimitStatus,
  type RequestLogEntry,
} from "@/lib/types";

const INITIAL_STATUS: RateLimitStatus = {
  remaining: DEFAULT_CONFIG.limit,
  limit: DEFAULT_CONFIG.limit,
  resetAt: 0,
  lastStatusCode: null,
};

export default function Home() {
  const [algorithm, setAlgorithm] = useState<Algorithm>("fixed-window");
  const [config, setConfig] = useState<LimiterConfig>(DEFAULT_CONFIG);
  const [clientId, setClientId] = useState("client-alpha");
  const [entries, setEntries] = useState<RequestLogEntry[]>([]);
  const [status, setStatus] = useState<RateLimitStatus>(INITIAL_STATUS);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [requestsPerSecond, setRequestsPerSecond] = useState(5);

  const configRef = useRef(config);
  const algorithmRef = useRef(algorithm);
  const clientIdRef = useRef(clientId);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    configRef.current = config;
  }, [config]);

  useEffect(() => {
    algorithmRef.current = algorithm;
  }, [algorithm]);

  useEffect(() => {
    clientIdRef.current = clientId;
  }, [clientId]);

  const fireRequest = useCallback(async () => {
    const url = buildProtectedUrl(
      configRef.current,
      algorithmRef.current,
      clientIdRef.current,
    );

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(url);
      const data = await response.json().catch(() => ({}));
      const remaining = Number(
        response.headers.get("X-RateLimit-Remaining") ?? data.remaining ?? 0,
      );
      const limit = Number(
        response.headers.get("X-RateLimit-Limit") ?? data.limit ?? configRef.current.limit,
      );
      const resetAt = Number(
        response.headers.get("X-RateLimit-Reset") ?? data.resetAt ?? 0,
      );

      const entry: RequestLogEntry = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        allowed: response.ok,
        remaining,
        clientId: clientIdRef.current,
        statusCode: response.status,
      };

      setEntries((prev) => [...prev.slice(-199), entry]);
      setStatus({
        remaining,
        limit,
        resetAt,
        lastStatusCode: response.status,
      });

      if (!response.ok && response.status !== 429) {
        setError(data.error ?? `Request failed with status ${response.status}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const startBurst = useCallback(() => {
    if (intervalRef.current) return;
    setIsRunning(true);
    const intervalMs = Math.max(50, 1000 / requestsPerSecond);
    intervalRef.current = setInterval(() => {
      void fireRequest();
    }, intervalMs);
  }, [fireRequest, requestsPerSecond]);

  const stopBurst = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsRunning(false);
  }, []);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const handleAlgorithmChange = useCallback(
    (next: Algorithm) => {
      stopBurst();
      setAlgorithm(next);
    },
    [stopBurst],
  );

  const handleConfigChange = useCallback(
    (next: LimiterConfig) => {
      stopBurst();
      setConfig(next);
    },
    [stopBurst],
  );

  const handleClientChange = useCallback(
    (next: string) => {
      stopBurst();
      setClientId(next);
    },
    [stopBurst],
  );

  const resetLimits = useCallback(async () => {
    stopBurst();
    setError(null);

    try {
      const response = await fetch("/api/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientIds: [clientId] }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setError(data.error ?? "Failed to reset limits");
        return;
      }

      setEntries([]);
      setStatus({
        remaining: config.limit,
        limit: config.limit,
        resetAt: 0,
        lastStatusCode: null,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reset limits");
    }
  }, [clientId, config.limit, stopBurst]);

  return (
    <div className="min-h-full bg-zinc-950 text-zinc-100">
      <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 sm:px-6">
          <p className="text-sm font-medium text-emerald-400">
            System Design Demo
          </p>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Rate Limiter Visualizer
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-zinc-400 sm:text-base">
            Hammer a real Redis-backed API, watch requests get allowed or throttled
            live, and switch algorithms to see the tradeoffs — not just read about them.
          </p>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-5 px-4 py-8 sm:px-6 lg:grid-cols-2">
        <div className="flex flex-col gap-5 lg:col-span-2">
          <AlgorithmSwitcher value={algorithm} onChange={handleAlgorithmChange} />
        </div>

        <ConfigPanel config={config} onChange={handleConfigChange} />
        <ClientSelector value={clientId} onChange={handleClientChange} />

        <div className="lg:col-span-2">
          <TrafficSimulator
            algorithm={algorithm}
            config={config}
            clientId={clientId}
            isRunning={isRunning}
            requestsPerSecond={requestsPerSecond}
            onRequestsPerSecondChange={setRequestsPerSecond}
            onFireRequest={() => void fireRequest()}
            onStartBurst={startBurst}
            onStopBurst={stopBurst}
            onResetLimits={() => void resetLimits()}
            status={status}
            isLoading={isLoading}
            error={error}
          />
        </div>

        <div className="lg:col-span-2">
          <LiveChart entries={entries.filter((e) => e.clientId === clientId)} />
        </div>
      </main>
    </div>
  );
}
