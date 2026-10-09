import { getRedis } from "@/lib/redis";

export type RateLimitResult = { ok: boolean; remaining: number; retryAfterSeconds: number };

type Options = {
  /** What is limited, e.g. "login" or "explain". */
  name: string;
  /** Who is limited, e.g. an email, a user id or an IP. */
  id: string;
  limit: number;
  windowSeconds: number;
  /** When Redis is down: true = block (login), false = allow (everything else). */
  failClosed?: boolean;
};

/** Fixed-window counter: at most `limit` calls per `windowSeconds` for each name + id. */
export async function rateLimit({ name, id, limit, windowSeconds, failClosed = false }: Options): Promise<RateLimitResult> {
  const now = Math.floor(Date.now() / 1000);
  const window = Math.floor(now / windowSeconds);
  const retryAfterSeconds = (window + 1) * windowSeconds - now;

  const redis = getRedis();
  if (!redis) return { ok: true, remaining: limit, retryAfterSeconds: 0 }; // no Redis configured (local dev)

  const key = `rl:${name}:${id.toLowerCase()}:${window}`;
  try {
    const result = await redis.multi().incr(key).expire(key, windowSeconds).exec();
    const count = Number(result?.[0]?.[1] ?? 0);
    return { ok: count <= limit, remaining: Math.max(0, limit - count), retryAfterSeconds };
  } catch {
    return failClosed
      ? { ok: false, remaining: 0, retryAfterSeconds: 30 }
      : { ok: true, remaining: limit, retryAfterSeconds: 0 };
  }
}