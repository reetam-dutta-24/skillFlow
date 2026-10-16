"use client";

import { createContext, useContext, useRef, useState, useTransition, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import { completeTour } from "@/app/(app)/dashboard/actions";
import { Button } from "@/components/core/Button.jsx";
import { Icon } from "@/components/core/Icon.jsx";
import { SkillImage } from "@/components/core/SkillImage";
import { useCalmMotion, useHydrated } from "@/components/feedback/useCalmMotion";
import type { TourStart } from "@/lib/tour/entry";
import { TOUR_SLIDES } from "@/lib/tour/slides";
import { TourDialog, type TourCloseReason } from "./TourDialog";

const INVITE_THUMBS = ["/stages/full-stack-web-dev/2.jpg", "/stages/full-stack-web-dev/1.jpg", "/stages/full-stack-web-dev/3.jpg"];

type TourContextValue = { done: boolean; open: () => void; skip: () => void; error: string | null };

const TourContext = createContext<TourContextValue | null>(null);

/**
 * The tour's state on Home: finished or not, and the dialog. The tile and the replay link read it, so they can sit in
 * different places on the page. The tour never opens by itself; the finished state comes from the request.
 */
export function TourProvider({ initiallyDone, start, children }: { initiallyDone: boolean; start: TourStart; children: ReactNode }) {
  const [done, setDone] = useState(initiallyDone);
  const [opened, setOpened] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [, startTransition] = useTransition();
  const reduce = useCalmMotion();
  const hydrated = useHydrated();
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement>(null);

  /** Finish or Skip, saved once. Shows the replay link straight away and brings the tile back if the save fails. */
  function markDone() {
    if (done) return;
    setDone(true);
    setError(null);
    startTransition(async () => {
      const result = await completeTour();
      if (!result.ok) {
        setDone(false);
        setError(result.error);
      }
    });
  }

  function close(reason: TourCloseReason) {
    if (reason === "skip" || reason === "finish") markDone();
    setOpened(false);
  }

  async function goToStart() {
    setStarting(true);
    if (!done) {
      // Saved before leaving, so Home shows the replay link when the learner comes back.
      await completeTour().catch(() => null);
      setDone(true);
    }
    router.push(start.href);
  }

  /** Focus returns to whichever entry is on Home now: the replay link, or the tile's start button. */
  function restoreFocus() {
    rootRef.current?.querySelector<HTMLElement>("[data-tour-entry]")?.focus();
  }

  const value: TourContextValue = {
    done,
    error,
    open: () => setOpened(true),
    skip: () => {
      markDone();
      // The tile goes away under the pointer; keep the keyboard on the replay link that takes its place.
      requestAnimationFrame(restoreFocus);
    },
  };

  return (
    <TourContext.Provider value={value}>
      <div ref={rootRef} className="sf-home-top">
        {children}
      </div>
      {hydrated
        ? createPortal(
            <AnimatePresence onExitComplete={restoreFocus}>
              {opened ? <TourDialog key="tour" reduce={reduce} start={start} starting={starting} onClose={close} onStart={goToStart} /> : null}
            </AnimatePresence>,
            document.body,
          )
        : null}
    </TourContext.Provider>
  );
}

function useTour() {
  const value = useContext(TourContext);
  if (!value) throw new Error("useTour needs TourProvider");
  return value;
}

/** The small link in the Home hero once the tour is finished or skipped. */
export function ReplayTourButton() {
  const tour = useTour();
  if (!tour.done) return null;
  return (
    <button type="button" className="sf-home-replay sf-hit" data-tour-entry onClick={tour.open}>
      <Icon name="rotate-ccw" size={14} />
      Replay the tour
    </button>
  );
}

/** The tour tile in "Get to know SkillFlow", until the tour is finished or skipped. */
export function TourTile() {
  const tour = useTour();
  if (tour.done) {
    return tour.error ? (
      <p className="sf-tour-error" role="alert">
        {tour.error}
      </p>
    ) : null;
  }
  return (
    <section className="sf-home-tile is-tour" aria-labelledby="sf-tour-invite-title">
      <span className="sf-home-tile-badge">Start here</span>
      <span className="sf-tour-invite-art" aria-hidden="true">
        {INVITE_THUMBS.map((src) => (
          <span key={src} className="sf-tour-invite-thumb">
            <SkillImage src={src} alt="" fill sizes="88px" />
          </span>
        ))}
        <span className="sf-tour-invite-play">
          <Icon name="play" size={14} />
        </span>
      </span>
      <p className="sf-home-tile-kicker">Guided tour · {TOUR_SLIDES.length} stops</p>
      <h2 id="sf-tour-invite-title">New here? Take the guided tour</h2>
      <p className="sf-home-tile-text">Every feature, with something small to try on each. Nothing you do in it is saved.</p>
      <div className="sf-home-tile-actions">
        <Button variant="gradient" size="md" data-tour-entry onClick={tour.open}>
          Start the tour
        </Button>
        <button type="button" className="sf-tour-quiet sf-hit" onClick={tour.skip}>
          Skip
        </button>
      </div>
      {tour.error ? (
        <p className="sf-tour-error" role="alert">
          {tour.error}
        </p>
      ) : null}
    </section>
  );
}
