import { NextRequest, NextResponse } from "next/server";
import {
  createLimiter,
  parseAlgorithm,
  parseLimiterConfig,
} from "@/lib/limiters/factory";
import { createRedisClient, getRedis } from "@/lib/limiters/redis";

function rateLimitHeaders(result: {
  limit: number;
  remaining: number;
  resetAt: number;
}) {
  return {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(result.resetAt),
  };
}

export async function GET(request: NextRequest) {
  const redis = getRedis();

  if (!redis) {
    return NextResponse.json(
      {
        error:
          "Redis is not configured. Add UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN to .env.local",
      },
      { status: 503 },
    );
  }

  const { searchParams } = request.nextUrl;
  const algorithm = parseAlgorithm(
    searchParams.get("algorithm") ?? request.headers.get("x-algorithm"),
  );
  const clientId =
    searchParams.get("clientId") ??
    request.headers.get("x-client-id") ??
    "default-client";
  const config = parseLimiterConfig(searchParams);

  const limiter = createLimiter(algorithm, config, createRedisClient(redis));
  const result = await limiter.check(clientId);
  const headers = rateLimitHeaders(result);

  if (!result.success) {
    return NextResponse.json(
      {
        error: "Too Many Requests",
        algorithm,
        clientId,
        ...result,
      },
      { status: 429, headers },
    );
  }

  return NextResponse.json(
    {
      message: "Request allowed",
      algorithm,
      clientId,
      ...result,
    },
    { status: 200, headers },
  );
}
