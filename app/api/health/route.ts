import { connection, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const TIMEOUT_MS = 2000;

async function databaseUp(): Promise<boolean> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    await Promise.race([
      prisma.$queryRaw`SELECT 1`,
      new Promise((_, reject) => { timer = setTimeout(() => reject(new Error("timeout")), TIMEOUT_MS); }),
    ]);
    return true;
  } catch {
    return false; // never send the real error to the caller
  } finally {
    clearTimeout(timer);
  }
}

export async function GET() {
  await connection(); // run on every request; never prerender at build time
  const started = Date.now();
  const db = (await databaseUp()) ? "ok" : "down";
  const healthy = db === "ok";

  return NextResponse.json(
    {
      status: healthy ? "ok" : "unhealthy",
      db,
      latencyMs: Date.now() - started,
      uptimeSeconds: Math.round(process.uptime()),
      commit: process.env.GIT_SHA ?? "dev", // CI sets this later, so you can see which version is live
    },
    { status: healthy ? 200 : 503, headers: { "Cache-Control": "no-store" } },
  );
}