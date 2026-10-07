"use client";

import { useEffect, useState } from "react";
import { Icon } from "../core/Icon.jsx";
import { SectionHeader } from "../core/SectionHeader.jsx";

const DELAY_MS = 5500;

function visibleCount() {
  if (window.matchMedia("(min-width: 1100px)").matches) return 3;
  if (window.matchMedia("(min-width: 760px)").matches) return 2;
  return 1;
}

function Stars({ rating }) {
  return (
    <p className="sf-stars" aria-label={`${rating} out of 5`}>
      {"★".repeat(rating)}
      <span aria-hidden="true">{"☆".repeat(5 - rating)}</span>
    </p>
  );
}

/** Review row. A timeout advances one card at a time, and the track eases across. */
export function PracticeSlider({ title, subtitle, reviews }) {
  const [current, setCurrent] = useState(0);
  const [visible, setVisible] = useState(1);
  const [paused, setPaused] = useState(false);
  const [instant, setInstant] = useState(false);
  const max = Math.max(reviews.length - visible, 0);

  useEffect(() => {
    function apply() {
      setVisible(visibleCount());
    }
    apply();
    window.addEventListener("resize", apply);
    return () => window.removeEventListener("resize", apply);
  }, []);

  useEffect(() => {
    setCurrent((value) => Math.min(value, max));
  }, [max]);

  useEffect(() => {
    if (!instant) return undefined;
    const frame = window.requestAnimationFrame(() => setInstant(false));
    return () => window.cancelAnimationFrame(frame);
  }, [instant]);

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (motion.matches || paused || max < 1) return undefined;
    const timer = window.setTimeout(() => {
      const wrap = current >= max;
      setInstant(wrap);
      setCurrent(wrap ? 0 : current + 1);
    }, DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [current, paused, max]);

  function go(next) {
    if (next > max) {
      setInstant(true);
      setCurrent(0);
      return;
    }
    if (next < 0) {
      setInstant(true);
      setCurrent(max);
      return;
    }
    setInstant(false);
    setCurrent(next);
  }

  return (
    <section
      id="open-source"
      className="sf-section sf-band-sink"
      aria-roledescription="carousel"
      aria-label={title}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false);
      }}
    >
      <SectionHeader
        align="center"
        className="sf-section-head"
        title={title}
        subtitle={subtitle}
        titleId="landing-reviews-title"
        titleSize="var(--text-section)"
        subtitleSize="var(--text-section-sub)"
      />
      <div className="sf-review-shell">
        <button type="button" className="sf-slider-btn sf-slider-prev" aria-label="Previous contribution" onClick={() => go(current - 1)}>
          <Icon name="chevron-left" size={18} />
        </button>
        <div className="sf-review-viewport">
          <div
            className={instant ? "sf-review-track is-instant" : "sf-review-track"}
            style={{ transform: `translateX(calc(${current} * -100% / ${visible}))` }}
          >
            {reviews.map((review) => (
              <article key={review.id} className="sf-review-slide">
                <div className="sf-review-card">
                  <h3>{review.title}</h3>
                  <p>{review.quote}</p>
                  <footer>
                    <span className="sf-review-avatar" aria-hidden="true">
                      {review.name.slice(0, 1)}
                    </span>
                    <span>
                      <span className="sf-review-name">{review.name}</span>
                      <span className="sf-review-skill">{review.skill}</span>
                      {review.rating > 0 ? <Stars rating={review.rating} /> : null}
                    </span>
                  </footer>
                </div>
              </article>
            ))}
          </div>
        </div>
        <button type="button" className="sf-slider-btn sf-slider-next" aria-label="Next contribution" onClick={() => go(current + 1)}>
          <Icon name="chevron-right" size={18} />
        </button>
      </div>
    </section>
  );
}
