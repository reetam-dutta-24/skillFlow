"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { SkillImage } from "@/components/core/SkillImage";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Icon } from "@/components/core/Icon.jsx";
import { EmptyState } from "@/components/feedback/EmptyState.jsx";

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
  followed: boolean;
  stageCount: number;
  image: string | null;
  href: string | null;
  group: string;
  tags: string[];
};

const EASE = [0.22, 1, 0.36, 1] as const;

const FollowedIdsContext = createContext<ReadonlySet<string> | null>(null);
const PublishFollowedContext = createContext<(ids: string[]) => void>(() => {});

export function FollowedOverrideProvider({ children }: { children: ReactNode }) {
  const [ids, setIds] = useState<ReadonlySet<string> | null>(null);
  const publish = useMemo(() => (next: string[]) => setIds(new Set(next)), []);
  return (
    <PublishFollowedContext.Provider value={publish}>
      <FollowedIdsContext.Provider value={ids}>{children}</FollowedIdsContext.Provider>
    </PublishFollowedContext.Provider>
  );
}

export function PublishFollowedIds({ ids }: { ids: string[] }) {
  const publish = useContext(PublishFollowedContext);
  useEffect(() => {
    publish(ids);
  }, [ids, publish]);
  return null;
}

function matches(skill: BrowseSkill, query: string, filter: FilterId) {
  if (filter === "open" && skill.status !== "available") return false;
  if (filter !== "all" && filter !== "open" && skill.group !== filter) return false;
  const haystack = `${skill.name} ${skill.description} ${skill.tags.join(" ")}`.toLowerCase();
  return query
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((token) => haystack.includes(token));
}

export function SkillBrowse({ skills }: { skills: BrowseSkill[] }) {
  const reduce = useReducedMotion();
  const resultsRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterId>("all");
  const filtered = useMemo(() => skills.filter((skill) => matches(skill, query, filter)), [skills, query, filter]);

  function search(value: string) {
    setQuery(value);
    resultsRef.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "nearest" });
  }

  return (
    <div className="sf-browse-body">
      <div className="sf-browse-tools">
        <div className="sf-browse-search">
          <label>
            <Icon name="search" size={16} />
            <span className="sf-sr">Search skills</span>
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
        <div className="sf-browse-filters" role="group" aria-label="Filter skills">
          {FILTERS.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={filter === item.id}
              className={filter === item.id ? "is-on" : undefined}
              onClick={() => setFilter(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
      <p className="sf-browse-count" aria-live="polite">
        {filtered.length === skills.length
          ? `${skills.length} skills`
          : `${filtered.length} of ${skills.length} match`}
      </p>
      <div ref={resultsRef}>
        {filtered.length === 0 ? (
          <EmptyState
            compact
            icon="search"
            title="No skill matches"
            description="Try another filter, or a shorter word."
          />
        ) : (
          <motion.ul className="sf-browse-grid" layout>
            <AnimatePresence mode="popLayout">
              {filtered.map((skill, index) => (
                <motion.li
                  key={skill.id}
                  layout
                  initial={reduce ? false : { opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduce ? { opacity: 0 } : { opacity: 0, y: 8 }}
                  transition={reduce ? { duration: 0 } : { duration: 0.32, delay: Math.min(index, 6) * 0.04, ease: EASE }}
                  whileHover={reduce || !skill.href ? undefined : { y: -6 }}
                >
                  <SkillCard skill={skill} />
                </motion.li>
              ))}
            </AnimatePresence>
          </motion.ul>
        )}
      </div>
    </div>
  );
}

function SkillCard({ skill }: { skill: BrowseSkill }) {
  const followedIds = useContext(FollowedIdsContext);
  const followed = followedIds ? followedIds.has(skill.id) : skill.followed;
  const view = followed === skill.followed ? skill : { ...skill, followed };
  const body = (
    <>
      {view.image ? (
        <span className="sf-skill-tile-photo">
          <SkillImage src={view.image} alt="" fill sizes="(max-width: 640px) 100vw, 280px" />
        </span>
      ) : (
        <span className="sf-skill-tile-photo sf-skill-tile-fallback" aria-hidden="true" />
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
              : view.followed
                ? "On your feed"
                : view.stageCount
                  ? `${view.stageCount} stages`
                  : "No stages yet"}
        </span>
        <strong>{view.name}</strong>
        {view.description ? <span>{view.description}</span> : null}
      </span>
    </>
  );

  if (!view.href) {
    return <article className="sf-skill-tile is-soon">{body}</article>;
  }

  return (
    <Link className="sf-skill-tile" href={view.href}>
      {body}
    </Link>
  );
}
