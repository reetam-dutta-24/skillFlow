"use client";

import { useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import { completeTour } from "@/app/(app)/dashboard/actions";
import { Button } from "@/components/core/Button.jsx";
import { Icon } from "@/components/core/Icon.jsx";
import { SkillImage } from "@/components/core/SkillImage";
import { useCalmMotion, useHydrated } from "@/components/feedback/useCalmMotion";
import type { TourStart } from "@/lib/tour/entry";
import { TourDialog, type TourCloseReason } from "./TourDialog";

const INVITE_THUMBS = ["/stages/full-stack-web-dev/2.jpg", "/stages/full-stack-web-dev/1.jpg", "/stages/full-stack-web-dev/3.jpg"];

/**
 * The tour's place on Home: an invite card until the tour is finished or skipped, then one quiet "Replay the tour"
 * link. The tour never opens by itself. The finished state is personal and comes from the request.
 */
export function HomeTour({ initiallyDone, start }: { initiallyDone: boolean; start: TourStart }) {
  const [done, setDone] = useState(initiallyDone);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [, startTransition] = useTransition();
  const reduce = useCalmMotion();
  const hydrated = useHydrated();
  const router = useRouter();
  const entryRef = useRef<HTMLDivElement>(null);

  /** Finish or Skip, saved once. Shows the replay link straight away and puts the card back if the save fails. */
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
    setOpen(false);
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

  /** Focus returns to whichever entry is on Home now: the replay link, or the card's start button. */
  function restoreFocus() {
    entryRef.current?.querySelector<HTMLElement>("[data-tour-entry]")?.focus();
  }

  return (
    <div ref={entryRef} className="sf-tour-entry">
      {done ? (
        <p className="sf-tour-replay">
          <button type="button" className="sf-tour-quiet sf-hit" data-tour-entry onClick={() => setOpen(true)}>
            <Icon name="rotate-ccw" size={14} />
            Replay the tour
          </button>
        </p>
      ) : (
        <section className="sf-tour-invite" aria-labelledby="sf-tour-invite-title">
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
          <div className="sf-tour-invite-body">
            <p className="sf-tour-invite-kicker">New here · 2 minutes</p>
            <h2 id="sf-tour-invite-title">Take the 2-minute tour</h2>
            <p>See how SkillFlow works, and try each part as you go.</p>
          </div>
          <div className="sf-tour-invite-actions">
            <Button variant="gradient" size="md" data-tour-entry onClick={() => setOpen(true)}>
              Start the tour
            </Button>
            <button
              type="button"
              className="sf-tour-quiet sf-hit"
              onClick={() => {
                markDone();
                // The card goes away under the pointer; keep the keyboard on the replay link that takes its place.
                requestAnimationFrame(restoreFocus);
              }}
            >
              Skip
            </button>
          </div>
        </section>
      )}
      {error ? (
        <p className="sf-tour-error" role="alert">
          {error}
        </p>
      ) : null}
      {hydrated
        ? createPortal(
            <AnimatePresence onExitComplete={restoreFocus}>
              {open ? (
                <TourDialog key="tour" reduce={reduce} start={start} starting={starting} onClose={close} onStart={goToStart} />
              ) : null}
            </AnimatePresence>,
            document.body,
          )
        : null}
    </div>
  );
}
