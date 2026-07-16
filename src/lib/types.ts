export type Algorithm = "fixed-window" | "sliding-window" | "token-bucket";

export interface LimiterConfig {
  limit: number;
  windowMs: number;
  burstCapacity: number;
}

export interface RequestLogEntry {
  id: string;
  timestamp: number;
  allowed: boolean;
  remaining: number;
  clientId: string;
  statusCode: number;
}

export interface RateLimitStatus {
  remaining: number;
  limit: number;
  resetAt: number;
  lastStatusCode: number | null;
}

export const ALGORITHMS: { id: Algorithm; label: string; description: string }[] =
  [
    {
      id: "fixed-window",
      label: "Fixed Window",
      description: "Simple counter per time bucket — fast, but boundary bursts",
    },
    {
      id: "sliding-window",
      label: "Sliding Window",
      description: "Rolling log of timestamps — accurate, higher memory",
    },
    {
      id: "token-bucket",
      label: "Token Bucket",
      description: "Refilling tokens — smooth bursts with controlled refill rate",
    },
  ];

export const DEFAULT_CONFIG: LimiterConfig = {
  limit: 10,
  windowMs: 60_000,
  burstCapacity: 10,
};

export const MOCK_CLIENTS = [
  { id: "client-alpha", label: "Client Alpha" },
  { id: "client-beta", label: "Client Beta" },
  { id: "client-gamma", label: "Client Gamma" },
];

export function buildProtectedUrl(
  config: LimiterConfig,
  algorithm: Algorithm,
  clientId: string,
): string {
  const params = new URLSearchParams({
    algorithm,
    clientId,
    limit: String(config.limit),
    windowMs: String(config.windowMs),
    burstCapacity: String(config.burstCapacity),
  });

  return `/api/protected?${params.toString()}`;
}

export function formatResetTime(resetAt: number): string {
  const diff = resetAt - Date.now();
  if (diff <= 0) return "now";
  if (diff < 1000) return `${diff}ms`;
  if (diff < 60_000) return `${Math.ceil(diff / 1000)}s`;
  return `${Math.ceil(diff / 60_000)}m`;
}
