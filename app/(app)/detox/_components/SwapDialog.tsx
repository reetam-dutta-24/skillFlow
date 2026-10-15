"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/core/Button.jsx";
import { Icon } from "@/components/core/Icon.jsx";
import { useCalmMotion, useHydrated } from "@/components/feedback/useCalmMotion";
import { useFocusTrap } from "@/components/feedback/useFocusTrap";
import { DrawnCheck } from "@/components/tour/tour-motion";
import { reviewConcept } from "@/app/(app)/milestone/[stageId]/actions";
import { reviewRecall } from "@/app/(app)/recall/actions";
import { startSwap, type SwapTarget } from "../actions";

const SWAP_SECONDS = 180;

type Phase =
  | { kind: "loading" }
  | { kind: "none" }
  | { kind: "error"; message: string }
  | { kind: "ready"; target: SwapTarget }
  | { kind: "done"; target: SwapTarget; holds: boolean; review: string };

function errorText(error: string) {
  if (error === "empty") return "Write a sentence or two first.";
  if (error === "unconnected") return "Reviews are switched off on this server, so nothing can be checked right now.";
  return "The review is not available right now. Try again in a minute.";
}

/** "Swap a scroll": three minutes on one recall card or one idea, instead of one more reel. */
export function SwapButton({
  autoOpen = false,
  variant = "gradient",
  size = "lg",
}: {
  autoOpen?: boolean;
  variant?: "gradient" | "outline" | "ghost" | "quiet";
  size?: "sm" | "md" | "lg";
}) {
  const [open, setOpen] = useState(false);
  const hydrated = useHydrated();
  const opened = useRef(false);

  useEffect(() => {
    if (autoOpen && !opened.current) {
      opened.current = true;
      setOpen(true);
    }
  }, [autoOpen]);

  return (
    <>
      <Button variant={variant} size={size} onClick={() => setOpen(true)}>
        <Icon name="repeat-2" size={16} />
        Swap a scroll
      </Button>
      {hydrated
        ? createPortal(<AnimatePresence>{open ? <SwapDialog key="swap" onClose={() => setOpen(false)} /> : null}</AnimatePresence>, document.body)
        : null}
    </>
  );
}

