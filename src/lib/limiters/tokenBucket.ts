import type { LimiterConfig, RateLimiter, RateLimitResult, RedisClient } from "./types";

interface BucketState extends Record<string, unknown> {
  tokens?: string;
  lastRefill?: string;
}

export class TokenBucketLimiter implements RateLimiter {
  constructor(
    private readonly redis: RedisClient,
    private readonly config: LimiterConfig,
  ) {}

  async check(identifier: string): Promise<RateLimitResult> {
    const now = Date.now();
    const key = `rl:bucket:${identifier}`;
    const { limit, windowMs, burstCapacity } = this.config;
    const refillRate = limit / windowMs;

    const data = await this.redis.hgetall<BucketState>(key);

    let tokens = burstCapacity;
    let lastRefill = now;

    if (data?.tokens !== undefined && data.lastRefill !== undefined) {
      tokens = parseFloat(data.tokens);
      lastRefill = parseInt(data.lastRefill, 10);
      const elapsed = now - lastRefill;
      tokens = Math.min(burstCapacity, tokens + elapsed * refillRate);
    }

    if (tokens < 1) {
      const msUntilToken = (1 - tokens) / refillRate;
      return {
        success: false,
        remaining: 0,
        limit: burstCapacity,
        resetAt: now + Math.ceil(msUntilToken),
      };
    }

    tokens -= 1;
    await this.redis.hset(key, {
      tokens: tokens.toString(),
      lastRefill: now.toString(),
    });

    return {
      success: true,
      remaining: Math.floor(tokens),
      limit: burstCapacity,
      resetAt: now + Math.ceil((1 - tokens % 1) / refillRate || windowMs / limit),
    };
  }
}
