import { rateLimit } from "@/lib/rate-limit";

// Every limit in one place, so the numbers are easy to find and change.

/** 5 tries per email and 30 per IP every 15 minutes. Blocks if Redis is down. */
export async function loginAllowed(email: string, ip: string): Promise<boolean> {
  const [byEmail, byIp] = await Promise.all([
    rateLimit({ name: "login-email", id: email, limit: 5, windowSeconds: 15 * 60, failClosed: true }),
    rateLimit({ name: "login-ip", id: ip, limit: 30, windowSeconds: 15 * 60, failClosed: true }),
  ]);
  return byEmail.ok && byIp.ok;
}

/** 5 new accounts per IP an hour. */
export async function signupAllowed(ip: string): Promise<boolean> {
  return (await rateLimit({ name: "signup", id: ip, limit: 5, windowSeconds: 60 * 60 })).ok;
}

/** Every AI call (explain-back, practice, recall, summaries): 10 a minute and 200 a day per learner. */
export async function aiAllowed(userId: string): Promise<boolean> {
  const minute = await rateLimit({ name: "ai-minute", id: userId, limit: 10, windowSeconds: 60 });
  if (!minute.ok) return false;
  return (await rateLimit({ name: "ai-day", id: userId, limit: 200, windowSeconds: 24 * 60 * 60 })).ok;
}

/** 20 uploads an hour per learner. */
export async function uploadAllowed(userId: string): Promise<boolean> {
  return (await rateLimit({ name: "upload", id: userId, limit: 20, windowSeconds: 60 * 60 })).ok;
}

/** The visitor's IP. Caddy sets X-Forwarded-For in production. */
export function clientIp(headers: Headers): string {
  return headers.get("x-forwarded-for")?.split(",")[0]?.trim() || headers.get("x-real-ip") || "unknown";
}