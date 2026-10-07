"use client";

import { useMemo, useRef, useState } from "react";
import { SkillImage } from "@/components/core/SkillImage";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Icon } from "@/components/core/Icon.jsx";
import { EmptyState } from "@/components/feedback/EmptyState.jsx";
import { FollowNicheButton } from "./FollowNicheButton";
import { useFollowedSkill } from "./followed-context";
import { NICHE_PAGE_SIZE, NICHE_TEASER_CLEAR, NICHE_TEASER_PEEK } from "./niche-layout";
import { nicheCardHref } from "@/lib/billing/niche-link";
import { usePremiumAccess } from "../../_components/premium-access";

const FILTERS = [
  { id: "all", label: "All" },
  { id: "open", label: "Open" },
  { id: "care", label: "Care" },
  { id: "money", label: "Money" },
  { id: "home", label: "Home" },
  { id: "language", label: "Language" },
  { id: "games", label: "Games" },
  { id: "craft", label: "Craft" },
  { id: "future", label: "Future" },
  { id: "mind", label: "Mind" },
] as const;

type FilterId = (typeof FILTERS)[number]["id"];

export type BrowseSkill = {
  id: string;
  name: string;
  description: string;
  status: "available" | "coming_soon";
  offer: "FREE" | "MONETIZED";
  slug: string;
  followed: boolean;
  stageCount: number;
  image: string | null;
  href: string | null;
  communityHref?: string | null;
  group: string;
  tags: string[];
};

const EASE = [0.22, 1, 0.36, 1] as const;

function matches(skill: BrowseSkill, query: string, filter: FilterId) {
  if (filter === "open" && (skill.status !== "available" || skill.offer !== "FREE")) return false;
  if (filter !== "all" && filter !== "open" && skill.group !== filter) return false;
  const haystack = `${skill.name} ${skill.description} ${skill.tags.join(" ")}`.toLowerCase();
  return query
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((token) => haystack.includes(token));
}

