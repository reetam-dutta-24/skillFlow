import { Redis } from "ioredis";

const globalForRedis = globalThis as unknown as { redis?: Redis };

/**
 * One shared Redis connection, created on first use (never during `next build`).
 * Returns null when REDIS_URL is not set, so local dev works without Redis.
 */
export function getRedis(): Redis | null {
  const url = process.env.REDIS_URL;
  if (!url) return null;
  if (!globalForRedis.redis) {
    const client = new Redis(url, {
      maxRetriesPerRequest: 1, // don't keep retrying one command
      commandTimeout: 500, // a slow Redis must never slow down a page
      connectTimeout: 2000,
    });
    client.on("error", (err) => console.warn("[redis]", err.message));
    globalForRedis.redis = client;
  }
  return globalForRedis.redis;
}