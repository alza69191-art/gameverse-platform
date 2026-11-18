import "server-only";
import { createHmac } from "node:crypto";
import { NextRequest } from "next/server";
import { getDbPool } from "@/lib/db";

function keyFor(scope: string, identifier: string) {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) throw new Error("SESSION_SECRET is not configured");
  return createHmac("sha256", secret).update(`${scope}:${identifier}`).digest("hex");
}

export async function consumeRateLimit(scope: string, identifier: string, maxHits: number, windowSeconds: number) {
  const pool = getDbPool();
  const bucketKey = keyFor(scope, identifier);
  const cutoff = new Date(Date.now() - windowSeconds * 1000);
  await pool.execute(
    "INSERT INTO rate_limit_buckets (bucket_key, window_start, hits) VALUES (?, CURRENT_TIMESTAMP, 1) ON DUPLICATE KEY UPDATE hits = IF(window_start < ?, 1, hits + 1), window_start = IF(window_start < ?, CURRENT_TIMESTAMP, window_start)",
    [bucketKey, cutoff, cutoff]
  );
  const [rows] = await pool.execute("SELECT hits FROM rate_limit_buckets WHERE bucket_key = ? LIMIT 1", [bucketKey]);
  const hits = Number((rows as Array<{hits:number}>)[0]?.hits ?? maxHits + 1);
  return { allowed: hits <= maxHits, remaining: Math.max(0, maxHits - hits) };
}

export function requestIpKey(request: NextRequest) {
  const direct = request.headers.get("x-real-ip");
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return direct || forwarded || "unknown";
}
