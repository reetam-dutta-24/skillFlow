import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { loadCatalog } from "@/lib/data/catalog";
import { loadMapCities, mapMinLearners } from "@/lib/data/learner-map";
import { MapCanvas } from "@/app/(app)/map/_components/MapCanvas";
import { NicheFilter } from "@/app/(app)/map/_components/NicheFilter";
import { NearbyTabs } from "./_components/NearbyTabs";
import "maplibre-gl/dist/maplibre-gl.css";

export const metadata: Metadata = { title: "Nearby" };

function learnerLabel(count: number) {
  return count === 1 ? "1 learner" : `${count} learners`;
}

export default function NearbyPage({ searchParams }: { searchParams: Promise<{ niche?: string }> }) {
  return (
    <div className="sf-map-page">
      <Suspense fallback={<p className="sf-review-live">Loading the map</p>}>
        <MapBody searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function MapBody({ searchParams }: { searchParams: Promise<{ niche?: string }> }) {
  const { niche } = await searchParams;
  const catalog = await loadCatalog();
  const niches = catalog
    .map((entry) => ({
      slug: entry.skill.slug,
      name: entry.skill.name,
      followed: entry.skill.followed,
    }))
    .sort((a, b) => Number(b.followed) - Number(a.followed) || a.name.localeCompare(b.name));
  const active = niches.some((entry) => entry.slug === niche) ? (niche ?? null) : null;
  const cities = await loadMapCities(active);
  const minimum = mapMinLearners();
  const top = cities.slice(0, 10);

  return (
    <>
      <NearbyTabs tab="learners" niche={active} />
      <header className="sf-page-head">
        <h1>Learner map</h1>
        <p>Cities where learners chose to be counted. No names, and no pin for one person.</p>
      </header>
      <NicheFilter niches={niches} active={active} basePath="/nearby" />
      <div className="sf-map-layout">
        <MapCanvas cities={cities} />
        <section className="sf-map-panel" aria-label="Top cities">
          <h2>Top cities</h2>
          {top.length === 0 ? (
            <div className="sf-map-empty">
              <p>
                {minimum === 1
                  ? "Nothing here yet. Add a city in Settings and turn on “Show me on the learner map”."
                  : `Nothing here yet. A city appears once ${minimum} learners there turn on “Show me on the learner map”.`}
              </p>
              <Link href="/settings">Add your city</Link>
            </div>
          ) : (
            <ol className="sf-map-cities">
              {top.map((city) => (
                <li key={`${city.city}|${city.country}`}>
                  <strong>{city.city}</strong>
                  <span>{city.country}</span>
                  <em>{learnerLabel(city.count)}</em>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </>
  );
}
