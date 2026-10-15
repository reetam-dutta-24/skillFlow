"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Icon } from "@/components/core/Icon.jsx";
import { useCalmMotion } from "@/components/feedback/useCalmMotion";
import { DetoxGauge, signed } from "@/components/detox/DetoxGauge";
import { BANDS, bandIndex } from "@/lib/detox/score";
import { SwapButton } from "./SwapDialog";
import { FocusStartButtons } from "./FocusCard";

const SEEN_KEY = "skillflow-detox-seen";

function readSeen(): number | null {
  try {
    const raw = window.localStorage.getItem(SEEN_KEY);
    const value = raw == null ? NaN : Number(raw);
    return Number.isFinite(value) ? value : null;
  } catch {
    return null;
  }
}

function writeSeen(score: number) {
  try {
    window.localStorage.setItem(SEEN_KEY, String(score));
  } catch {
    // Private mode: no celebration memory, nothing else changes.
  }
}

const SPARKS = Array.from({ length: 10 }, (_, index) => index);

/** The top of the Detox page: the dial, the band, this week's change, and the two things to do now. */
export function DetoxHero({
  score,
  from,
  change,
  bandId,
  bandLabel,
  blurb,
  openSwap,
}: {
  score: number;
  from: number;
  change: number;
  bandId: string;
  bandLabel: string;
  blurb: string;
  openSwap: boolean;
}) {
  const reduce = useCalmMotion();
  const [celebrate, setCelebrate] = useState<string | null>(null);

  // A band crossed upward since the last visit earns one small celebration. Stored per browser only.
  const settled = useCallback(() => {
    const seen = readSeen();
    if (seen !== null && bandIndex(score) > bandIndex(seen)) setCelebrate(BANDS[bandIndex(score)].label);
    writeSeen(score);
  }, [score]);

  useEffect(() => {
    if (!celebrate) return undefined;
    const timer = window.setTimeout(() => setCelebrate(null), 5200);
    return () => window.clearTimeout(timer);
  }, [celebrate]);

  return (
    <section className="sf-dtx-hero" aria-labelledby="dtx-score-title" data-band={bandId}>
      <div className="sf-dtx-dial">
        <DetoxGauge score={score} from={from} reduce={reduce} onSettled={settled} />
        <AnimatePresence>
          {celebrate && !reduce ? (
            <motion.span key="burst" className="sf-dtx-burst" aria-hidden="true" initial={{ opacity: 1 }} animate={{ opacity: 0 }} transition={{ duration: 0.9, delay: 0.5 }}>
              {SPARKS.map((index) => {
                const angle = (index / SPARKS.length) * Math.PI * 2;
                return (
                  <motion.span
                    key={index}
                    initial={{ x: 0, y: 0, scale: 0.4 }}
                    animate={{ x: Math.cos(angle) * 84, y: Math.sin(angle) * 54, scale: 1 }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  />
                );
              })}
            </motion.span>
          ) : null}
        </AnimatePresence>
      </div>
      <div className="sf-dtx-hero-copy">
        <p className="sf-dtx-kicker">Your Detox Score</p>
        <h2 id="dtx-score-title" className="sf-dtx-band">
          {bandLabel}
        </h2>
        <p className="sf-dtx-blurb">{blurb}</p>
        <p className="sf-dtx-change" data-direction={change > 0 ? "up" : change < 0 ? "down" : "flat"}>
          <Icon name={change > 0 ? "trending-up" : change < 0 ? "trending-down" : "minus"} size={16} />
          <span>
            <strong>{signed(change)}</strong> this week
          </span>
        </p>
        <div role="status" className="sf-dtx-celebrate-wrap">
          <AnimatePresence>
            {celebrate ? (
              <motion.p
                key={celebrate}
                className="sf-dtx-celebrate"
                initial={reduce ? false : { opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={reduce ? { opacity: 0, transition: { duration: 0 } } : { opacity: 0, y: -4 }}
                transition={reduce ? { duration: 0 } : { duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              >
                <Icon name="sparkles" size={16} /> You reached {celebrate}. That came from real learning.
              </motion.p>
            ) : null}
          </AnimatePresence>
        </div>
        <div className="sf-dtx-hero-actions">
          <SwapButton autoOpen={openSwap} />
          <FocusStartButtons compact />
        </div>
      </div>
    </section>
  );
}
