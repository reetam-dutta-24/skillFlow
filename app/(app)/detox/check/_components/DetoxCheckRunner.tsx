"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/core/Button.jsx";
import { Icon } from "@/components/core/Icon.jsx";
import { useCalmMotion } from "@/components/feedback/useCalmMotion";
import { DETOX_QUESTIONS, SECTION_LABELS, type DetoxAnswers } from "@/lib/detox/questions";
import { BANDS } from "@/lib/detox/score";
import { NOT_MEDICAL } from "@/lib/detox/state";
import { EASE_IN, EASE_OUT, SOFT_SPRING, calm } from "@/components/tour/tour-motion";
import { finishDetoxCheck, saveDetoxAnswers } from "../../actions";

const TOTAL = DETOX_QUESTIONS.length;

function typingTarget(target: EventTarget | null) {
  return target instanceof HTMLElement && (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));
}

/**
 * The baseline self-check: an intro, then one question per screen. Each answer is saved when the learner moves on, so
 * closing the tab loses at most one. The last answer works out the starting score in code.
 */
export function DetoxCheckRunner({ initialAnswers, startAt, started }: { initialAnswers: DetoxAnswers; startAt: number; started: boolean }) {
  const router = useRouter();
  const reduce = useCalmMotion();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [phase, setPhase] = useState<"intro" | "question" | "finishing">("intro");
  const [index, setIndex] = useState(Math.min(startAt, TOTAL - 1));
  const [direction, setDirection] = useState(1);
  const [answers, setAnswers] = useState<DetoxAnswers>(initialAnswers);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  const question = DETOX_QUESTIONS[index];
  const value = answers[question.id];
  const answered = Array.isArray(value) ? value.length > 0 : value !== undefined;
  const count = DETOX_QUESTIONS.filter((item) => answers[item.id] !== undefined).length;
  const last = index === TOTAL - 1;
  const percent = Math.round(((index + 1) / TOTAL) * 100);

  useEffect(() => {
    if (phase === "question") headingRef.current?.focus({ preventScroll: true });
  }, [index, phase]);

  function choose(id: string) {
    setError("");
    if (question.kind !== "chips") {
      setAnswers((current) => ({ ...current, [question.id]: id }));
      return;
    }
    setAnswers((current) => {
      const picks = Array.isArray(current[question.id]) ? [...(current[question.id] as string[])] : [];
      let next = picks.includes(id) ? picks.filter((item) => item !== id) : [...picks, id];
      if (id === question.noneId && next.includes(id)) next = [id];
      else if (question.noneId) next = next.filter((item) => item !== question.noneId || id === question.noneId);
      return { ...current, [question.id]: next };
    });
  }

  const back = useCallback(() => {
    if (index === 0) {
      setPhase("intro");
      return;
    }
    setDirection(-1);
    setIndex((current) => current - 1);
  }, [index]);

  const next = useCallback(async () => {
    if (!answered || pending) return;
    setPending(true);
    setError("");
    try {
      const saved = await saveDetoxAnswers({ [question.id]: answers[question.id] });
      if (!saved.ok) {
        setError(saved.error);
        return;
      }
      if (!last) {
        setDirection(1);
        setIndex((current) => current + 1);
        window.scrollTo({ top: 0 });
        return;
      }
      setPhase("finishing");
      const finished = await finishDetoxCheck();
      if (!finished.ok) {
        setError(finished.error);
        setPhase("question");
        return;
      }
      router.push("/detox");
      router.refresh();
    } catch {
      setError("Your answer could not be saved. Check your connection and try again.");
      setPhase("question");
    } finally {
      setPending(false);
    }
  }, [answered, pending, question.id, answers, last, router]);

  useEffect(() => {
    if (phase !== "question") return undefined;
    function onKey(event: KeyboardEvent) {
      if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || typingTarget(event.target)) return;
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        back();
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        void next();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, back, next]);

  if (phase === "intro") {
    return (
      <div className="sf-dtx-check">
        <section className="sf-dtx-intro" aria-labelledby="dtx-intro-title">
          <div className="sf-dtx-intro-copy">
            <p className="sf-dtx-kicker">
              <Icon name="leaf" size={14} /> Dopamine Detox
            </p>
            <h1 id="dtx-intro-title">Your dopamine detox, with proof</h1>
            <p className="sf-dtx-lede">
              Twenty quick questions about your screen time, focus, sleep, and offline life give you a starting score. After that, only
              real learning moves it: ideas you explain, recalls you answer, and focused minutes.
            </p>
            <ul className="sf-dtx-facts">
              <li>
                <Icon name="clock" size={16} /> About three minutes, one question at a time
              </li>
              <li>
                <Icon name="save" size={16} /> Saved as you go. Leave and come back any time
              </li>
              <li>
                <Icon name="lock" size={16} /> Private to you. Delete it whenever you like
              </li>
            </ul>
            <p className="sf-dtx-note">{NOT_MEDICAL} The questions are SkillFlow&apos;s own and are not a clinical questionnaire.</p>
            <Button variant="gradient" size="xl" onClick={() => setPhase("question")}>
              {started ? `Continue (${count} of ${TOTAL} answered)` : "Start the self-check"}
              <Icon name="arrow-right" size={18} />
            </Button>
          </div>
          <ol className="sf-dtx-bands" aria-label="The four bands">
            {BANDS.map((band, position) => (
              <li key={band.id} data-band={band.id}>
                <span className="sf-dtx-bands-dot" aria-hidden="true" />
                <div>
                  <strong>{band.label}</strong>
                  <span>
                    {position === 0 ? `Below ${BANDS[1].min}` : position === BANDS.length - 1 ? `${band.min} and up` : `${band.min} to ${BANDS[position + 1].min - 1}`}
                  </span>
                  <p>{band.blurb}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      </div>
    );
  }

  if (phase === "finishing") {
    return (
      <div className="sf-dtx-check sf-dtx-finishing" role="status" aria-live="polite">
        <span className="sf-btn-spinner" aria-hidden="true" />
        <h1>Working out your starting score…</h1>
        <p>Plain arithmetic on your answers, then a few next steps written for you.</p>
      </div>
    );
  }

  return (
    <div className="sf-dtx-check">
      <div className="sf-dtx-progress">
        <p className="sf-dtx-progress-row">
          <span>
            Question {index + 1} of {TOTAL}
          </span>
          <span>{SECTION_LABELS[question.section]}</span>
        </p>
        <div className="sf-tour-track" role="progressbar" aria-label="Questions" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}>
          <motion.span className="sf-tour-fill" initial={false} animate={{ width: `${percent}%` }} transition={calm(reduce, SOFT_SPRING)} />
        </div>
      </div>

      <form
        className="sf-dtx-q-stage"
        aria-live="polite"
        onSubmit={(event) => {
          event.preventDefault();
          void next();
        }}
      >
        <AnimatePresence mode="wait" custom={direction} initial={false}>
          <motion.fieldset
            key={question.id}
            className="sf-dtx-q"
            aria-labelledby={`dtx-q-${question.id}`}
            custom={direction}
            initial={reduce ? false : { opacity: 0, x: direction * 40 }}
            animate={{ opacity: 1, x: 0, transition: calm(reduce, { duration: 0.24, ease: EASE_OUT }) }}
            exit={reduce ? { opacity: 0, transition: { duration: 0 } } : { opacity: 0, x: direction * -28, transition: { duration: 0.14, ease: EASE_IN } }}
          >
            <h1 ref={headingRef} tabIndex={-1} className="sf-dtx-q-title" id={`dtx-q-${question.id}`}>
              {question.prompt}
            </h1>
            {question.hint ? <p className="sf-dtx-q-hint">{question.hint}</p> : null}
            {question.kind === "scale" ? (
              <div className="sf-dtx-q-scale">
                {question.options.map((option) => (
                  <label key={option.id} className="sf-dtx-q-scale-option" data-on={value === option.id ? "true" : undefined}>
                    <input type="radio" name={question.id} value={option.id} checked={value === option.id} onChange={() => choose(option.id)} />
                    <strong>{option.id}</strong>
                    <span>{option.label.replace(/^\d · /, "").replace(/^\d$/, "")}</span>
                  </label>
                ))}
              </div>
            ) : question.kind === "chips" ? (
              <div className="sf-dtx-q-chips">
                {question.options.map((option) => {
                  const on = Array.isArray(value) && value.includes(option.id);
                  return (
                    <label key={option.id} className="sf-dtx-chip" data-on={on ? "true" : undefined}>
                      <input type="checkbox" name={question.id} value={option.id} checked={on} onChange={() => choose(option.id)} />
                      <span>
                        {on ? <Icon name="check" size={14} /> : null}
                        {option.label}
                      </span>
                    </label>
                  );
                })}
              </div>
            ) : (
              <div className="sf-dtx-q-options">
                {question.options.map((option) => (
                  <label key={option.id} className="sf-dtx-q-option" data-on={value === option.id ? "true" : undefined}>
                    <input type="radio" name={question.id} value={option.id} checked={value === option.id} onChange={() => choose(option.id)} />
                    <span className="sf-dtx-q-radio" aria-hidden="true" />
                    <span>{option.label}</span>
                  </label>
                ))}
              </div>
            )}
          </motion.fieldset>
        </AnimatePresence>

        {error ? (
          <p className="sf-auth-error" role="alert">
            {error}
          </p>
        ) : null}

        <div className="sf-dtx-q-nav">
          <span className="sf-lwiz-cta">
            <Button variant="ghost" size="lg" onClick={back}>
              <Icon name="arrow-left" size={16} />
              Back
            </Button>
          </span>
          <span className="sf-lwiz-cta">
            <Button type="submit" variant="gradient" size="lg" disabled={!answered} pending={pending} pendingLabel="Saving…">
              {last ? "See my score" : "Next"}
              <Icon name="arrow-right" size={16} />
            </Button>
          </span>
        </div>
      </form>
    </div>
  );
}
