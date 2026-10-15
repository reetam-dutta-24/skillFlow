"use client";

import { motion } from "framer-motion";
import { Icon } from "@/components/core/Icon.jsx";
import { SkillImage } from "@/components/core/SkillImage";
import type { TourStart } from "@/lib/tour/entry";
import { DrawnCheck, EASE_OUT, calm } from "./tour-motion";

/** Pieces of a visual rise in one after another, once. Nothing loops. */
function rise(reduce: boolean, order: number) {
  return {
    initial: reduce ? false : ({ opacity: 0, y: 14 } as const),
    animate: { opacity: 1, y: 0 },
    transition: calm(reduce, { duration: 0.32, delay: 0.12 + order * 0.06, ease: EASE_OUT }),
  };
}

const HERO_R = 30;
const HERO_C = 2 * Math.PI * HERO_R;

/** 1. Welcome: a stage, an explanation in your own words, the review, and mastery, settling into place. */
export function WelcomeVisual({ reduce }: { reduce: boolean }) {
  return (
    <div className="sf-tour-hero" aria-hidden="true">
      <motion.div className="sf-tour-hero-stage" {...rise(reduce, 0)}>
        <SkillImage src="/stages/full-stack-web-dev/1.jpg" alt="" fill sizes="(max-width: 720px) 72vw, 360px" />
        <span className="sf-tour-shade" />
        <span className="sf-tour-hero-chip">Stage 1</span>
        <span className="sf-tour-hero-title">How the Web Works & Semantic HTML</span>
      </motion.div>
      <motion.div className="sf-tour-hero-bubble" {...rise(reduce, 1)}>
        <span className="sf-tour-hero-label">
          <Icon name="pen-line" size={12} /> In your own words
        </span>
        <span>HTML gives a page its structure, so browsers and screen readers know what each part is.</span>
      </motion.div>
      <motion.div className="sf-tour-hero-pill" {...rise(reduce, 2)}>
        <DrawnCheck reduce={reduce} size={18} delay={0.3} />
        This idea holds
      </motion.div>
      <motion.div className="sf-tour-hero-ring" {...rise(reduce, 3)}>
        <svg viewBox="0 0 72 72">
          <defs>
            <linearGradient id="sf-tour-hero-grad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="var(--preset-bright)" />
              <stop offset="100%" stopColor="var(--accent)" />
            </linearGradient>
          </defs>
          <circle className="sf-tour-ring-track" cx="36" cy="36" r={HERO_R} />
          <motion.circle
            className="sf-tour-ring-fill"
            cx="36"
            cy="36"
            r={HERO_R}
            stroke="url(#sf-tour-hero-grad)"
            strokeDasharray={HERO_C}
            initial={reduce ? false : { strokeDashoffset: HERO_C }}
            animate={{ strokeDashoffset: HERO_C * 0.25 }}
            transition={calm(reduce, { duration: 0.4, delay: 0.42, ease: EASE_OUT })}
          />
        </svg>
        <span className="sf-tour-hero-ring-num">75%</span>
      </motion.div>
    </div>
  );
}

const FREE_ITEMS = ["Every stage on 30 paths", "Explain-back and notes", "Progress and recall", "Transcripts and certificates"];
const PREMIUM_ITEMS = ["The other niches", "You on the learner map", "Live event search"];

/** 8. Free and Premium, side by side, with nothing hidden. */
export function PremiumVisual({ reduce }: { reduce: boolean }) {
  return (
    <div className="sf-tour-plans">
      <motion.div className="sf-tour-plan" data-plan="free" {...rise(reduce, 0)}>
        <p className="sf-tour-plan-name">
          Free <span>for everyone</span>
        </p>
        <ul>
          {FREE_ITEMS.map((item) => (
            <li key={item}>
              <Icon name="check" size={15} />
              {item}
            </li>
          ))}
        </ul>
      </motion.div>
      <motion.div className="sf-tour-plan" data-plan="premium" {...rise(reduce, 1)}>
        <p className="sf-tour-plan-name">
          Premium <span>adds</span>
        </p>
        <ul>
          {PREMIUM_ITEMS.map((item) => (
            <li key={item}>
              <Icon name="plus" size={15} />
              {item}
            </li>
          ))}
        </ul>
      </motion.div>
    </div>
  );
}

const MOSAIC = ["/skills/web.jpg", "/skills/photo.jpg", "/skills/music.jpg", "/skills/travel-vlogging.jpg"];

/** 9. Start: the stage the button opens, or a few free paths when nothing is followed yet. */
export function StartVisual({ reduce, start }: { reduce: boolean; start: TourStart }) {
  if (start.pathName) {
    return (
      <motion.div className="sf-tour-next" {...rise(reduce, 0)}>
        {start.image ? <SkillImage src={start.image} alt="" fill sizes="(max-width: 720px) 92vw, 520px" /> : null}
        <span className="sf-tour-shade" />
        <span className="sf-tour-next-body">
          <span className="sf-tour-hero-chip">{start.stageTitle ? "Up next" : "Your path"}</span>
          <span className="sf-tour-next-title">{start.stageTitle ?? start.pathName}</span>
          {start.stageTitle ? <span className="sf-tour-next-path">{start.pathName}</span> : null}
        </span>
      </motion.div>
    );
  }
  return (
    <div className="sf-tour-mosaic" aria-hidden="true">
      {MOSAIC.map((src, index) => (
        <motion.span key={src} className="sf-tour-mosaic-tile" {...rise(reduce, index)}>
          <SkillImage src={src} alt="" fill sizes="(max-width: 720px) 46vw, 260px" />
        </motion.span>
      ))}
      <motion.span className="sf-tour-mosaic-badge" {...rise(reduce, 4)}>
        <Icon name="route" size={16} /> 30 free paths
      </motion.span>
    </div>
  );
}
