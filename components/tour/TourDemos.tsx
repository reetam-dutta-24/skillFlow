"use client";

import { useId, useState, type ReactNode } from "react";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { Button } from "@/components/core/Button.jsx";
import { Icon } from "@/components/core/Icon.jsx";
import { SkillImage } from "@/components/core/SkillImage";
import {
  BEYOND_START,
  BEYOND_TILES,
  DEMO_PACES,
  PATH_DEMO_STAGES,
  PRACTICE_IDEA,
  PRACTICE_MAX_CHARS,
  PROGRESS_START,
  RECALL_GAP_HOURS,
  RECALL_QUESTION,
  WEEK_DAYS,
  WEEK_DAY_NAMES,
  allBeyondSeen,
  demoMastery,
  formatMinutes,
  passDemoStage,
  planWeek,
  practiceNote,
  tapPathStage,
  toggleBeyondTile,
  weeklyMinutes,
  type DemoPace,
  type PathTap,
  type PracticeReview,
} from "@/lib/tour/demos";
import { DemoSuccess, DrawnCheck, EASE_OUT, SOFT_SPRING, calm } from "./tour-motion";

/**
 * The "Try it" demos. Sandboxed: local state only, no database, no model, no navigation. The rules they follow
 * live in lib/tour/demos.ts with unit tests.
 */

function DemoFrame({ label, children }: { label: string; children: ReactNode }) {
  const id = useId();
  return (
    <div className="sf-tour-demo" role="group" aria-labelledby={id}>
      <p className="sf-tour-demo-tag" id={id}>
        <span className="sf-tour-demo-dot" aria-hidden="true" />
        Try it<span className="sr-only">: {label}</span>
      </p>
      {children}
    </div>
  );
}

