import type { LimiterConfig, RateLimiter, RateLimitResult, RedisClient } from "./types";

export class SlidingWindowLimiter implements RateLimiter {
  constructor(
    private readonly redis: RedisClient,
    private readonly config: LimiterConfig,
  ) {}

  async check(identifier: string): Promise<RateLimitResult> {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;
    const key = `rl:sliding:${identifier}`;

    await this.redis.zremrangebyscore(key, 0, windowStart);
    const count = await this.redis.zcard(key);

    if (count >= this.config.limit) {
      return {
        success: false,
        remaining: 0,
        limit: this.config.limit,
        resetAt: now + this.config.windowMs,
      };
    }

    const member = `${now}:${Math.random().toString(36).slice(2)}`;
    await this.redis.zadd(key, { score: now, member });
    await this.redis.expire(key, Math.ceil(this.config.windowMs / 1000));

    return {
      success: true,
      remaining: this.config.limit - count - 1,
      limit: this.config.limit,
      resetAt: now + this.config.windowMs,
    };
  }
}
