import { describe, expect, it } from "vitest";
import { FixedWindowLimiter } from "../fixedWindow";
import { SlidingWindowLimiter } from "../slidingWindow";
import { TokenBucketLimiter } from "../tokenBucket";
import { createMockRedis } from "./mockRedis";

const config = {
  limit: 3,
  windowMs: 60_000,
  burstCapacity: 3,
};

describe("FixedWindowLimiter", () => {
  it("allows requests up to the limit", async () => {
    const redis = createMockRedis();
    const limiter = new FixedWindowLimiter(redis, config);

    for (let i = 0; i < 3; i++) {
      const result = await limiter.check("user-1");
      expect(result.success).toBe(true);
      expect(result.remaining).toBe(3 - (i + 1));
    }
  });

  it("blocks requests over the limit", async () => {
    const redis = createMockRedis();
    const limiter = new FixedWindowLimiter(redis, config);

    for (let i = 0; i < 3; i++) {
      await limiter.check("user-1");
    }

    const blocked = await limiter.check("user-1");
    expect(blocked.success).toBe(false);
    expect(blocked.remaining).toBe(0);
  });

  it("isolates clients", async () => {
    const redis = createMockRedis();
    const limiter = new FixedWindowLimiter(redis, config);

    for (let i = 0; i < 3; i++) {
      await limiter.check("user-a");
    }

    const otherClient = await limiter.check("user-b");
    expect(otherClient.success).toBe(true);
  });
});

describe("SlidingWindowLimiter", () => {
  it("allows requests up to the limit", async () => {
    const redis = createMockRedis();
    const limiter = new SlidingWindowLimiter(redis, config);

    for (let i = 0; i < 3; i++) {
      const result = await limiter.check("user-1");
      expect(result.success).toBe(true);
    }
  });

  it("blocks the fourth request in the same window", async () => {
    const redis = createMockRedis();
    const limiter = new SlidingWindowLimiter(redis, config);

    for (let i = 0; i < 3; i++) {
      await limiter.check("user-1");
    }

    const blocked = await limiter.check("user-1");
    expect(blocked.success).toBe(false);
  });
});

describe("TokenBucketLimiter", () => {
  it("allows burst up to capacity", async () => {
    const redis = createMockRedis();
    const limiter = new TokenBucketLimiter(redis, config);

    for (let i = 0; i < 3; i++) {
      const result = await limiter.check("user-1");
      expect(result.success).toBe(true);
    }
  });

  it("blocks when bucket is empty", async () => {
    const redis = createMockRedis();
    const limiter = new TokenBucketLimiter(redis, config);

    for (let i = 0; i < 3; i++) {
      await limiter.check("user-1");
    }

    const blocked = await limiter.check("user-1");
    expect(blocked.success).toBe(false);
  });

  it("refills tokens over time", async () => {
    const redis = createMockRedis();
    const limiter = new TokenBucketLimiter(redis, {
      limit: 60,
      windowMs: 60_000,
      burstCapacity: 2,
    });

    await limiter.check("user-1");
    await limiter.check("user-1");

    const blocked = await limiter.check("user-1");
    expect(blocked.success).toBe(false);

    await new Promise((resolve) => setTimeout(resolve, 1100));

    const refilled = await limiter.check("user-1");
    expect(refilled.success).toBe(true);
  });
});
