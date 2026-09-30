"use client";

import { useEffect, useState } from "react";
import { SkillImage } from "@/components/core/SkillImage";

const NICHES = [
  { title: "Full-Stack Web Development", image: "/skills/web.jpg" },
  { title: "Art & Painting", image: "/skills/art.jpg" },
  { title: "Content Creation", image: "/skills/content.jpg" },
  { title: "Photography", image: "/skills/photo.jpg" },
  { title: "Music Production", image: "/skills/music.jpg" },
];

const SLIDE_MS = 5000;

function deltaFor(index, current, count) {
  let delta = index - current;
  if (delta > count / 2) delta -= count;
  if (delta < -count / 2) delta += count;
  return delta;
}

function Chevron({ direction }) {
  const path = direction === "prev" ? "M15 5 L8 12 L15 19" : "M9 5 L16 12 L9 19";
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
      <path d={path} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Coverflow of skill photos. The center card stays sharp; the neighbors stay smaller and blurred. */
export function AuthNicheCarousel() {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(false);
  const count = NICHES.length;

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (paused || reduced) return undefined;
    const timeout = window.setTimeout(() => {
      setCurrent((value) => (value + 1) % count);
    }, SLIDE_MS);
    return () => window.clearTimeout(timeout);
  }, [current, paused, reduced, count]);

  function show(next) {
    setCurrent(((next % count) + count) % count);
  }

  return (
    <div
      className="sf-niche"
      role="region"
      aria-roledescription="carousel"
      aria-label="Skill niches"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false);
      }}
    >
      <button type="button" className="sf-niche-arrow" aria-label="Previous skill" onClick={() => show(current - 1)}>
        <Chevron direction="prev" />
      </button>
      <div className="sf-niche-stage">
        {NICHES.map((niche, index) => {
          const delta = deltaFor(index, current, count);
          const featured = delta === 0;
          const hidden = Math.abs(delta) > 1;
          return (
            <button
              key={niche.title}
              type="button"
              className="sf-niche-card"
              data-delta={delta}
              aria-label={niche.title}
              aria-current={featured ? "true" : undefined}
              aria-hidden={hidden ? true : undefined}
              tabIndex={hidden ? -1 : 0}
              onClick={() => show(index)}
            >
              <span className="sf-niche-photo">
                <SkillImage src={niche.image} alt="" fill sizes="220px" />
              </span>
              <span className="sf-niche-name">{niche.title}</span>
            </button>
          );
        })}
      </div>
      <button type="button" className="sf-niche-arrow" aria-label="Next skill" onClick={() => show(current + 1)}>
        <Chevron direction="next" />
      </button>
      <p className="sf-niche-live" aria-live="polite">
        {NICHES[current].title}
      </p>
    </div>
  );
}
