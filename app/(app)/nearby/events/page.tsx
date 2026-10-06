import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { loadCatalog } from "@/lib/data/catalog";
import { loadUpcomingEvents } from "@/lib/data/events";
import { canUseLiveSearch } from "@/lib/events/access";
import { parseDateRange, parseDistance } from "@/lib/events/config";
import { rangeEnd, selectEvents } from "@/lib/events/select";
import { scheduleRefreshIfStale } from "@/lib/events/refresh";
import { listedSources } from "@/lib/events/sources";
import { prisma } from "@/lib/prisma";
import { communityActor } from "@/lib/services/community/actor";
import { reviewableSkillIds } from "@/lib/services/community/permissions";
import { NicheFilter } from "@/app/(app)/map/_components/NicheFilter";
import { EventFilters } from "../_components/EventFilters";
import { EventsBoard, OnlineEventList } from "../_components/EventsBoard";
import { LiveSearch, PremiumCard } from "../_components/LiveSearch";
import { NearbyTabs } from "../_components/NearbyTabs";
import "maplibre-gl/dist/maplibre-gl.css";

export const metadata: Metadata = { title: "Nearby events" };

export default function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ niche?: string; when?: string; km?: string }>;
}) {
  return (
    <div className="sf-map-page">
      <Suspense fallback={<p className="sf-review-live">Loading events</p>}>
        <EventsBody searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function EventsBody({
  searchParams,
}: {
  searchParams: Promise<{ niche?: string; when?: string; km?: string }>;
}) {
  const params = await searchParams;
  const session = await auth();
  if (!session?.user?.id) return null;

  const catalog = await loadCatalog();
  const niches = catalog
    .map((entry) => ({
      slug: entry.skill.slug,
      name: entry.skill.name,
      followed: entry.skill.followed,
    }))
    .sort((a, b) => Number(b.followed) - Number(a.followed) || a.name.localeCompare(b.name));
  const active = niches.some((entry) => entry.slug === params.niche) ? (params.niche ?? null) : null;
  const when = parseDateRange(params.when);
  const km = parseDistance(params.km);

  const profile = await prisma.learnerProfile.findUnique({
    where: { userId: session.user.id },
    select: { city: true, country: true, lat: true, lng: true },
  });
  const origin =
    profile?.city && profile.country && profile.lat != null && profile.lng != null
      ? { city: profile.city, country: profile.country, lat: profile.lat, lng: profile.lng }
      : null;

  if (origin) {
    const targets = (
      active ? catalog.filter((entry) => entry.skill.slug === active) : catalog.filter((entry) => entry.skill.followed)
    ).slice(0, 3);
    for (const entry of targets) {
      await scheduleRefreshIfStale({
        skillId: entry.skill.id,
        slug: entry.skill.slug,
        name: entry.skill.name,
        city: origin.city,
        country: origin.country,
        lat: origin.lat,
        lng: origin.lng,
      });
    }
  }

  const now = new Date();
  const stored = await loadUpcomingEvents(active);
  const { local, online } = selectEvents(stored, {
    origin,
    km,
    now,
    until: rangeEnd(now, when),
  });
  const sources = listedSources();
  const actor = await communityActor(session.user.id);
  const reviewable = actor ? reviewableSkillIds(actor) : [];
  const canReview = reviewable === "all" || reviewable.length > 0;

  return (
    <>
      <NearbyTabs tab="events" niche={active} />
      <header className="sf-page-head">
        <h1>Events</h1>
        <p>Upcoming events near the city you saved. Links only — nothing here books a ticket.</p>
      </header>
      <div className="sf-event-toolbar">
        <NicheFilter
          niches={niches}
          active={active}
          basePath="/nearby/events"
          preserve={{ when, km: origin ? String(km) : undefined }}
        />
        <EventFilters niche={active} when={when} km={km} showDistance={Boolean(origin)} />
      </div>
      <p className="sf-event-sources">Connected sources: {sources.map((source) => source.label).join(", ")}</p>
      <p className="sf-event-links">
        <Link href="/nearby/submit">Submit an event</Link>
        {canReview ? <Link href="/nearby/review">Review events</Link> : null}
      </p>
      {origin ? null : (
        <section className="sf-event-card">
          <h2>Add a city to see events near you</h2>
          <p>Nearby uses the city you save in Settings. It never uses your device location.</p>
          <Link href="/settings">Open Settings</Link>
        </section>
      )}
      <EventsBoard
        events={local}
        origin={origin ? { lat: origin.lat, lng: origin.lng, zoom: 12 } : null}
        empty={origin ? "No events in this range." : "In-person events show up once a city is saved."}
      />
      <OnlineEventList events={online} />
      {canUseLiveSearch(session.user.role) ? <LiveSearch city={origin?.city ?? null} /> : <PremiumCard />}
    </>
  );
}
