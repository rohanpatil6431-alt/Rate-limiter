import { NextRequest, NextResponse } from "next/server";
import {
  createRedisClient,
  getRedis,
  resetAllLimitKeys,
  resetClientKeys,
} from "@/lib/limiters/redis";

export async function POST(request: NextRequest) {
  const redis = getRedis();

  if (!redis) {
    return NextResponse.json(
      { error: "Redis is not configured" },
      { status: 503 },
    );
  }

  const client = createRedisClient(redis);
  let body: { clientIds?: string[] } = {};

  try {
    body = await request.json();
  } catch {
    // Empty body resets all keys.
  }

  const deleted =
    body.clientIds && body.clientIds.length > 0
      ? (
          await Promise.all(
            body.clientIds.map((clientId) => resetClientKeys(client, clientId)),
          )
        ).reduce((sum, count) => sum + count, 0)
      : await resetAllLimitKeys(client);

  return NextResponse.json({
    message: "Rate limit state cleared",
    deletedKeys: deleted,
  });
}
