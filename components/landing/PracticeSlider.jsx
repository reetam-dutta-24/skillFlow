"use client";

import { useEffect, useState } from "react";
import { Chip } from "../core/Chip.jsx";
import { GlassCard } from "../core/GlassCard.jsx";
import { Icon } from "../core/Icon.jsx";
import { SectionHeader } from "../core/SectionHeader.jsx";
import { PaginationDots } from "../navigation/PaginationDots.jsx";

const INTERVAL_MS = 6500;

/** Auto-advancing milestone reviews. Pauses while hovered, focused, or when motion is reduced. */
export function PracticeSlider({ title, subtitle, reviews }) {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const total = reviews.length;
  const review = reviews[current];

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (media.matches || paused || total < 2) return undefined;
    const timer = window.setInterval(() => {
      setCurrent((value) => (value + 1) % total);
    }, INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [paused, total]);

  function go(next) {
    setCurrent((next + total) % total);
  }

  return (
    <section
      id="reviews"
      className="sf-section"
      aria-roledescription="carousel"
      aria-label="Milestone reviews"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false);
      }}
    >
      <SectionHeader title={title} subtitle={subtitle} titleId="landing-reviews-title" />
      <GlassCard
        tint="accent"
        className="sf-lead-shadow"
        style={{
          marginTop: "var(--space-6)",
          padding: "var(--space-6)",
          borderColor: "var(--border-accent)",
          boxShadow: "var(--sf-lead-shadow)",
          overflow: "visible",
        }}
      >
        <div aria-live="polite">
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "var(--space-3)" }}>
            <Chip tone="accent">{review.skill}</Chip>
            <p style={{ margin: 0, fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>
              Example {current + 1} of {total}
            </p>
          </div>
          <h3 className="sf-review-stage">{review.stage}</h3>
          <div className="sf-review-grid">
            <div className="sf-review-block">
              <p className="sf-kicker">Explanation</p>
              <p className="sf-review-copy">{review.explanation}</p>
            </div>
            <div className="sf-review-block sf-review-follow">
              <p className="sf-kicker">Follow-up</p>
              <p className="sf-review-copy">{review.followUp}</p>
            </div>
          </div>
          <p className="sf-review-note">{review.note}</p>
        </div>
      </GlassCard>
      <div className="sf-slider-controls">
        <button type="button" className="sf-slider-btn" aria-label="Previous review" onClick={() => go(current - 1)}>
          <Icon name="chevron-left" size={18} />
        </button>
        <PaginationDots total={total} current={current} onChange={setCurrent} />
        <button type="button" className="sf-slider-btn" aria-label="Next review" onClick={() => go(current + 1)}>
          <Icon name="chevron-right" size={18} />
        </button>
      </div>
    </section>
  );
}