function SwapDialog({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const reduce = useCalmMotion();
  const titleId = useId();
  const fieldId = useId();
  const ref = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<Phase>({ kind: "loading" });
  const [answer, setAnswer] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [left, setLeft] = useState(SWAP_SECONDS);
  const counted = useRef(false);

  const close = useCallback(() => {
    if (counted.current) router.refresh();
    onClose();
  }, [onClose, router]);

  useFocusTrap(ref, true, close);

  useEffect(() => {
    let alive = true;
    void startSwap()
      .then((result) => {
        if (!alive) return;
        if (!result.ok) setPhase({ kind: "error", message: result.error });
        else setPhase(result.target ? { kind: "ready", target: result.target } : { kind: "none" });
      })
      .catch(() => alive && setPhase({ kind: "error", message: "Something went wrong. Check your connection and try again." }));
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (phase.kind !== "ready") return undefined;
    const timer = window.setInterval(() => setLeft((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [phase.kind]);

  useEffect(() => {
    const html = document.documentElement;
    const previous = html.style.overflow;
    html.style.overflow = "hidden";
    return () => {
      html.style.overflow = previous;
    };
  }, []);

  async function submit() {
    if (phase.kind !== "ready") return;
    setBusy(true);
    setError("");
    try {
      const target = phase.target;
      if (target.kind === "recall") {
        const result = await reviewRecall(target.noteId, answer);
        if (!result.ok) return setError(errorText(result.error));
        counted.current = true;
        setPhase({ kind: "done", target, holds: result.quality === "strong", review: result.review });
      } else {
        const result = await reviewConcept({ stageId: target.stageId, concept: target.concept, answer });
        if (!result.ok) return setError(errorText(result.error));
        if (result.understood) counted.current = true;
        setPhase({ kind: "done", target, holds: result.understood, review: result.review });
      }
    } catch {
      setError("Something went wrong. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  const share = left / SWAP_SECONDS;
  const minutes = Math.floor(left / 60);
  const seconds = String(left % 60).padStart(2, "0");

  return (
    <motion.div
      className="sf-swap"
      initial={reduce ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={reduce ? { opacity: 0, transition: { duration: 0 } } : { opacity: 0, transition: { duration: 0.14 } }}
    >
      <button type="button" className="sf-swap-backdrop" tabIndex={-1} aria-hidden="true" onClick={close} />
      <motion.div
        ref={ref}
        className="sf-swap-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        initial={reduce ? false : { y: 18, scale: 0.98 }}
        animate={{ y: 0, scale: 1 }}
        transition={reduce ? { duration: 0 } : { duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
      >
        <header className="sf-swap-head">
          <p className="sf-dtx-kicker">
            <Icon name="repeat-2" size={14} /> Swap a scroll
          </p>
          <button type="button" className="sf-swap-close" onClick={close}>
            <Icon name="x" size={18} />
            <span className="sf-sr">Close</span>
          </button>
        </header>

        {phase.kind === "loading" ? (
          <div className="sf-swap-body" role="status">
            <h2 id={titleId}>Finding one thing for you…</h2>
            <p>A recall that is due, or the next idea on your current stage.</p>
          </div>
        ) : null}

        {phase.kind === "none" ? (
          <div className="sf-swap-body">
            <h2 id={titleId}>Nothing to swap in yet</h2>
            <p>Follow a path and open its first stage. Its ideas show up here, ready for three-minute swaps.</p>
            <div className="sf-swap-actions">
              <Link className="sf-btn sf-btn--gradient sf-btn--md" href="/skills" onClick={close}>
                Browse niches
              </Link>
            </div>
          </div>
        ) : null}

        {phase.kind === "error" ? (
          <div className="sf-swap-body">
            <h2 id={titleId}>That did not open</h2>
            <p role="alert">{phase.message}</p>
          </div>
        ) : null}

        {phase.kind === "ready" ? (
          <div className="sf-swap-body">
            <div className="sf-swap-timer" role="timer" aria-label={`${minutes} minutes ${seconds} seconds left`}>
              <svg viewBox="0 0 40 40" aria-hidden="true">
                <circle cx="20" cy="20" r="17" className="sf-swap-timer-track" />
                <circle cx="20" cy="20" r="17" className="sf-swap-timer-fill" style={{ strokeDashoffset: `${(1 - share) * 106.8}` }} />
              </svg>
              <span aria-hidden="true">
                {minutes}:{seconds}
              </span>
            </div>
            <p className="sf-swap-source">
              {phase.target.kind === "recall" ? "A recall that is due" : "The next idea on your stage"} · {phase.target.stageTitle}
            </p>
            <h2 id={titleId} className="sf-swap-idea">
              {phase.target.concept}
            </h2>
            <label className="sf-swap-label" htmlFor={fieldId}>
              {phase.target.kind === "recall" ? "Explain it again from memory" : "Explain it in your own words"}
            </label>
            <textarea
              id={fieldId}
              className="sf-swap-field"
              rows={4}
              value={answer}
              maxLength={4000}
              placeholder="What it is, and why it matters…"
              onChange={(event) => setAnswer(event.target.value)}
            />
            {left === 0 ? <p className="sf-swap-hint">Three minutes are up. Finish your sentence and send it.</p> : null}
            {error ? (
              <p className="sf-auth-error" role="alert">
                {error}
              </p>
            ) : null}
            <div className="sf-swap-actions">
              <Button variant="ghost" onClick={close}>
                Not now
              </Button>
              <Button variant="gradient" pending={busy} pendingLabel="Reviewing…" onClick={() => void submit()}>
                Check my answer
              </Button>
            </div>
          </div>
        ) : null}

        {phase.kind === "done" ? (
          <div className="sf-swap-body" role="status">
            <div className="sf-swap-result" data-holds={phase.holds ? "true" : undefined}>
              {phase.holds ? <DrawnCheck reduce={reduce} size={28} /> : <Icon name="circle-dot" size={24} />}
              <h2 id={titleId}>{phase.holds ? "Swap done. That one holds." : "Good try. Stay with this idea."}</h2>
            </div>
            <p className="sf-swap-review">{phase.review}</p>
            <p className="sf-swap-hint">
              {phase.holds || phase.target.kind === "recall"
                ? "It counts toward your Detox Score today."
                : "Read the review, then try once more. A held idea counts toward your score."}
            </p>
            <div className="sf-swap-actions">
              {!phase.holds && phase.target.kind === "idea" ? (
                <Button variant="outline" onClick={() => setPhase({ kind: "ready", target: phase.target })}>
                  Try again
                </Button>
              ) : null}
              <Button variant="gradient" onClick={close}>
                Done
              </Button>
            </div>
          </div>
        ) : null}
      </motion.div>
    </motion.div>
  );
}
