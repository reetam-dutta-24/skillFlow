import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { EVENTS_TAG } from "@/lib/cache/tags";
import type { StoredEvent } from "@/lib/events/select";
import { listedSources } from "@/lib/events/sources";
import { prisma } from "@/lib/prisma";

const HORIZON_MS = 92 * 24 * 60 * 60 * 1000;

async function queryUpcoming(skillSlug: string | null): Promise<StoredEvent[]> {
  const sources = listedSources().map((source) => source.id);
  const skill = skillSlug
    ? await prisma.skill.findUnique({ where: { slug: skillSlug }, select: { id: true } })
    : null;
  if (skillSlug && !skill) return [];

  const now = new Date();
  const rows = await prisma.event.findMany({
    where: {
      status: "APPROVED",
      source: { in: sources },
      startsAt: { gte: now, lte: new Date(now.getTime() + HORIZON_MS) },
      ...(skill ? { skillId: skill.id } : {}),
    },
    orderBy: { startsAt: "asc" },
    take: 300,
    select: {
      id: true,
      title: true,
      startsAt: true,
      venueName: true,
      city: true,
      url: true,
      isOnline: true,
      source: true,
      lat: true,
      lng: true,
      skill: { select: { name: true } },
    },
  });

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    startsAt: row.startsAt,
    venueName: row.venueName,
    city: row.city,
    url: row.url,
    isOnline: row.isOnline,
    source: row.source,
    niche: row.skill.name,
    lat: row.lat,
    lng: row.lng,
  }));
}

/** Production copy of upcoming events for a niche. The same list for every visitor. */
async function loadCachedUpcoming(skillSlug: string | null): Promise<StoredEvent[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(EVENTS_TAG);
  return queryUpcoming(skillSlug);
}

/**
 * Approved upcoming events. A missing API key leaves that source out.
 * Development reads the database directly so a refresh shows up on the next request.
 */
export async function loadUpcomingEvents(skillSlug: string | null): Promise<StoredEvent[]> {
  if (process.env.NODE_ENV !== "production") return queryUpcoming(skillSlug);
  return loadCachedUpcoming(skillSlug);
}
