"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/core/Button.jsx";
import { Icon } from "@/components/core/Icon.jsx";
import { useFocusTrap } from "@/components/feedback/useFocusTrap";
import { reviewPracticeAnswer, type PracticeReview } from "@/lib/tour/demos";
import { tourStartLabel, type TourStart } from "@/lib/tour/entry";
import { START_ON_PATH, START_WITHOUT_PATH, TOUR_SLIDES, type TourSlide } from "@/lib/tour/slides";
import { BeyondDemo, ExplainDemo, NotesDemo, PathDemo, PlanDemo, ProgressDemo } from "./TourDemos";
import { PremiumVisual, StartVisual, WelcomeVisual } from "./TourVisuals";
import { EASE_IN, EASE_OUT, ITEM, SLIDE, SOFT_SPRING, STILL, calm } from "./tour-motion";

const SWIPE_MIN_PX = 60;
const HEADING_ID = "sf-tour-heading";

function typingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
}

/** Moves the reader to the new slide's heading once it has mounted. */
function SlideFocus({ active, onDone, children }: { active: boolean; onDone: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!active) return;
    ref.current?.querySelector<HTMLElement>("[data-slide-heading]")?.focus({ preventScroll: true });
    onDone();
  }, [active, onDone]);
  return (
    <div ref={ref} className="sf-tour-focus">
      {children}
    </div>
  );
}

function startCopy(slide: TourSlide, start: TourStart) {
  if (slide.id !== "start" || start.stageTitle) return { heading: slide.heading, body: slide.body };
  return start.pathName ? START_ON_PATH : START_WITHOUT_PATH;
}

export type TourCloseReason = "skip" | "finish";

/**
 * The full-screen tour. One slide at a time, the lesson wizard's patterns: step count, progress bar, step dots,
 * Back and Next in a sticky bar, arrow keys and swipe. Escape and "Skip tour" close it.
 */
