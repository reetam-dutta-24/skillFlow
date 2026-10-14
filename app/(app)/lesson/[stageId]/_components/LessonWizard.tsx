"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion, type Variants } from "framer-motion";
import { Button } from "@/components/core/Button.jsx";
import { Icon } from "@/components/core/Icon.jsx";
import { SkillImage } from "@/components/core/SkillImage";

export type LessonSlide = {
  id: string;
  /** Short name for the step dot, e.g. "Watch first" or a resource title. */
  label: string;
  /** Server-rendered body. Its heading carries `data-slide-heading` and `tabIndex={-1}`. */
  content: ReactNode;
};

type Direction = "next" | "back" | "none";

const SWIPE_MIN_PX = 60;

/** The --ease-out token, as framer-motion wants it. */
const EASE_OUT = [0.16, 1, 0.3, 1] as const;
const EASE_IN = [0.4, 0, 1, 1] as const;

/**
 * Direction-aware slide change: the new slide comes in from the side the learner is heading to and the old one
 * leaves the other way. `custom` is +1 for next, -1 for back, and 0 for the restored step (a plain fade).
 */
const SLIDE: Variants = {
  enter: (dir: number) => ({ opacity: 0, x: dir * 56, scale: dir === 0 ? 1 : 0.985 }),
  center: { opacity: 1, x: 0, scale: 1, transition: { duration: 0.24, ease: EASE_OUT } },
  exit: (dir: number) => ({ opacity: 0, x: dir * -40, scale: dir === 0 ? 1 : 0.985, transition: { duration: 0.14, ease: EASE_IN } }),
};

/** Reduced motion: no slide and no scale, the change is instant. */
const STILL: Variants = {
  enter: { opacity: 1 },
  center: { opacity: 1, transition: { duration: 0 } },
  exit: { opacity: 1, transition: { duration: 0 } },
};

/** A calm line for where the learner is. Picked by progress, never at random. */
function encouragement(step: number, total: number, hasExplainBack: boolean) {
  if (step === total - 1) {
    return hasExplainBack
      ? { emoji: "🎯", text: "Almost ready to explain it back." }
      : { emoji: "🎯", text: "You have reached the end of this stage." };
  }
  if (step === 0) return { emoji: "🧭", text: "Here is what this stage covers." };
  const share = step / (total - 1);
  if (share < 0.4) return { emoji: "🚀", text: "Nice start. Take each resource at your own pace." };
  if (share < 0.7) return { emoji: "💡", text: "Halfway there. Jot down what stands out." };
  return { emoji: "🌱", text: "Steady progress. A few more to go." };
}

function readStoredStep(key: string, total: number) {
  try {
    const raw = window.localStorage.getItem(key);
    const value = raw == null ? NaN : Number.parseInt(raw, 10);
    return Number.isInteger(value) && value >= 0 && value < total ? value : 0;
  } catch {
    return 0;
  }
}

/** Another tab on the same stage moves this one too, until the learner picks a step here. */
function subscribeToStorage(onChange: () => void) {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}

const noSubscribe = () => () => {};

/**
 * Reduced motion, but only after hydration. The server cannot read the setting, so the first client render must
 * match it; the setting takes over on the next render.
 */
function useCalmMotion() {
  const prefers = useReducedMotion();
  const hydrated = useSyncExternalStore(noSubscribe, () => true, () => false);
  return hydrated && Boolean(prefers);
}

function storeStep(key: string, step: number) {
  try {
    window.localStorage.setItem(key, String(step));
  } catch {
    // Private mode or blocked storage: the wizard still works, it just starts at the intro next time.
  }
}

function typingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  // Media elements use the arrow keys to seek, so they keep them.
  return target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT", "VIDEO", "AUDIO"].includes(target.tagName);
}

/** Moves the reader to the new slide's heading once it has mounted. */
function SlideFocus({ active, onDone, children }: { active: boolean; onDone: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!active) return;
    ref.current?.querySelector<HTMLElement>("[data-slide-heading]")?.focus({ preventScroll: true });
    onDone();
  }, [active, onDone]);
  return <div ref={ref}>{children}</div>;
}

