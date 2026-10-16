"use client";

import { createContext, useContext, useEffect, useRef, useState, useTransition, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import { completeTour } from "@/app/(app)/dashboard/actions";
import { Button } from "@/components/core/Button.jsx";
import { Icon } from "@/components/core/Icon.jsx";
import { HomeTileArt } from "@/components/dashboard/HomeTileArt";
import { useCalmMotion, useHydrated } from "@/components/feedback/useCalmMotion";
import type { TourStart } from "@/lib/tour/entry";
import { TOUR_SLIDES } from "@/lib/tour/slides";
import { OPEN_TOUR_EVENT } from "@/components/navigation/GlobalSearch";
import { TourDialog, type TourCloseReason } from "./TourDialog";

/** A road trip: the tour is a journey through the app. */
const TOUR_ART = "/skills/travel-vlogging.jpg";

type TourContextValue = { done: boolean; open: () => void; skip: () => void; error: string | null };

const TourContext = createContext<TourContextValue | null>(null);

/**
 * The tour's state on Home: finished or not, and the dialog. The tile and the replay link read it, so they can sit in
 * different places on the page. The tour never opens by itself; the finished state comes from the request.
 */
export function TourProvider({ initiallyDone, start, children }: { initiallyDone: boolean; start: TourStart; children: ReactNode }) {
  const [done, setDone] = useState(initiallyDone);
  // "Replay the guided tour" from search lands on /dashboard?tour=1. Only the browser can see that, and the dialog
  // renders after hydration, so reading it here never changes the server markup.
  const [opened, setOpened] = useState(() => typeof window !== "undefined" && new URLSearchParams(window.location.search).get("tour") === "1");
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [, startTransition] = useTransition();
  const reduce = useCalmMotion();
  const hydrated = useHydrated();
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("tour") === "1") {
      params.delete("tour");
      const rest = params.toString();
      window.history.replaceState(null, "", `${window.location.pathname}${rest ? `?${rest}` : ""}${window.location.hash}`);
    }
    const onOpen = () => setOpened(true);
    window.addEventListener(OPEN_TOUR_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_TOUR_EVENT, onOpen);
  }, []);

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

  /** Focus returns to the tour tile's button: Start the tour, or Replay the tour once it is done. */
  function restoreFocus() {
    rootRef.current?.querySelector<HTMLElement>("[data-tour-entry]")?.focus();
  }

  const value: TourContextValue = {
    done,
    error,
    open: () => setOpened(true),
    skip: () => {
      markDone();
      // Start turns into Replay under the pointer; keep the keyboard on the new button.
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

/**
 * The tour tile in "Get to know SkillFlow". It always stays: an invite until the tour is finished or skipped, then a
 * quiet replay tile in the same place.
 */
export function TourTile() {
  const tour = useTour();
  return (
    <section className={tour.done ? "sf-home-tile is-tour is-done" : "sf-home-tile is-tour"} aria-labelledby="sf-tour-invite-title">
      <HomeTileArt src={TOUR_ART} icon="compass" badge={tour.done ? null : "Start here"}>
        <span className="sf-home-tile-play">
          <Icon name={tour.done ? "rotate-ccw" : "play"} size={18} />
        </span>
      </HomeTileArt>
      <p className="sf-home-tile-kicker">Guided tour · {TOUR_SLIDES.length} stops</p>
      <h2 id="sf-tour-invite-title">{tour.done ? "Replay the guided tour" : "New here? Take the guided tour"}</h2>
      <p className="sf-home-tile-text">
        {tour.done
          ? "Every feature, hands-on, whenever you want a refresher."
          : "Every feature, with something small to try on each. Nothing you do in it is saved."}
      </p>
      <div className="sf-home-tile-actions">
        {tour.done ? (
          <Button variant="outline" size="md" data-tour-entry onClick={tour.open}>
            <Icon name="rotate-ccw" size={15} />
            Replay the tour
          </Button>
        ) : (
          <>
            <Button variant="gradient" size="md" data-tour-entry onClick={tour.open}>
              Start the tour
            </Button>
            <button type="button" className="sf-tour-quiet sf-hit" onClick={tour.skip}>
              Skip
            </button>
          </>
        )}
      </div>
      {tour.error ? (
        <p className="sf-tour-error" role="alert">
          {tour.error}
        </p>
      ) : null}
    </section>
  );
}
