"use client";

import { motion, type Transition, type Variants } from "framer-motion";

/** The --ease-out token, as framer-motion wants it. */
export const EASE_OUT = [0.16, 1, 0.3, 1] as const;
export const EASE_IN = [0.4, 0, 1, 1] as const;

/** Critically damped: it eases into place without overshooting, so nothing bounces. */
export const SOFT_SPRING: Transition = { type: "spring", stiffness: 190, damping: 28, mass: 1 };

export const INSTANT: Transition = { duration: 0 };

/** Pick the moving transition, or none at all under reduced motion. */
export function calm(reduce: boolean, transition: Transition): Transition {
  return reduce ? INSTANT : transition;
}

/**
 * Direction-aware slide change, the same feel as the lesson wizard: the old slide leaves in 140ms, the new one
 * comes in from the side the learner is heading to in 240ms. `custom` is +1 for next, -1 for back, 0 to fade.
 */
export const SLIDE: Variants = {
  enter: (dir: number) => ({ opacity: 0, x: dir * 48 }),
  center: { opacity: 1, x: 0, transition: { duration: 0.24, ease: EASE_OUT } },
  exit: (dir: number) => ({ opacity: 0, x: dir * -32, transition: { duration: 0.14, ease: EASE_IN } }),
};

/** Each slide's kicker, heading, text and visual rise in 50ms apart. `custom` is the place in that order. */
export const ITEM: Variants = {
  enter: { opacity: 0, y: 12 },
  center: (order: number) => ({ opacity: 1, y: 0, transition: { delay: 0.05 * order, duration: 0.24, ease: EASE_OUT } }),
};

/** Reduced motion: every change is instant. */
export const STILL: Variants = {
  enter: { opacity: 1, x: 0, y: 0 },
  center: { opacity: 1, x: 0, y: 0, transition: INSTANT },
  exit: { opacity: 1, transition: INSTANT },
};

/** A check that draws itself once: the ring, then the tick. */
export function DrawnCheck({ reduce, size = 22, delay = 0 }: { reduce: boolean; size?: number; delay?: number }) {
  return (
    <svg className="sf-tour-check" width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <motion.circle
        cx="12"
        cy="12"
        r="10.25"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        initial={reduce ? false : { pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={calm(reduce, { duration: 0.3, delay, ease: EASE_OUT })}
      />
      <motion.path
        d="M7.6 12.4l3 3 5.8-6.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.1"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={reduce ? false : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={calm(reduce, { duration: 0.24, delay: delay + 0.14, ease: EASE_OUT })}
      />
    </svg>
  );
}

/** A finished demo: a check that draws itself and one settling line. Lives inside a status region. */
export function DemoSuccess({ reduce, children }: { reduce: boolean; children: React.ReactNode }) {
  return (
    <motion.p
      className="sf-tour-success"
      initial={reduce ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={calm(reduce, { duration: 0.24, ease: EASE_OUT })}
    >
      <DrawnCheck reduce={reduce} size={20} />
      <span>{children}</span>
    </motion.p>
  );
}
