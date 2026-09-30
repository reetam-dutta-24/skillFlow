"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/core/Button.jsx";
import { SkillImage } from "@/components/core/SkillImage";
import { joinCommunityAction, leaveCommunityAction } from "../actions";

export type RailNiche = {
  id: string;
  slug: string;
  name: string;
  image: string | null;
  status: "available" | "coming_soon";
  followed: boolean;
  joined: boolean;
  news: number;
};

function feedHref(slugs: string[] | null, sort: string, type: string) {
  const params = new URLSearchParams();
  if (slugs) params.set("niches", slugs.join(","));
  if (sort === "useful") params.set("sort", "useful");
  if (type) params.set("type", type);
  const text = params.toString();
  return text ? `/open-source?${text}` : "/open-source";
}

export function NicheRail({
  niches,
  selected,
  custom,
  sort,
  type,
}: {
  niches: RailNiche[];
  selected: string[];
  custom: boolean;
  sort: string;
  type: string;
}) {
  const [query, setQuery] = useState("");
  const bySlug = useMemo(() => new Map(niches.map((niche) => [niche.slug, niche])), [niches]);
  const selectedNiches = selected.flatMap((slug) => {
    const niche = bySlug.get(slug);
    return niche ? [niche] : [];
  });
  const selectedSet = new Set(selected);
  const waiting = niches.filter((niche) => niche.followed && !selectedSet.has(niche.slug));
  const matches = query.trim()
    ? niches.filter((niche) => niche.name.toLowerCase().includes(query.trim().toLowerCase())).slice(0, 8)
    : [];

  return (
    <div className="sf-os-picker">
      <label className="sf-os-search">
        Search any niche
        <input type="search" value={query} placeholder="A niche you follow, or any other" onChange={(event) => setQuery(event.target.value)} />
      </label>

      {custom ? (
        <p className="sf-os-reset">
          <Link href={feedHref(null, sort, type)}>Show the niches you follow</Link>
        </p>
      ) : null}

      {matches.length > 0 ? (
        <section>
          <h2>Search</h2>
          <ul className="sf-os-niche-list">
            {matches.map((niche) => (
              <NicheRow
                key={`search-${niche.slug}`}
                niche={niche}
                inFeed={selectedSet.has(niche.slug)}
                href={feedHref(selectedSet.has(niche.slug) ? selected.filter((slug) => slug !== niche.slug) : [...selected, niche.slug], sort, type)}
              />
            ))}
          </ul>
        </section>
      ) : null}

      <section>
        <h2>In this feed</h2>
        {selectedNiches.length === 0 ? (
          <p>No niche is selected. Search for one, or show the niches you follow.</p>
        ) : (
          <ul className="sf-os-niche-list">
            {selectedNiches.map((niche) => (
              <NicheRow key={niche.slug} niche={niche} inFeed href={feedHref(selected.filter((slug) => slug !== niche.slug), sort, type)} />
            ))}
          </ul>
        )}
      </section>

      {!query.trim() && waiting.length > 0 ? (
        <section>
          <h2>Also followed</h2>
          <ul className="sf-os-niche-list">
            {waiting.map((niche) => (
              <NicheRow key={niche.slug} niche={niche} inFeed={false} href={feedHref([...selected, niche.slug], sort, type)} />
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

function NicheRow({ niche, inFeed, href }: { niche: RailNiche; inFeed: boolean; href: string }) {
  return (
    <li className="sf-os-niche-row">
      <Link className="sf-os-niche-id" href={`/open-source/${niche.slug}`}>
        {niche.image ? <SkillImage src={niche.image} alt="" width={44} height={44} /> : <span className="sf-os-thumb-fallback" aria-hidden="true" />}
        <span>
          <strong>{niche.name}</strong>
          <span>
            {niche.status === "coming_soon" ? "Coming soon" : "Available"}
            {niche.followed ? " · Followed" : ""}
            {niche.news > 0 ? ` · ${niche.news} new` : ""}
          </span>
        </span>
      </Link>
      <span className="sf-os-niche-actions">
        <Link className={inFeed ? "sf-os-toggle is-remove" : "sf-os-toggle"} href={href}>
          {inFeed ? "Remove" : "Add"}
        </Link>
        <form action={niche.joined ? leaveCommunityAction : joinCommunityAction}>
          <input type="hidden" name="skillId" value={niche.id} />
          <Button type="submit" size="sm" variant={niche.joined ? "outline" : "gradient"}>
            {niche.joined ? "Leave" : "Join"}
          </Button>
        </form>
      </span>
    </li>
  );
}