/** The stage as one slide at a time: intro, the clip, each resource, then the explain-back step. */
export function LessonWizard({
  stageId,
  stageTitle,
  kicker,
  image,
  slides,
  hasExplainBack,
  explainHref,
}: {
  stageId: string;
  stageTitle: string;
  kicker: string;
  image: string | null;
  slides: LessonSlide[];
  hasExplainBack: boolean;
  explainHref: string;
}) {
  const total = slides.length;
  const storageKey = `skillflow-lesson-step:${stageId}`;
  // The server and hydration render the intro. The saved step takes over right after, with no animation.
  const savedStep = useSyncExternalStore(
    subscribeToStorage,
    () => readStoredStep(storageKey, total),
    () => 0,
  );
  const [chosenStep, setChosenStep] = useState<number | null>(null);
  const step = chosenStep ?? savedStep;
  const [direction, setDirection] = useState<Direction>("none");
  const [focusPending, setFocusPending] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  const go = useCallback(
    (next: number) => {
      if (next < 0 || next >= total || next === step) return;
      setDirection(next > step ? "next" : "back");
      setChosenStep(next);
      storeStep(storageKey, next);
      setFocusPending(true);
      // A long slide may leave the reader low on the page; bring the top of the wizard back into view.
      const root = rootRef.current;
      if (root && root.getBoundingClientRect().top < 0) {
        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        root.scrollIntoView({ block: "start", behavior: reduce ? "auto" : "smooth" });
      }
    },
    [step, total, storageKey],
  );

  const focusDone = useCallback(() => setFocusPending(false), []);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      if (typingTarget(event.target)) return;
      // A dialog over the app (the recall card, for one) keeps its own keys.
      if (document.querySelector('[aria-modal="true"]')) return;
      event.preventDefault();
      go(event.key === "ArrowRight" ? step + 1 : step - 1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, step]);

  function onTouchStart(event: React.TouchEvent) {
    const touch = event.touches[0];
    touchStart.current = touch ? { x: touch.clientX, y: touch.clientY } : null;
  }

  function onTouchEnd(event: React.TouchEvent) {
    const start = touchStart.current;
    touchStart.current = null;
    const touch = event.changedTouches[0];
    if (!start || !touch) return;
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    // Mostly sideways and long enough, so a vertical scroll never changes the slide.
    if (Math.abs(dx) < SWIPE_MIN_PX || Math.abs(dx) < Math.abs(dy) * 1.5) return;
    go(dx < 0 ? step + 1 : step - 1);
  }

  const reduce = useCalmMotion();
  const dir = direction === "next" ? 1 : direction === "back" ? -1 : 0;
  const slide = slides[step];
  const last = step === total - 1;
  const percent = Math.round(((step + 1) / total) * 100);
  const message = encouragement(step, total, hasExplainBack);

  return (
    <div className="sf-lwiz" ref={rootRef}>
      {image ? (
        <div className="sf-lwiz-banner">
          <SkillImage src={image} alt="" fill preload sizes="(max-width: 820px) 100vw, 760px" />
        </div>
      ) : null}

      <div className="sf-lwiz-top">
        <p className="sf-lessonx-kicker">{kicker}</p>
        {/* The intro slide carries the big h1. Every other slide keeps the stage title here as the page h1. */}
        {step === 0 ? null : <h1 className="sf-lwiz-context">{stageTitle}</h1>}
        <div className="sf-lwiz-progress">
          <p className="sf-lwiz-count">
            <span>
              Step {step + 1} of {total}
            </span>
            <span>{percent}% through this stage</span>
          </p>
          <div
            className="sf-lwiz-track"
            role="progressbar"
            aria-label="Progress through this stage"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={percent}
          >
            <motion.span
              className="sf-lwiz-fill"
              initial={false}
              animate={{ width: `${percent}%` }}
              transition={reduce ? { duration: 0 } : { duration: 0.36, ease: EASE_OUT }}
            />
          </div>
          <div className="sf-lwiz-dots">
            {slides.map((item, index) => (
              <button
                key={item.id}
                type="button"
                className="sf-lwiz-dot"
                aria-label={`Step ${index + 1} of ${total}: ${item.label}`}
                aria-current={index === step ? "step" : undefined}
                data-done={index < step ? "true" : undefined}
                onClick={() => go(index)}
              >
                <span aria-hidden="true" />
              </button>
            ))}
          </div>
        </div>
        <AnimatePresence mode="wait" initial={false}>
          <motion.p
            key={message.text}
            className="sf-lwiz-cheer"
            initial={reduce ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? { opacity: 1 } : { opacity: 0, y: -6 }}
            transition={reduce ? { duration: 0 } : { duration: 0.18, ease: EASE_OUT }}
          >
            <span aria-hidden="true">{message.emoji}</span> {message.text}
          </motion.p>
        </AnimatePresence>
      </div>

      <div className="sf-lwiz-stage" aria-live="polite" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        <AnimatePresence mode="wait" initial={false} custom={dir}>
          <motion.div
            key={slide.id}
            className="sf-lwiz-slide"
            custom={dir}
            variants={reduce ? STILL : SLIDE}
            initial="enter"
            animate="center"
            exit="exit"
          >
            <SlideFocus active={focusPending} onDone={focusDone}>
              {slide.content}
            </SlideFocus>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="sf-lwiz-nav">
        {/* Both sides sit in the same wrapper, so the two halves share the bar evenly on a phone. */}
        <span className="sf-lwiz-cta">
          <Button variant="ghost" size="lg" disabled={step === 0} onClick={() => go(step - 1)}>
            <Icon name="arrow-left" size={16} />
            Back
          </Button>
        </span>
        <AnimatePresence mode="wait" initial={false}>
          {last ? (
            hasExplainBack ? (
              <motion.span
                key="explain"
                className="sf-lwiz-cta"
                initial={reduce ? false : { opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={reduce ? { opacity: 1 } : { opacity: 0, scale: 0.94 }}
                transition={reduce ? { duration: 0 } : { duration: 0.2, ease: EASE_OUT }}
              >
                <Link className="sf-btn sf-btn--gradient sf-btn--lg" href={explainHref}>
                  Explain it back
                </Link>
              </motion.span>
            ) : null
          ) : (
            <motion.span
              key="next"
              className="sf-lwiz-cta"
              initial={reduce ? false : { opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={reduce ? { opacity: 1 } : { opacity: 0, scale: 0.94 }}
              transition={reduce ? { duration: 0 } : { duration: 0.2, ease: EASE_OUT }}
            >
              <Button variant="gradient" size="lg" onClick={() => go(step + 1)}>
                Next
                <Icon name="arrow-right" size={16} />
              </Button>
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