/** Height and fade for a line that opens under its control. */
function Reveal({ reduce, children, className, id }: { reduce: boolean; children: ReactNode; className?: string; id?: string }) {
  return (
    <motion.div
      id={id}
      className={className}
      initial={reduce ? false : { height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={reduce ? { opacity: 0, transition: { duration: 0 } } : { height: 0, opacity: 0 }}
      transition={calm(reduce, { duration: 0.22, ease: EASE_OUT })}
      style={{ overflow: "hidden" }}
    >
      {children}
    </motion.div>
  );
}

/* ── 2. Paths and stages ──────────────────────────────────────────────────── */

export function PathDemo({ reduce }: { reduce: boolean }) {
  const [taps, setTaps] = useState<Record<number, PathTap>>({});
  const opened = taps[0]?.kind === "open";

  return (
    <DemoFrame label="a sample path of three stages">
      <ol className="sf-tour-path">
        {PATH_DEMO_STAGES.map((stage, index) => {
          const tap = taps[index];
          const locked = index > 0;
          const state = locked ? "locked" : opened ? "open" : "ready";
          return (
            <li key={stage.title} className="sf-tour-path-item" data-state={state}>
              <button
                type="button"
                className="sf-tour-path-stage"
                aria-expanded={Boolean(tap)}
                onClick={() => setTaps((current) => ({ ...current, [index]: tapPathStage(index) }))}
              >
                <span className="sf-tour-path-thumb">
                  <SkillImage src={stage.image} alt="" fill sizes="72px" />
                </span>
                <span className="sf-tour-path-text">
                  <span className="sf-tour-path-n">Stage {index + 1}</span>
                  <span className="sf-tour-path-title">{stage.title}</span>
                </span>
                <span className="sf-tour-path-state" aria-hidden="true">
                  <Icon name={locked ? "lock" : opened ? "lock-open" : "chevron-right"} size={16} />
                </span>
                <span className="sr-only">{locked ? ", locked" : opened ? ", open" : ""}</span>
              </button>
              <div role="status" className="sf-tour-path-msgwrap">
                <AnimatePresence initial={false}>
                  {tap ? (
                    <Reveal reduce={reduce} className="sf-tour-path-msg">
                      {tap.kind === "open" ? (
                        <p data-kind="open">
                          <DrawnCheck reduce={reduce} size={18} />
                          <span>{tap.message}</span>
                        </p>
                      ) : (
                        <p data-kind="locked">
                          <Icon name="lock" size={14} />
                          <span>{tap.message}</span>
                        </p>
                      )}
                    </Reveal>
                  ) : null}
                </AnimatePresence>
              </div>
            </li>
          );
        })}
      </ol>
    </DemoFrame>
  );
}

/* ── 3. Explain-back practice ─────────────────────────────────────────────── */

export function ExplainDemo({
  reduce,
  draft,
  onDraft,
  review,
  onCheck,
}: {
  reduce: boolean;
  draft: string;
  onDraft: (value: string) => void;
  review: PracticeReview | null;
  onCheck: () => void;
}) {
  const fieldId = useId();
  const hintId = useId();
  const holds = review?.verdict === "holds";
  const words = draft.trim() ? draft.trim().split(/\s+/).length : 0;

  return (
    <DemoFrame label="explain a sample idea">
      <div className="sf-tour-explain">
        <p className="sf-tour-sample">
          <Icon name="flask-conical" size={14} />
          Practice sample · a scripted check, not the real AI
        </p>
        <p className="sf-tour-idea">
          <span>Idea 1 of 1</span>
          {PRACTICE_IDEA}
        </p>
        <label className="sf-tour-label" htmlFor={fieldId}>
          Explain it in your own words
        </label>
        <textarea
          id={fieldId}
          className="sf-tour-field"
          rows={3}
          maxLength={PRACTICE_MAX_CHARS}
          value={draft}
          placeholder="A variable is…"
          aria-describedby={hintId}
          onChange={(event) => onDraft(event.target.value)}
        />
        <div className="sf-tour-explain-row">
          <span id={hintId} className="sf-tour-count">
            {words === 1 ? "1 word" : `${words} words`} · say what it is, and why
          </span>
          <Button variant="gradient" size="sm" onClick={onCheck}>
            {review ? "Check it again" : "Check my explanation"}
          </Button>
        </div>
        <div role="status" className="sf-tour-review-wrap">
          <AnimatePresence initial={false} mode="wait">
            {review ? (
              <motion.div
                key={`${review.verdict}-${review.hint}`}
                className="sf-tour-review"
                data-verdict={review.verdict}
                initial={reduce ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduce ? { opacity: 0, transition: { duration: 0 } } : { opacity: 0, transition: { duration: 0.12 } }}
                transition={calm(reduce, { duration: 0.22, ease: EASE_OUT })}
              >
                {holds ? <DrawnCheck reduce={reduce} size={22} /> : <Icon name="circle-alert" size={20} />}
                <div>
                  <p className="sf-tour-review-title">{review.title}</p>
                  <p>{review.hint}</p>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
        <div className="sf-tour-gate" data-open={holds ? "true" : undefined}>
          <span className="sf-tour-gate-icon" aria-hidden="true">
            <AnimatePresence initial={false} mode="wait">
              <motion.span
                key={holds ? "open" : "shut"}
                initial={reduce ? false : { opacity: 0, y: holds ? 4 : -4, rotate: holds ? -12 : 0 }}
                animate={{ opacity: 1, y: 0, rotate: 0 }}
                exit={reduce ? { opacity: 0, transition: { duration: 0 } } : { opacity: 0, y: -3, transition: { duration: 0.1 } }}
                transition={calm(reduce, { duration: 0.26, ease: EASE_OUT })}
              >
                <Icon name={holds ? "lock-open" : "lock"} size={16} />
              </motion.span>
            </AnimatePresence>
          </span>
          <span className="sf-tour-gate-text">
            <span>Next stage</span>
            CSS Layout & Responsive Design
          </span>
          <span className="sf-tour-gate-state">{holds ? "Open" : "Locked"}</span>
        </div>
      </div>
    </DemoFrame>
  );
}

/* ── 4. Notes and recall ──────────────────────────────────────────────────── */

export function NotesDemo({ reduce, answer }: { reduce: boolean; answer: string | null }) {
  const [flipped, setFlipped] = useState(false);
  const [flips, setFlips] = useState(0);
  const note = practiceNote(answer);
  const hintId = useId();

  return (
    <DemoFrame label="flip a note into its recall question">
      <button
        type="button"
        className="sf-tour-flip"
        aria-pressed={flipped}
        aria-describedby={hintId}
        onClick={() => {
          setFlipped((value) => !value);
          setFlips((count) => count + 1);
        }}
      >
        <motion.span
          className="sf-tour-flip-inner"
          initial={false}
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={calm(reduce, { duration: 0.38, ease: EASE_OUT })}
        >
          <span className="sf-tour-face" aria-hidden={flipped}>
            <span className="sf-tour-face-top">
              <span className="sf-tour-face-tag">
                <Icon name="notebook-pen" size={14} /> Your note
              </span>
              <span className="sf-tour-face-src">{note.fromAnswer ? "From your answer" : "Sample"}</span>
            </span>
            <span className="sf-tour-face-idea">{PRACTICE_IDEA}</span>
            <span className="sf-tour-face-text">{note.text}</span>
            <span className="sf-tour-face-foot">Saved to Notes with its review</span>
          </span>
          <span className="sf-tour-face sf-tour-face--back" aria-hidden={!flipped}>
            <span className="sf-tour-face-top">
              <span className="sf-tour-face-tag">
                <Icon name="history" size={14} /> Recall
              </span>
              <span className="sf-tour-face-src">In {RECALL_GAP_HOURS} hours</span>
            </span>
            <span className="sf-tour-face-q">{RECALL_QUESTION}</span>
            <span className="sf-tour-face-foot">Answer from memory. It comes back once more, {RECALL_GAP_HOURS} hours later.</span>
          </span>
        </motion.span>
      </button>
      <p className="sf-tour-hint" id={hintId}>
        <Icon name="repeat-2" size={14} /> Tap the card to flip it
      </p>
      <div role="status">
        {flips > 0 ? <DemoSuccess reduce={reduce}>That is recall: the question first, your own answer from memory.</DemoSuccess> : null}
      </div>
    </DemoFrame>
  );
}

/* ── 5. Progress ──────────────────────────────────────────────────────────── */

/** A number that rolls up to its new value. */
function Roll({ value, reduce }: { value: string | number; reduce: boolean }) {
  return (
    <span className="sf-tour-roll">
      <AnimatePresence initial={false} mode="popLayout">
        <motion.span
          key={value}
          initial={reduce ? false : { y: "70%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={reduce ? { opacity: 0, transition: { duration: 0 } } : { y: "-70%", opacity: 0, transition: { duration: 0.14 } }}
          transition={calm(reduce, { duration: 0.26, ease: EASE_OUT })}
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

const RING_R = 46;
const RING_C = 2 * Math.PI * RING_R;

export function ProgressDemo({ reduce }: { reduce: boolean }) {
  const [state, setState] = useState(PROGRESS_START);
  const mastery = demoMastery(state);
  const complete = state.passed >= state.total;
  const tried = state.passed > PROGRESS_START.passed;

  return (
    <DemoFrame label="pass a sample stage">
      <div className="sf-tour-progress-demo">
        <div className="sf-tour-ring" role="img" aria-label={`Mastery ${mastery}%`}>
          <svg viewBox="0 0 120 120" aria-hidden="true">
            <defs>
              <linearGradient id="sf-tour-ring-grad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="var(--preset-bright)" />
                <stop offset="100%" stopColor="var(--accent)" />
              </linearGradient>
            </defs>
            <circle className="sf-tour-ring-track" cx="60" cy="60" r={RING_R} />
            <motion.circle
              className="sf-tour-ring-fill"
              cx="60"
              cy="60"
              r={RING_R}
              stroke="url(#sf-tour-ring-grad)"
              strokeDasharray={RING_C}
              initial={false}
              animate={{ strokeDashoffset: RING_C * (1 - mastery / 100) }}
              transition={calm(reduce, SOFT_SPRING)}
            />
          </svg>
          <span className="sf-tour-ring-label" aria-hidden="true">
            <Roll value={`${mastery}%`} reduce={reduce} />
            <span>Mastery</span>
          </span>
        </div>
        <div className="sf-tour-stats">
          <p className="sf-tour-stat">
            <span className="sf-tour-stat-icon" data-tone="streak" aria-hidden="true">
              <Icon name="flame" size={18} />
            </span>
            <span className="sf-tour-stat-num">
              <Roll value={state.streak} reduce={reduce} />
            </span>
            <span className="sf-tour-stat-label">day streak</span>
          </p>
          <div className="sf-tour-stat sf-tour-stat--stages">
            <span className="sf-tour-stat-label">
              {state.passed} of {state.total} stages passed
            </span>
            <span className="sf-tour-segments" aria-hidden="true">
              {Array.from({ length: state.total }, (_, index) => (
                <span key={index} data-on={index < state.passed ? "true" : undefined}>
                  <motion.span
                    initial={false}
                    animate={{ scaleX: index < state.passed ? 1 : 0 }}
                    transition={calm(reduce, SOFT_SPRING)}
                  />
                </span>
              ))}
            </span>
          </div>
          {complete ? (
            <Button variant="quiet" size="sm" onClick={() => setState(PROGRESS_START)}>
              <Icon name="rotate-ccw" size={14} />
              Start over
            </Button>
          ) : (
            <Button variant="gradient" size="sm" onClick={() => setState((current) => passDemoStage(current))}>
              Pass a stage
            </Button>
          )}
        </div>
      </div>
      <div role="status">
        {tried ? (
          <DemoSuccess key={complete ? "all" : "some"} reduce={reduce}>
            {complete ? "Every stage passed. That is when a certificate opens." : "One more stage, one more day on your streak."}
          </DemoSuccess>
        ) : null}
      </div>
    </DemoFrame>
  );
}

/* ── 6. Make it yours: pace ───────────────────────────────────────────────── */

export function PlanDemo({ reduce }: { reduce: boolean }) {
  const [pace, setPace] = useState<DemoPace>("steady");
  const [tried, setTried] = useState(false);
  const week = planWeek(pace);
  const total = weeklyMinutes(pace);

  return (
    <DemoFrame label="pick a pace for a sample week">
      <div className="sf-tour-chips" role="group" aria-label="Pace">
        {DEMO_PACES.map((option) => (
          <button
            key={option.id}
            type="button"
            className="sf-tour-chip"
            aria-pressed={pace === option.id}
            onClick={() => {
              if (option.id === pace) return;
              setPace(option.id);
              setTried(true);
            }}
          >
            {pace === option.id ? (
              <motion.span
                layoutId="sf-tour-chip-on"
                className="sf-tour-chip-on"
                transition={calm(reduce, SOFT_SPRING)}
                aria-hidden="true"
              />
            ) : null}
            <span className="sf-tour-chip-text">{option.label}</span>
          </button>
        ))}
      </div>
      <LayoutGroup id="sf-tour-week">
        <ol className="sf-tour-week" aria-label="Sample week">
          {WEEK_DAYS.map((day, index) => {
            const session = week.find((item) => item.day === index);
            return (
              <li key={day} className="sf-tour-day">
                <span className="sf-tour-day-name" aria-hidden="true">
                  {day}
                </span>
                <span className="sf-tour-day-slot">
                  {session ? (
                    <motion.span
                      layoutId={session.id}
                      className="sf-tour-session"
                      data-kind={session.kind === "Explain back" ? "explain" : "study"}
                      initial={tried && !reduce ? { opacity: 0, scale: 0.85 } : false}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={calm(reduce, SOFT_SPRING)}
                    >
                      <span aria-hidden="true">{session.minutes}</span>
                      <span className="sf-tour-session-unit" aria-hidden="true">
                        min
                      </span>
                    </motion.span>
                  ) : (
                    <span className="sf-tour-rest" aria-hidden="true" />
                  )}
                </span>
                <span className="sr-only">
                  {WEEK_DAY_NAMES[index]}: {session ? `${session.minutes} minutes, ${session.kind}` : "rest"}
                </span>
              </li>
            );
          })}
        </ol>
      </LayoutGroup>
      <p className="sf-tour-week-sum">
        <span>
          <strong>{week.length} sessions</strong> · {formatMinutes(total)} a week
        </span>
        <span className="sf-tour-legend">
          <span className="sf-tour-legend-key" aria-hidden="true" /> Explain-back
        </span>
      </p>
      <div role="status">
        {tried ? (
          <DemoSuccess key={pace} reduce={reduce}>
            Your week now fits a {pace} pace. Change it any time.
          </DemoSuccess>
        ) : null}
      </div>
    </DemoFrame>
  );
}

/* ── 7. Beyond the path ───────────────────────────────────────────────────── */

export function BeyondDemo({ reduce }: { reduce: boolean }) {
  const [state, setState] = useState(BEYOND_START);
  const baseId = useId();
  const done = allBeyondSeen(state);

  return (
    <DemoFrame label="open three tiles">
      <ul className="sf-tour-tiles">
        {BEYOND_TILES.map((tile, index) => {
          const open = state.open.includes(tile.id);
          const bodyId = `${baseId}-${tile.id}`;
          return (
            <li key={tile.id} className="sf-tour-tile" data-open={open ? "true" : undefined} data-tone={index + 1}>
              <button
                type="button"
                aria-expanded={open}
                aria-controls={open ? bodyId : undefined}
                onClick={() => setState((current) => toggleBeyondTile(current, tile.id))}
              >
                <span className="sf-tour-tile-icon" aria-hidden="true">
                  <Icon name={tile.icon} size={18} />
                </span>
                <span className="sf-tour-tile-title">{tile.title}</span>
                {state.seen.includes(tile.id) ? <span className="sr-only">, seen</span> : null}
                <motion.span
                  className="sf-tour-tile-chev"
                  aria-hidden="true"
                  animate={{ rotate: open ? 180 : 0 }}
                  transition={calm(reduce, { duration: 0.22, ease: EASE_OUT })}
                >
                  <Icon name="chevron-down" size={16} />
                </motion.span>
              </button>
              <AnimatePresence initial={false}>
                {open ? (
                  <Reveal reduce={reduce} id={bodyId} className="sf-tour-tile-body">
                    <p>{tile.line}</p>
                  </Reveal>
                ) : null}
              </AnimatePresence>
            </li>
          );
        })}
      </ul>
      <div role="status">
        {done ? <DemoSuccess reduce={reduce}>That is everything beyond the path. Each one lives in the sidebar.</DemoSuccess> : null}
      </div>
    </DemoFrame>
  );
}