export function TourDialog({
  reduce,
  start,
  starting,
  onClose,
  onStart,
}: {
  reduce: boolean;
  start: TourStart;
  starting: boolean;
  onClose: (reason: TourCloseReason) => void;
  onStart: () => void;
}) {
  const total = TOUR_SLIDES.length;
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(0);
  const [focusPending, setFocusPending] = useState(false);
  // The explain-back practice is kept here so going Back keeps the draft and the note card can use it.
  const [draft, setDraft] = useState("");
  const [review, setReview] = useState<PracticeReview | null>(null);
  const [heldAnswer, setHeldAnswer] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  const skip = useCallback(() => onClose("skip"), [onClose]);
  useFocusTrap(rootRef, true, skip);

  // The trap focuses the first control; the reader should land on the first heading instead.
  useEffect(() => {
    rootRef.current?.querySelector<HTMLElement>("[data-slide-heading]")?.focus({ preventScroll: true });
  }, []);

  // The page behind stays still while the tour is open.
  useEffect(() => {
    const html = document.documentElement;
    const previous = html.style.overflow;
    html.style.overflow = "hidden";
    return () => {
      html.style.overflow = previous;
    };
  }, []);

  const go = useCallback(
    (next: number) => {
      if (next < 0 || next >= total || next === step) return;
      setDirection(next > step ? 1 : -1);
      setStep(next);
      setFocusPending(true);
      scrollRef.current?.scrollTo({ top: 0, behavior: "auto" });
    },
    [step, total],
  );

  const focusDone = useCallback(() => setFocusPending(false), []);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      if (typingTarget(event.target)) return;
      event.preventDefault();
      go(event.key === "ArrowRight" ? step + 1 : step - 1);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [go, step]);

  function onTouchStart(event: React.TouchEvent) {
    const touch = event.touches[0];
    // Selecting text in the practice box is not a swipe.
    touchStart.current = touch && !typingTarget(event.target) ? { x: touch.clientX, y: touch.clientY } : null;
  }

  function onTouchEnd(event: React.TouchEvent) {
    const begin = touchStart.current;
    touchStart.current = null;
    const touch = event.changedTouches[0];
    if (!begin || !touch) return;
    const dx = touch.clientX - begin.x;
    const dy = touch.clientY - begin.y;
    if (Math.abs(dx) < SWIPE_MIN_PX || Math.abs(dx) < Math.abs(dy) * 1.5) return;
    go(dx < 0 ? step + 1 : step - 1);
  }

  function checkPractice() {
    const result = reviewPracticeAnswer(draft);
    setReview(result);
    setHeldAnswer(result.verdict === "holds" ? draft : null);
  }

  const slide = TOUR_SLIDES[step];
  const last = step === total - 1;
  const percent = Math.round(((step + 1) / total) * 100);
  const copy = startCopy(slide, start);

  function visualFor(item: TourSlide) {
    switch (item.visual) {
      case "welcome":
        return <WelcomeVisual reduce={reduce} />;
      case "path":
        return <PathDemo reduce={reduce} />;
      case "explain":
        return (
          <ExplainDemo
            reduce={reduce}
            draft={draft}
            onDraft={setDraft}
            review={review}
            onCheck={checkPractice}
          />
        );
      case "notes":
        return <NotesDemo reduce={reduce} answer={heldAnswer} />;
      case "progress":
        return <ProgressDemo reduce={reduce} />;
      case "plan":
        return <PlanDemo reduce={reduce} />;
      case "beyond":
        return <BeyondDemo reduce={reduce} />;
      case "premium":
        return <PremiumVisual reduce={reduce} />;
      case "start":
        return <StartVisual reduce={reduce} start={start} />;
    }
  }

  const item = reduce ? STILL : ITEM;

  return (
    <motion.div
      ref={rootRef}
      className="sf-tour"
      role="dialog"
      aria-modal="true"
      aria-labelledby={HEADING_ID}
      initial={reduce ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={reduce ? { opacity: 0, transition: { duration: 0 } } : { opacity: 0, transition: { duration: 0.16, ease: EASE_IN } }}
      transition={calm(reduce, { duration: 0.24, ease: EASE_OUT })}
    >
      <div className="sf-tour-scroll" ref={scrollRef}>
        <motion.div
          className="sf-tour-frame"
          initial={reduce ? false : { y: 16, scale: 0.99 }}
          animate={{ y: 0, scale: 1 }}
          transition={calm(reduce, { duration: 0.32, ease: EASE_OUT })}
        >
          <header className="sf-tour-head">
            <p className="sf-tour-brand">
              <span className="sf-tour-brand-mark" aria-hidden="true">
                <Icon name="compass" size={16} />
              </span>
              SkillFlow tour
              <span className="sf-tour-brand-meta">about 2 minutes</span>
            </p>
            <Button variant="ghost" size="sm" onClick={skip}>
              Skip tour
              <Icon name="x" size={15} />
            </Button>
          </header>

          <div className="sf-tour-progress">
            <p className="sf-tour-count">
              <span>
                Step {step + 1} of {total}
              </span>
              <span>{slide.label}</span>
            </p>
            <div
              className="sf-tour-track"
              role="progressbar"
              aria-label="Progress through the tour"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={percent}
            >
              <motion.span
                className="sf-tour-fill"
                initial={false}
                animate={{ width: `${percent}%` }}
                transition={calm(reduce, SOFT_SPRING)}
              />
            </div>
            <div className="sf-tour-dots">
              {TOUR_SLIDES.map((dot, index) => (
                <button
                  key={dot.id}
                  type="button"
                  className="sf-tour-dot"
                  aria-label={`Step ${index + 1} of ${total}: ${dot.label}`}
                  aria-current={index === step ? "step" : undefined}
                  data-done={index < step ? "true" : undefined}
                  onClick={() => go(index)}
                >
                  <motion.span
                    aria-hidden="true"
                    initial={false}
                    animate={{ width: index === step ? 20 : 8 }}
                    transition={calm(reduce, SOFT_SPRING)}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="sf-tour-stage" aria-live="polite" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={slide.id}
                className="sf-tour-slide-wrap"
                custom={direction}
                variants={reduce ? STILL : SLIDE}
                initial="enter"
                animate="center"
                exit="exit"
              >
                <SlideFocus active={focusPending} onDone={focusDone}>
                  <article className="sf-tour-slide" data-slide={slide.id}>
                    <motion.div className="sf-tour-visual" custom={3} variants={item}>
                      <div className="sf-tour-panel" data-visual={slide.visual}>
                        {visualFor(slide)}
                      </div>
                    </motion.div>
                    <div className="sf-tour-copy">
                      <motion.p className="sf-tour-kicker" custom={0} variants={item}>
                        {slide.kicker}
                      </motion.p>
                      <motion.h2
                        id={HEADING_ID}
                        className="sf-tour-heading"
                        data-slide-heading
                        tabIndex={-1}
                        custom={1}
                        variants={item}
                      >
                        {slide.emoji ? (
                          <span className="sf-tour-emoji" aria-hidden="true">
                            {slide.emoji}
                          </span>
                        ) : null}
                        {copy.heading}
                      </motion.h2>
                      <motion.p className="sf-tour-body" custom={2} variants={item}>
                        {copy.body}
                      </motion.p>
                      {slide.demo ? (
                        <motion.p className="sf-tour-try" custom={3} variants={item}>
                          <span className="sf-tour-try-chip">
                            <Icon name="hand" size={14} />
                            Try it
                          </span>
                          <span>{slide.demo.prompt}</span>
                        </motion.p>
                      ) : null}
                      {slide.id === "start" ? (
                        <motion.p className="sf-tour-stay" custom={3} variants={item}>
                          <button type="button" className="sf-tour-quiet sf-hit" onClick={() => onClose("finish")}>
                            Finish and stay on Home
                          </button>
                        </motion.p>
                      ) : null}
                    </div>
                  </article>
                </SlideFocus>
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>

        <div className="sf-tour-nav">
          <div className="sf-tour-nav-inner">
            <span className="sf-tour-cta">
              <Button variant="ghost" size="lg" disabled={step === 0} onClick={() => go(step - 1)}>
                <Icon name="arrow-left" size={16} />
                Back
              </Button>
            </span>
            <span className="sf-tour-keys" aria-hidden="true">
              <kbd>←</kbd>
              <kbd>→</kbd> to move · <kbd>Esc</kbd> to close
            </span>
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={last ? "start" : "next"}
                className="sf-tour-cta"
                initial={reduce ? false : { opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={reduce ? { opacity: 1, transition: { duration: 0 } } : { opacity: 0, scale: 0.94, transition: { duration: 0.12 } }}
                transition={calm(reduce, { duration: 0.2, ease: EASE_OUT })}
              >
                {last ? (
                  <Button variant="gradient" size="lg" pending={starting} pendingLabel="Opening…" onClick={onStart}>
                    {tourStartLabel(start)}
                    <Icon name="arrow-right" size={16} />
                  </Button>
                ) : (
                  <Button variant="gradient" size="lg" onClick={() => go(step + 1)}>
                    Next
                    <Icon name="arrow-right" size={16} />
                  </Button>
                )}
              </motion.span>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
