import { FixedWindowLimiter } from "./fixedWindow";
import { SlidingWindowLimiter } from "./slidingWindow";
import { TokenBucketLimiter } from "./tokenBucket";
import type { Algorithm, LimiterConfig, RateLimiter, RedisClient } from "./types";

export function createLimiter(
  algorithm: Algorithm,
  config: LimiterConfig,
  redis: RedisClient,
): RateLimiter {
  switch (algorithm) {
    case "fixed-window":
      return new FixedWindowLimiter(redis, config);
    case "sliding-window":
      return new SlidingWindowLimiter(redis, config);
    case "token-bucket":
      return new TokenBucketLimiter(redis, config);
    default: {
      const exhaustive: never = algorithm;
      throw new Error(`Unknown algorithm: ${exhaustive}`);
    }
  }
}

export function parseAlgorithm(value: string | null): Algorithm {
  if (
    value === "fixed-window" ||
    value === "sliding-window" ||
    value === "token-bucket"
  ) {
    return value;
  }
  return "fixed-window";
}

export function parseLimiterConfig(searchParams: URLSearchParams): LimiterConfig {
  const limit = Math.max(1, parseInt(searchParams.get("limit") ?? "10", 10));
  const windowMs = Math.max(
    1000,
    parseInt(searchParams.get("windowMs") ?? "60000", 10),
  );
  const burstCapacity = Math.max(
    1,
    parseInt(searchParams.get("burstCapacity") ?? String(limit), 10),
  );

  return { limit, windowMs, burstCapacity };
}
