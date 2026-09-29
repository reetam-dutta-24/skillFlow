"use client";

import { useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Icon } from "@/components/core/Icon.jsx";
import { EmptyState } from "@/components/feedback/EmptyState.jsx";

export type BrowseSkill = {
  id: string;
  name: string;
  description: string;
  status: "available" | "coming_soon";
  followed: boolean;
  stageCount: number;
  image: string | null;
  href: string | null;
};

const EASE = [0.22, 1, 0.36, 1] as const;

function matches(skill: BrowseSkill, query: string) {
  const haystack = `${skill.name} ${skill.description}`.toLowerCase();
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
  const filtered = useMemo(() => skills.filter((skill) => matches(skill, query)), [skills, query]);

  function search(value: string) {
    setQuery(value);
    resultsRef.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "nearest" });
  }

  return (
    <div className="sf-browse-body">
      <div className="sf-browse-search">
        <label>
          <Icon name="search" size={16} />
          <span className="sf-sr">Search skills</span>
          <input
            type="search"
            value={query}
            placeholder="Search a skill or a topic"
            onChange={(event) => search(event.target.value)}
          />
        </label>
        {query ? (
          <button type="button" onClick={() => search("")}>
            Clear
          </button>
        ) : null}
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
            description="Try a shorter word, or clear the search to see every niche."
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
  const body = (
    <>
      {skill.image ? (
        <span className="sf-skill-tile-photo">
          <Image src={skill.image} alt="" fill sizes="(min-width: 900px) 280px, 100vw" />
        </span>
      ) : (
        <span className="sf-skill-tile-photo sf-skill-tile-fallback" aria-hidden="true" />
      )}
      <span className="sf-skill-tile-shade" aria-hidden="true" />
      <span className="sf-skill-tile-copy">
        <span className="sf-skill-tile-kicker">
          {skill.status === "coming_soon"
            ? "Coming soon"
            : skill.followed
              ? "On your feed"
              : skill.stageCount
                ? `${skill.stageCount} stages`
                : "No stages yet"}
        </span>
        <strong>{skill.name}</strong>
        {skill.description ? <span>{skill.description}</span> : null}
      </span>
    </>
  );

  if (!skill.href) {
    return <article className="sf-skill-tile is-soon">{body}</article>;
  }

  return (
    <Link className="sf-skill-tile" href={skill.href}>
      {body}
    </Link>
  );
}
