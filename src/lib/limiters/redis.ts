import { Redis } from "@upstash/redis";
import type { RedisClient } from "./types";

let redisInstance: Redis | null = null;

export function getRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    return null;
  }

  if (!redisInstance) {
    redisInstance = new Redis({ url, token });
  }

  return redisInstance;
}

export function createRedisClient(redis: Redis): RedisClient {
  return {
    incr: (key) => redis.incr(key),
    pexpire: (key, ms) => redis.pexpire(key, ms),
    expire: (key, seconds) => redis.expire(key, seconds),
    zadd: async (key, item) => (await redis.zadd(key, item)) ?? 0,
    zremrangebyscore: (key, min, max) => redis.zremrangebyscore(key, min, max),
    zcard: (key) => redis.zcard(key),
    hgetall: (key) => redis.hgetall(key),
    hset: (key, values) => redis.hset(key, values),
    del: (...keys) => redis.del(...keys),
    scan: async (cursor, options) => {
      const result = await redis.scan(cursor, options ?? { match: "rl:*", count: 100 });
      return [result[0], result[1]] as [string | number, string[]];
    },
  };
}

export async function resetAllLimitKeys(
  redis: RedisClient,
): Promise<number> {
  let cursor: string | number = 0;
  let deleted = 0;

  do {
    const [nextCursor, keys] = await redis.scan(cursor, {
      match: "rl:*",
      count: 100,
    });
    cursor = nextCursor;

    if (keys.length > 0) {
      deleted += await redis.del(...keys);
    }
  } while (cursor !== 0 && cursor !== "0");

  return deleted;
}

export async function resetClientKeys(
  redis: RedisClient,
  clientId: string,
): Promise<number> {
  const patterns = [
    `rl:fixed:${clientId}:*`,
    `rl:sliding:${clientId}`,
    `rl:bucket:${clientId}`,
  ];

  let deleted = 0;

  for (const pattern of patterns) {
    let cursor: string | number = 0;

    do {
      const [nextCursor, keys] = await redis.scan(cursor, {
        match: pattern,
        count: 100,
      });
      cursor = nextCursor;

      if (keys.length > 0) {
        deleted += await redis.del(...keys);
      }
    } while (cursor !== 0 && cursor !== "0");
  }

  return deleted;
}
