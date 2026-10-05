import "server-only";
import { after } from "next/server";
import type { EventSource } from "@prisma/client";
import { invalidateEvents } from "@/lib/cache/invalidate";
import { cityKey, cronPairLimit, isFetchStale } from "@/lib/events/config";
import { keywordsFor } from "@/lib/events/keywords";
import { connectedApiSources } from "@/lib/events/sources";
import type { EventQuery, EventSourceAdapter, NormalizedEvent } from "@/lib/events/sources/types";
import { prisma } from "@/lib/prisma";

const HORIZON_DAYS = 92;

export type RefreshPair = {
  skillId: string;
  slug: string;
  name: string;
  city: string;
  country: string;
  lat: number;
  lng: number;
};

function queryFor(pair: RefreshPair, keywords: string[]): EventQuery {
  const from = new Date();
  return {
    keywords,
    city: pair.city,
    country: pair.country,
    lat: pair.lat,
    lng: pair.lng,
    radiusKm: 200,
    from,
    to: new Date(from.getTime() + HORIZON_DAYS * 24 * 60 * 60 * 1000),
  };
}

async function saveEvents(skillId: string, source: EventSource, events: NormalizedEvent[]) {
  const fetchedAt = new Date();
  for (const event of events) {
    const data = {
      title: event.title,
      description: event.description,
      startsAt: event.startsAt,
      endsAt: event.endsAt,
      venueName: event.venueName,
      address: event.address,
      city: event.city,
      countryCode: event.countryCode,
      lat: event.lat,
      lng: event.lng,
      url: event.url,
      imageUrl: event.imageUrl,
      isOnline: event.isOnline,
      status: "APPROVED" as const,
      fetchedAt,
    };
    await prisma.event.upsert({
      where: { source_externalId_skillId: { source, externalId: event.externalId, skillId } },
      create: { ...data, source, externalId: event.externalId, skillId },
      update: data,
    });
  }
}

async function refreshSource(pair: RefreshPair, source: EventSourceAdapter, query: EventQuery): Promise<boolean> {
  const key = cityKey(pair.city, pair.country);
  const existing = await prisma.eventFetch.findUnique({
    where: { skillId_cityKey_source: { skillId: pair.skillId, cityKey: key, source: source.id } },
  });
  if (existing && !isFetchStale(existing.fetchedAt)) return false;

  const result = await source.search(query);
  if (result.ok) await saveEvents(pair.skillId, source.id, result.events);
  await prisma.eventFetch.upsert({
    where: { skillId_cityKey_source: { skillId: pair.skillId, cityKey: key, source: source.id } },
    create: {
      skillId: pair.skillId,
      cityKey: key,
      source: source.id,
      resultCount: result.ok ? result.events.length : 0,
      ok: result.ok,
      error: result.ok ? null : result.error,
    },
    update: {
      fetchedAt: new Date(),
      resultCount: result.ok ? result.events.length : 0,
      ok: result.ok,
      error: result.ok ? null : result.error,
    },
  });
  return true;
}

/** Read the APIs for one city and niche, at most once per source inside the TTL. */
export async function refreshPair(pair: RefreshPair): Promise<void> {
  const sources = connectedApiSources();
  if (sources.length === 0) return;
  const query = queryFor(pair, keywordsFor(pair.slug, pair.name));
  let refreshed = false;
  for (const source of sources) {
    try {
      const did = await refreshSource(pair, source, query);
      refreshed = refreshed || did;
    } catch {
      // A failed write must not take the page down. The next visit can try again.
    }
  }
  if (refreshed) invalidateEvents();
}

/** Start a refresh after the page has responded, when the saved copy is older than the TTL. */
export async function scheduleRefreshIfStale(pair: RefreshPair): Promise<void> {
  const sources = connectedApiSources();
  if (sources.length === 0) return;
  const key = cityKey(pair.city, pair.country);
  const rows = await prisma.eventFetch.findMany({
    where: { skillId: pair.skillId, cityKey: key, source: { in: sources.map((source) => source.id) } },
    select: { source: true, fetchedAt: true },
  });
  const stale = sources.some((source) => {
    const row = rows.find((item) => item.source === source.id);
    return !row || isFetchStale(row.fetchedAt);
  });
  if (!stale) return;
  after(() => {
    void refreshPair(pair);
  });
}

/** Refresh the city and niche pairs the most learners have saved. For the cron route. */
export async function refreshPopularPairs(): Promise<number> {
  const limit = cronPairLimit();
  const profiles = await prisma.learnerProfile.findMany({
    where: { city: { not: null }, country: { not: null }, lat: { not: null }, lng: { not: null } },
    select: {
      city: true,
      country: true,
      lat: true,
      lng: true,
      user: {
        select: { skillProgress: { select: { skill: { select: { id: true, slug: true, name: true } } } } },
      },
    },
  });

  const counts = new Map<string, { pair: RefreshPair; count: number }>();
  for (const profile of profiles) {
    if (!profile.city || !profile.country || profile.lat == null || profile.lng == null) continue;
    for (const progress of profile.user.skillProgress) {
      const skill = progress.skill;
      const key = `${cityKey(profile.city, profile.country)}|${skill.id}`;
      const current = counts.get(key);
      if (current) {
        current.count += 1;
      } else {
        counts.set(key, {
          count: 1,
          pair: {
            skillId: skill.id,
            slug: skill.slug,
            name: skill.name,
            city: profile.city,
            country: profile.country,
            lat: profile.lat,
            lng: profile.lng,
          },
        });
      }
    }
  }

  const pairs = [...counts.values()].sort((a, b) => b.count - a.count).slice(0, limit);
  for (const entry of pairs) await refreshPair(entry.pair);
  return pairs.length;
}
