import { NextResponse } from "next/server";
import { refreshPopularPairs } from "@/lib/events/refresh";

/** Scheduled refresh. Send `Authorization: Bearer <CRON_SECRET>`. */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const header = request.headers.get("authorization");
  if (!secret || header !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const refreshed = await refreshPopularPairs();
  return NextResponse.json({ refreshed });
}
