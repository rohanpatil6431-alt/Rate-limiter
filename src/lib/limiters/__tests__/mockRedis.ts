import type { RedisClient } from "./types";

type HashStore = Map<string, Record<string, string>>;
type StringStore = Map<string, { value: number; expiresAt?: number }>;
type ZSetStore = Map<string, Map<string, number>>;

export function createMockRedis(): RedisClient & {
  clear: () => void;
} {
  const strings: StringStore = new Map();
  const hashes: HashStore = new Map();
  const zsets: ZSetStore = new Map();

  function isExpired(key: string, store: StringStore): boolean {
    const entry = store.get(key);
    if (!entry?.expiresAt) return false;
    if (Date.now() > entry.expiresAt) {
      store.delete(key);
      return true;
    }
    return false;
  }

  return {
    clear() {
      strings.clear();
      hashes.clear();
      zsets.clear();
    },

    async incr(key) {
      if (isExpired(key, strings)) {
        strings.delete(key);
      }
      const current = strings.get(key)?.value ?? 0;
      const next = current + 1;
      strings.set(key, { value: next, expiresAt: strings.get(key)?.expiresAt });
      return next;
    },

    async pexpire(key, ms) {
      const entry = strings.get(key);
      if (!entry) return 0;
      entry.expiresAt = Date.now() + ms;
      return 1;
    },

    async expire(key, seconds) {
      const zset = zsets.get(key);
      if (zset) {
        setTimeout(() => zsets.delete(key), seconds * 1000);
        return 1;
      }
      const entry = strings.get(key);
      if (!entry) return 0;
      entry.expiresAt = Date.now() + seconds * 1000;
      return 1;
    },

    async zadd(key, item) {
      let zset = zsets.get(key);
      if (!zset) {
        zset = new Map();
        zsets.set(key, zset);
      }
      zset.set(item.member, item.score);
      return 1;
    },

    async zremrangebyscore(key, min, max) {
      const zset = zsets.get(key);
      if (!zset) return 0;
      let removed = 0;
      for (const [member, score] of zset.entries()) {
        if (score >= min && score <= max) {
          zset.delete(member);
          removed += 1;
        }
      }
      return removed;
    },

    async zcard(key) {
      return zsets.get(key)?.size ?? 0;
    },

    async hgetall(key) {
      const hash = hashes.get(key);
      return hash ? { ...hash } : null;
    },

    async hset(key, values) {
      const existing = hashes.get(key) ?? {};
      hashes.set(key, { ...existing, ...values });
      return 1;
    },

    async del(...keys) {
      let count = 0;
      for (const key of keys) {
        if (strings.delete(key)) count += 1;
        if (hashes.delete(key)) count += 1;
        if (zsets.delete(key)) count += 1;
      }
      return count;
    },

    async scan(cursor, options) {
      const match = options?.match?.replace(/\*/g, ".*") ?? ".*";
      const regex = new RegExp(`^${match}$`);
      const allKeys = [
        ...strings.keys(),
        ...hashes.keys(),
        ...zsets.keys(),
      ].filter((key, index, arr) => arr.indexOf(key) === index);
      const matched = allKeys.filter((key) => regex.test(key));
      return ["0", matched] as [string, string[]];
    },
  };
}
