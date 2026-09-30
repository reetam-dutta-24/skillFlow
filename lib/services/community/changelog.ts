import "server-only";
import { prisma } from "@/lib/prisma";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const WEEKS = 12;

export type ChangelogItem = {
  kind: "contribution" | "gap" | "catalog";
  id: string;
  title: string;
  at: string;
};

export type ChangelogWeek = { weekStart: string; items: ChangelogItem[] };

/** Monday 00:00 UTC of the week containing `date`. */
export function weekStart(date: Date): string {
  const copy = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = copy.getUTCDay();
  const mondayOffset = day === 0 ? 6 : day - 1;
  copy.setUTCDate(copy.getUTCDate() - mondayOffset);
  return copy.toISOString().slice(0, 10);
}

/** Merged contributions, resolved gaps, and catalog rows with a verification time. Last 12 weeks. */
export async function nicheChangelog(skillId: string): Promise<ChangelogWeek[]> {
  const since = new Date(Date.now() - WEEKS * WEEK_MS);
  const [contributions, gaps, resources] = await Promise.all([
    prisma.communityContribution.findMany({
      where: { skillId, status: "MERGED", mergedAt: { gte: since } },
      select: { id: true, title: true, mergedAt: true },
      orderBy: { mergedAt: "desc" },
    }),
    prisma.gapReport.findMany({
      where: { skillId, status: "RESOLVED", updatedAt: { gte: since } },
      select: { id: true, title: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.resource.findMany({
      where: { stage: { skillId }, lastVerifiedAt: { gte: since } },
      select: { id: true, title: true, sourceStatus: true, lastVerifiedAt: true },
    }),
  ]);

  const items: ChangelogItem[] = [
    ...contributions.flatMap((row) =>
      row.mergedAt ? [{ kind: "contribution" as const, id: row.id, title: row.title, at: row.mergedAt.toISOString() }] : [],
    ),
    ...gaps.map((row) => ({ kind: "gap" as const, id: row.id, title: row.title, at: row.updatedAt.toISOString() })),
    ...resources.flatMap((row) =>
      row.lastVerifiedAt
        ? [{
            kind: "catalog" as const,
            id: row.id,
            title: row.sourceStatus === "UNAVAILABLE" ? `${row.title} (link unavailable)` : row.title,
            at: row.lastVerifiedAt.toISOString(),
          }]
        : [],
    ),
  ];

  const groups = new Map<string, ChangelogItem[]>();
  for (const item of items) {
    const key = weekStart(new Date(item.at));
    const list = groups.get(key) ?? [];
    list.push(item);
    groups.set(key, list);
  }

  return [...groups.entries()]
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .slice(0, WEEKS)
    .map(([start, weekItems]) => ({
      weekStart: start,
      items: weekItems.sort((a, b) => (a.at < b.at ? 1 : -1)),
    }));
}
