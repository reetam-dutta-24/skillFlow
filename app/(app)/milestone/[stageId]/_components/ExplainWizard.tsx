"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ErrorState } from "@/components/feedback/ErrorState.jsx";
import { completeExplainWizard, reviewConcept } from "../actions";

const EASE = [0.22, 1, 0.36, 1] as const;

type StepError = "unavailable" | "unconnected" | "empty";

export function ExplainWizard({
  stageId,
  stageLabel,
  concepts,
  continueHref,
  continueLabel,
}: {
  stageId: string;
  stageLabel: string;
  concepts: string[];
  continueHref: string;
  continueLabel: string;
}) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const fieldRef = useRef<HTMLTextAreaElement>(null);
  const [index, setIndex] = useState(0);
  const [drafts, setDrafts] = useState<string[]>(() => concepts.map(() => ""));
  const [reviews, setReviews] = useState<string[]>(() => concepts.map(() => ""));
  const [held, setHeld] = useState<boolean[]>(() => concepts.map(() => false));
  const [review, setReview] = useState<{ understood: boolean; review: string; noted: boolean } | null>(null);
  const [phase, setPhase] = useState<"write" | "reading" | "reviewed" | "saving" | "done">("write");
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<StepError | null>(null);

  const concept = concepts[index] ?? "";
  const last = index === concepts.length - 1;
  const busy = phase === "reading" || phase === "saving";

  function edit(value: string) {
    setDrafts((current) => current.map((item, itemIndex) => (itemIndex === index ? value : item)));
    setNotice(null);
    if (review) {
      setReview(null);
      setHeld((current) => current.map((item, itemIndex) => (itemIndex === index ? false : item)));
      setPhase("write");
    }
  }

  async function checkIdea() {
    const answer = drafts[index]?.trim() ?? "";
    if (!answer) {
      setNotice("Write this idea in your own words before the step can move on.");
      fieldRef.current?.focus();
      return;
    }
    setNotice(null);
    setError(null);
    setReview(null);
    setPhase("reading");
    const result = await reviewConcept({ stageId, concept, answer });
    if (!result.ok) {
      setError(result.error === "empty" ? "empty" : result.error);
      setPhase("write");
      return;
    }
    setReview({ understood: result.understood, review: result.review, noted: result.noted });
    setReviews((current) => current.map((item, itemIndex) => (itemIndex === index ? result.review : item)));
    setHeld((current) => current.map((item, itemIndex) => (itemIndex === index ? result.understood : item)));
    setPhase("reviewed");
  }

  async function advance() {
    if (!review?.understood) return;
    if (!last) {
      setIndex((current) => current + 1);
      setReview(null);
      setNotice(null);
      setPhase("write");
      return;
    }
    setPhase("saving");
    setError(null);
    const steps = concepts.map((item, itemIndex) => ({
      concept: item,
      answer: drafts[itemIndex]?.trim() ?? "",
      review: reviews[itemIndex] ?? "",
    }));
    const saved = await completeExplainWizard({ stageId, steps });
    if (!saved.ok) {
      setError(saved.error);
      setPhase("reviewed");
      return;
    }
    setPhase("done");
  }

  const stepMotion = reduce
    ? { initial: false, animate: { opacity: 1, y: 0 }, exit: { opacity: 1, y: 0 }, transition: { duration: 0 } }
    : {
        initial: { opacity: 0, y: 18 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -14 },
        transition: { duration: 0.34, ease: EASE },
      };

  if (phase === "done") {
    return (
      <motion.section className="sf-explain-wizard" initial={reduce ? false : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduce ? 0 : 0.4, ease: EASE }}>
        <header className="sf-milestone-head">
          <p>{stageLabel}</p>
          <h1>You explained this stage</h1>
        </header>
        <p className="sf-explain-hint">Each idea is in Notes, with the review that came back.</p>
        <ol className="sf-explain-recap">
          {concepts.map((item, itemIndex) => (
            <li key={item}>
              <strong>{item}</strong>
              <p>{reviews[itemIndex]}</p>
            </li>
          ))}
        </ol>
        <div className="sf-explain-actions">
          <button
            type="button"
            className="sf-milestone-cta"
            onClick={() => {
              router.push(continueHref);
              router.refresh();
            }}
          >
            {continueLabel}
          </button>
          <Link className="sf-notes-textlink" href="/notes">
            Read these in Notes
          </Link>
        </div>
      </motion.section>
    );
  }

  return (
    <div className="sf-explain-wizard">
      <header className="sf-milestone-head">
        <p>{stageLabel} · Explain-back</p>
        <h1>Explain one idea at a time</h1>
      </header>
      <ol className="sf-explain-rail" aria-label="Ideas in this stage">
        {concepts.map((item, itemIndex) => {
          const state = itemIndex === index ? "current" : held[itemIndex] ? "done" : "ahead";
          return (
            <li key={item} data-state={state} aria-current={itemIndex === index ? "step" : undefined} title={item}>
              <span>{itemIndex + 1}</span>
            </li>
          );
        })}
      </ol>
      <AnimatePresence mode="wait">
        <motion.section key={index} className="sf-explain-step" {...stepMotion} onAnimationComplete={() => fieldRef.current?.focus()}>
          <p className="sf-explain-kicker">
            Idea {index + 1} of {concepts.length}
          </p>
          <h2>{concept}</h2>
          <p className="sf-explain-hint">Say what it is, and why it matters or when you would use it. A name on its own will not move this step.</p>
          <label className="sf-explain-label" htmlFor="explain-step">
            Your explanation
          </label>
          <textarea
            id="explain-step"
            ref={fieldRef}
            rows={6}
            value={drafts[index] ?? ""}
            disabled={busy}
            onChange={(event) => edit(event.target.value)}
            placeholder="Write it the way you would tell someone who is one step behind you."
          />
          {notice ? (
            <p className="sf-explain-notice" role="alert">
              {notice}
            </p>
          ) : null}
          <AnimatePresence>
            {phase === "reading" ? (
              <motion.p
                key="reading"
                className="sf-explain-reading"
                aria-live="polite"
                initial={reduce ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={reduce ? undefined : { opacity: 0 }}
              >
                <motion.span
                  className="sf-explain-reading-bar"
                  aria-hidden="true"
                  animate={reduce ? undefined : { scaleX: [0.15, 1, 0.15] }}
                  transition={reduce ? undefined : { duration: 1.35, repeat: Infinity, ease: "easeInOut" }}
                />
                Reading what you wrote
              </motion.p>
            ) : null}
            {review ? (
              <motion.div
                key="review"
                className={review.understood ? "sf-explain-review is-pass" : "sf-explain-review is-retry"}
                role="status"
                initial={reduce ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduce ? undefined : { opacity: 0, y: 8 }}
                transition={{ duration: reduce ? 0 : 0.32, ease: EASE }}
              >
                <p className="sf-explain-kicker">{review.understood ? "This idea holds" : "Stay with this idea"}</p>
                <p>{review.review}</p>
                {review.understood && review.noted ? (
                  <p className="sf-explain-kept">
                    Saved to <Link href="/notes">Notes</Link>.
                  </p>
                ) : null}
              </motion.div>
            ) : null}
          </AnimatePresence>
          <div className="sf-explain-actions">
            {review?.understood ? (
              <button type="button" className="sf-milestone-cta" disabled={busy} onClick={() => void advance()}>
                {phase === "saving" ? "Saving this stage" : last ? "Finish this stage" : "Next idea"}
              </button>
            ) : (
              <button type="button" className="sf-milestone-cta" disabled={busy} onClick={() => void checkIdea()}>
                {review ? "Try this idea again" : "Check this idea"}
              </button>
            )}
          </div>
        </motion.section>
      </AnimatePresence>
      {error ? (
        <ErrorState
          compact
          role="alert"
          title={
            error === "unconnected"
              ? "The explain-back model is not connected yet."
              : error === "empty"
                ? "This idea still needs an explanation."
                : "We could not review this idea."
          }
          description="Nothing was saved, and this step stays where it is."
          retryLabel="Try again"
          onRetry={() => setError(null)}
        />
      ) : null}
    </div>
  );
}
