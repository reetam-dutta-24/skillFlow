"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/core/Icon.jsx";
import type { CmsNicheRow } from "@/lib/data/catalog-admin";
import { cmsHref } from "./fields";

const FILTERS = [
  { id: "all", label: "All" },
  { id: "free", label: "Free paths" },
  { id: "premium", label: "Premium" },
  { id: "review", label: "Needs review" },
  { id: "soon", label: "Coming soon" },
] as const;

type FilterId = (typeof FILTERS)[number]["id"];

/** Every niche, searchable and filterable, with its counts. The selected one is highlighted. */
export function NicheList({ niches, current }: { niches: CmsNicheRow[]; current: string | null }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterId>("all");
  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return niches.filter((niche) => {
      if (filter === "free" && !niche.free) return false;
      if (filter === "premium" && niche.free) return false;
      if (filter === "review" && niche.needsReview === 0) return false;
      if (filter === "soon" && niche.status !== "COMING_SOON") return false;
      return !needle || niche.name.toLowerCase().includes(needle) || niche.slug.includes(needle);
    });
  }, [niches, query, filter]);

  return (
    <aside className="sf-cms-list" aria-label="Niches">
      <div className="sf-cms-list-head">
        <h2>Niches</h2>
        <Link className="sf-btn sf-btn--gradient sf-btn--sm" href={cmsHref({ create: "niche" })}>
          <Icon name="plus" size={14} /> New niche
        </Link>
      </div>
      <label className="sf-cms-search">
        <Icon name="search" size={15} />
        <span className="sf-sr">Search niches</span>
        <input type="search" value={query} placeholder="Search by name or slug" onChange={(event) => setQuery(event.target.value)} />
      </label>
      <div className="sf-cms-filters" role="group" aria-label="Filter niches">
        {FILTERS.map((item) => (
          <button key={item.id} type="button" aria-pressed={filter === item.id} className={filter === item.id ? "is-on" : undefined} onClick={() => setFilter(item.id)}>
            {item.label}
          </button>
        ))}
      </div>
      <p className="sf-cms-count" aria-live="polite">
        {visible.length} of {niches.length}
      </p>
      <ul className="sf-cms-niches">
        {visible.map((niche) => (
          <li key={niche.id}>
            <Link href={cmsHref({ niche: niche.slug })} aria-current={current === niche.slug ? "page" : undefined}>
              <span className="sf-cms-niche-name">{niche.name}</span>
              <span className="sf-cms-niche-meta">
                <span className={niche.free ? "sf-cms-tag is-free" : "sf-cms-tag"}>{niche.free ? "Free" : "Premium"}</span>
                {niche.status === "COMING_SOON" ? <span className="sf-cms-tag">Soon</span> : null}
                <span>{niche.stages} stages</span>
                {niche.needsReview ? <span className="sf-cms-tag is-warn">{niche.needsReview} to review</span> : null}
              </span>
            </Link>
          </li>
        ))}
        {visible.length === 0 ? <li className="sf-cms-none">No niche matches.</li> : null}
      </ul>
    </aside>
  );
}
