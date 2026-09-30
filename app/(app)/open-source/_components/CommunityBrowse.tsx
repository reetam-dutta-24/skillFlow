"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { SkillImage } from "@/components/core/SkillImage";
import { Icon } from "@/components/core/Icon.jsx";
import { EmptyState } from "@/components/feedback/EmptyState.jsx";
import { NICHE_PAGE_SIZE } from "@/app/(app)/skills/_components/niche-layout";

const FILTERS = [
  { id: "all", label: "All" },
  { id: "available", label: "Available" },
  { id: "coming_soon", label: "Coming soon" },
  { id: "joined", label: "Joined" },
] as const;

type FilterId = (typeof FILTERS)[number]["id"];

export type CommunityCard = {
  id: string;
  slug: string;
  name: string;
  description: string;
  image: string | null;
  status: "available" | "coming_soon";
  members: number;
  merged: number;
  openGaps: number;
  joined: boolean;
  news: number;
};

const EASE = [0.22, 1, 0.36, 1] as const;

function matches(skill: CommunityCard, query: string, filter: FilterId) {
  if (filter === "available" && skill.status !== "available") return false;
  if (filter === "coming_soon" && skill.status !== "coming_soon") return false;
  if (filter === "joined" && !skill.joined) return false;
  const haystack = `${skill.name} ${skill.description}`.toLowerCase();
  return query
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((token) => haystack.includes(token));
}

export function CommunityBrowse({ skills }: { skills: CommunityCard[] }) {
  const reduce = useReducedMotion();
  const resultsRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterId>("all");
  const [page, setPage] = useState(1);
  const ordered = useMemo(() => [...skills].sort((a, b) => Number(b.joined) - Number(a.joined)), [skills]);
  const filtered = useMemo(() => ordered.filter((skill) => matches(skill, query, filter)), [ordered, query, filter]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / NICHE_PAGE_SIZE));
  const current = Math.min(page, pageCount);
  const start = (current - 1) * NICHE_PAGE_SIZE;
  const visible = filtered.slice(start, start + NICHE_PAGE_SIZE);
  const rangeStart = filtered.length === 0 ? 0 : start + 1;
  const rangeEnd = Math.min(start + NICHE_PAGE_SIZE, filtered.length);

  function search(value: string) {
    setQuery(value);
    setPage(1);
    resultsRef.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "nearest" });
  }

  function goTo(next: number) {
    setPage(next);
    resultsRef.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "nearest" });
  }

  return (
    <div className="sf-browse-body">
      <div className="sf-browse-tools">
        <div className="sf-browse-search">
          <label>
            <Icon name="search" size={16} />
            <span className="sf-sr">Search communities</span>
            <input
              type="search"
              value={query}
              placeholder="Search a community"
              onChange={(event) => search(event.target.value)}
            />
          </label>
          {query ? (
            <button type="button" onClick={() => search("")}>
              Clear
            </button>
          ) : null}
        </div>
        <div className="sf-browse-filters" role="group" aria-label="Filter communities">
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
          <EmptyState compact icon="search" title="No community matches" description="Try another filter, or a shorter word." />
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
                  whileHover={reduce ? undefined : { y: -6 }}
                >
                  <Link className="sf-skill-tile" href={`/open-source/${skill.slug}`}>
                    {skill.image ? (
                      <span className="sf-skill-tile-photo">
                        <SkillImage src={skill.image} alt="" fill sizes="(max-width: 640px) 100vw, 280px" />
                      </span>
                    ) : (
                      <span className="sf-skill-tile-photo sf-skill-tile-fallback" aria-hidden="true" />
                    )}
                    <span className="sf-skill-tile-shade" aria-hidden="true" />
                    <span className="sf-skill-tile-copy">
                      <span className="sf-skill-tile-kicker">
                        {skill.status === "coming_soon" ? "Coming soon" : "Available"}
                        {skill.joined ? " · Joined" : ""}
                        {skill.news > 0 ? ` · ${skill.news} new` : ""}
                      </span>
                      <strong>{skill.name}</strong>
                      <span>
                        {skill.members} {skill.members === 1 ? "member" : "members"} · {skill.merged} merged · {skill.openGaps}{" "}
                        {skill.openGaps === 1 ? "open gap" : "open gaps"}
                      </span>
                    </span>
                  </Link>
                </motion.li>
              ))}
            </AnimatePresence>
          </motion.ul>
        )}
        {filtered.length > NICHE_PAGE_SIZE ? (
          <nav className="sf-browse-pages" aria-label="Community pages">
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
