import type { LimiterConfig, RateLimiter, RateLimitResult, RedisClient } from "./types";

export class FixedWindowLimiter implements RateLimiter {
  constructor(
    private readonly redis: RedisClient,
    private readonly config: LimiterConfig,
  ) {}

  async check(identifier: string): Promise<RateLimitResult> {
    const now = Date.now();
    const windowStart = Math.floor(now / this.config.windowMs) * this.config.windowMs;
    const resetAt = windowStart + this.config.windowMs;
    const key = `rl:fixed:${identifier}:${windowStart}`;

    const count = await this.redis.incr(key);

    if (count === 1) {
      await this.redis.pexpire(key, this.config.windowMs);
    }

    const remaining = Math.max(0, this.config.limit - count);
    const success = count <= this.config.limit;

    return {
      success,
      remaining,
      limit: this.config.limit,
      resetAt,
    };
  }
}
