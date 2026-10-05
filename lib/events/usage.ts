import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";

/**
 * Count one API call, or refuse when the period is already at the cap.
 * The update only runs while the stored count is still under the limit.
 */
export async function reserveCall(provider: string, period: string, limit: number): Promise<boolean> {
  const rows = await prisma.$queryRaw<{ count: number }[]>`
    INSERT INTO "ApiUsage" ("id", "provider", "period", "count")
    VALUES (${randomUUID()}, ${provider}, ${period}, 1)
    ON CONFLICT ("provider", "period")
    DO UPDATE SET "count" = "ApiUsage"."count" + 1
    WHERE "ApiUsage"."count" < ${limit}
    RETURNING "count"
  `;
  return rows.length > 0;
}