export function SkillBrowse({ skills, mode = "page" }: { skills: BrowseSkill[]; mode?: "page" | "teaser" }) {
  const premium = usePremiumAccess();
  const reduce = useReducedMotion();
  const resultsRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterId>("all");
  const [page, setPage] = useState(1);
  const filtered = useMemo(() => skills.filter((skill) => matches(skill, query, filter)), [skills, query, filter]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / NICHE_PAGE_SIZE));
  const current = Math.min(page, pageCount);
  const start = (current - 1) * NICHE_PAGE_SIZE;
  const visible = mode === "page" ? filtered.slice(start, start + NICHE_PAGE_SIZE) : skills.slice(0, NICHE_TEASER_CLEAR);
  const peek = mode === "teaser" ? skills.slice(NICHE_TEASER_CLEAR, NICHE_TEASER_CLEAR + NICHE_TEASER_PEEK) : [];

  function search(value: string) {
    setQuery(value);
    setPage(1);
    resultsRef.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "nearest" });
  }

  function goTo(next: number) {
    setPage(next);
    resultsRef.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "nearest" });
  }

  if (mode === "teaser") {
    return (
      <div className="sf-niche-teaser">
        <ul className="sf-browse-grid">
          {visible.map((skill, index) => (
            <li key={skill.id}>
              <SkillCard skill={skill} eager={index === 0} />
            </li>
          ))}
        </ul>
        {peek.length > 0 ? (
          <div className="sf-niche-peek" aria-hidden="true">
            <ul className="sf-browse-grid" inert>
              {peek.map((skill) => (
                <li key={skill.id}>
                  <SkillCard skill={skill} preview />
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        <p className="sf-niche-explore">
          <Link href="/skills">Explore all the niches</Link>
        </p>
      </div>
    );
  }

  const rangeStart = filtered.length === 0 ? 0 : start + 1;
  const rangeEnd = Math.min(start + NICHE_PAGE_SIZE, filtered.length);

  return (
    <div className="sf-browse-body">
      <div className="sf-browse-tools">
        <div className="sf-browse-search">
          <label>
            <Icon name="search" size={16} />
            <span className="sf-sr">Search niches</span>
            <input
              type="search"
              value={query}
              placeholder="Search a name, a topic, or a tag"
              onChange={(event) => search(event.target.value)}
            />
          </label>
          {query ? (
            <button type="button" onClick={() => search("")}>
              Clear
            </button>
          ) : null}
        </div>
        <div className="sf-browse-filters" role="group" aria-label="Filter niches">
          {FILTERS.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={filter === item.id}
              className={filter === item.id ? "is-on" : undefined}
              onClick={() => {
                setFilter(item.id);
                setPage(1);
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
      <p className="sf-browse-count" aria-live="polite">
        {filtered.length === 0
          ? `0 of ${skills.length} match`
          : filtered.length === skills.length
            ? `Showing ${rangeStart}–${rangeEnd} of ${skills.length}`
            : `Showing ${rangeStart}–${rangeEnd} of ${filtered.length} matches`}
      </p>
      <div ref={resultsRef}>
        {filtered.length === 0 ? (
          <EmptyState
            compact
            icon="search"
            title="No niche matches"
            description="Try another filter, or a shorter word."
          />
        ) : (
          <motion.ul className="sf-browse-grid" layout>
            <AnimatePresence mode="popLayout">
              {visible.map((skill, index) => (
                <motion.li
                  key={skill.id}
                  layout
                  initial={reduce ? false : { opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduce ? { opacity: 0 } : { opacity: 0, y: 8 }}
                  transition={reduce ? { duration: 0 } : { duration: 0.32, delay: Math.min(index, 6) * 0.04, ease: EASE }}
                  whileHover={reduce || !nicheCardHref({ ...skill, premium }) ? undefined : { y: -6 }}
                >
                  <SkillCard skill={skill} eager={current === 1 && index === 0} />
                </motion.li>
              ))}
            </AnimatePresence>
          </motion.ul>
        )}
        {filtered.length > NICHE_PAGE_SIZE ? (
          <nav className="sf-browse-pages" aria-label="Niche pages">
            <button type="button" onClick={() => goTo(current - 1)} disabled={current === 1}>
              Previous
            </button>
            {Array.from({ length: pageCount }, (_, index) => {
              const number = index + 1;
              return (
                <button
                  key={number}
                  type="button"
                  aria-current={number === current ? "page" : undefined}
                  aria-label={`Page ${number}`}
                  onClick={() => goTo(number)}
                >
                  {number}
                </button>
              );
            })}
            <button type="button" onClick={() => goTo(current + 1)} disabled={current === pageCount}>
              Next
            </button>
          </nav>
        ) : null}
      </div>
    </div>
  );
}

/** `eager` loads the photo at once: the first card is often the largest paint on a phone. */
function SkillCard({ skill, preview = false, eager = false }: { skill: BrowseSkill; preview?: boolean; eager?: boolean }) {
  const premium = usePremiumAccess();
  const followed = useFollowedSkill(skill.id, skill.followed);
  const view = followed === skill.followed ? skill : { ...skill, followed };
  const canFollow = !preview && view.status === "available" && (view.offer === "FREE" || premium);
  const href = nicheCardHref({ ...view, preview, premium });
  const body = (
    <>
      {view.image ? (
        <span className="sf-skill-tile-photo">
          <SkillImage src={view.image} alt="" fill sizes="(max-width: 640px) 100vw, 280px" loading={eager ? "eager" : undefined} />
        </span>
      ) : (
        <span className="sf-skill-tile-photo sf-skill-tile-fallback" data-initial={view.name.charAt(0)} aria-hidden="true" />
      )}
      <span className="sf-skill-tile-shade" aria-hidden="true" />
      <span className="sf-skill-tile-copy">
        <span className="sf-skill-tile-kicker">
          {view.status === "coming_soon"
            ? "Coming soon"
            : view.offer === "FREE"
              ? view.stageCount
                ? `Free · ${view.stageCount} stages`
                : "Free"
              : "Premium"}
        </span>
        <strong>{view.name}</strong>
        {view.description ? <span>{view.description}</span> : null}
        {!href && view.communityHref ? (
          <Link href={view.communityHref} className="sf-skill-os">
            Open Source
          </Link>
        ) : null}
        {href === "/upgrade" ? (
          <span className="sf-skill-upgrade">
            <Icon name="lock" size={13} />
            Upgrade to open
          </span>
        ) : null}
      </span>
    </>
  );

  return (
    <article className={href ? "sf-skill-tile" : "sf-skill-tile is-soon"}>
      {href && !preview ? (
        <Link className="sf-skill-tile-hit" href={href}>
          {body}
        </Link>
      ) : (
        body
      )}
      {canFollow ? <FollowNicheButton skillId={view.id} followed={followed} name={view.name} /> : null}
    </article>
  );
}
