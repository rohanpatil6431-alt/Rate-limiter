export interface RateLimitResult {
  success: boolean;
  remaining: number;
  limit: number;
  resetAt: number;
}

export interface RateLimiter {
  check(identifier: string): Promise<RateLimitResult>;
}

export type Algorithm = "fixed-window" | "sliding-window" | "token-bucket";

export interface LimiterConfig {
  limit: number;
  windowMs: number;
  burstCapacity: number;
}

export interface RedisClient {
  incr(key: string): Promise<number>;
  pexpire(key: string, ms: number): Promise<number>;
  expire(key: string, seconds: number): Promise<number>;
  zadd(key: string, item: { score: number; member: string }): Promise<number>;
  zremrangebyscore(key: string, min: number, max: number): Promise<number>;
  zcard(key: string): Promise<number>;
  hgetall<T extends Record<string, unknown>>(
    key: string,
  ): Promise<T | null>;
  hset(key: string, values: Record<string, string>): Promise<number>;
  del(...keys: string[]): Promise<number>;
  scan(
    cursor: number | string,
    options?: { match?: string; count?: number },
  ): Promise<[string | number, string[]]>;
}
