"use client";

import { useEffect, useId, useState, type CSSProperties, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/core/Button.jsx";
import { Icon } from "@/components/core/Icon.jsx";
import { SkillImage } from "@/components/core/SkillImage";
import { DetoxGauge } from "@/components/detox/DetoxGauge";
import {
  ASSISTANT_DEMO,
  DETOX_DEMO_ACTIONS,
  DETOX_DEMO_BASE,
  HEAT_DAYS,
  INBOX_DEMO,
  LESSON_DEMO_STEPS,
  NICHE_DEMO,
  PRACTICE_SOURCES,
  THEME_DEMO_PRESETS,
  assistantDemo,
  bumpDay,
  detoxDemo,
  heatTotals,
  lessonStep,
  readAllNotes,
  readNote,
  revealWords,
  themeDemoVars,
  toggleFollow,
  unreadCount,
  wordTotal,
  type PracticeSource,
} from "@/lib/tour/demos";
import { DemoSuccess, EASE_OUT, SOFT_SPRING, calm } from "./tour-motion";

/**
 * More "Try it" demos for the Home tour: niches, lessons, practice, activity, Detox, themes, and notifications.
 * Sandboxed like the rest: local state only, no writes, no model, no navigation. Rules live in lib/tour/demos.ts.
 */

function Frame({ label, children }: { label: string; children: ReactNode }) {
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

/* ── Niches ───────────────────────────────────────────────────────────────── */

export function NichesDemo({ reduce }: { reduce: boolean }) {
  const [followed, setFollowed] = useState<string[]>([]);
  return (
    <Frame label="follow sample niches">
      <ul className="sf-tour-niches">
        {NICHE_DEMO.map((niche) => {
          const on = followed.includes(niche.slug);
          return (
            <li key={niche.slug} className="sf-tour-niche" data-on={on ? "true" : undefined}>
              <span className="sf-tour-niche-art" aria-hidden="true">
                <SkillImage src={niche.image} alt="" fill sizes="(max-width: 720px) 45vw, 220px" />
                <span className="sf-tour-shade" />
              </span>
              <span className="sf-tour-niche-body">
                <span className="sf-tour-niche-name">{niche.name}</span>
                <span className="sf-tour-niche-meta">{niche.stages} stages · Free</span>
                <button type="button" className="sf-tour-niche-follow" aria-pressed={on} onClick={() => setFollowed((list) => toggleFollow(list, niche.slug))}>
                  <Icon name={on ? "check" : "plus"} size={14} />
                  {on ? "Following" : "Follow"}
                  <span className="sr-only"> {niche.name}</span>
                </button>
              </span>
            </li>
          );
        })}
      </ul>
      <div role="status">
        {followed.length ? (
          <DemoSuccess key={followed.length} reduce={reduce}>
            Following {followed.length} {followed.length === 1 ? "niche" : "niches"}. Each one gets its own lane on Home.
          </DemoSuccess>
        ) : null}
      </div>
    </Frame>
  );
}

/* ── Lessons ──────────────────────────────────────────────────────────────── */

export function LessonDemo({ reduce }: { reduce: boolean }) {
  const [step, setStep] = useState(0);
  const total = LESSON_DEMO_STEPS.length;
  const current = LESSON_DEMO_STEPS[step];
  return (
    <Frame label="step through a sample lesson">
      <div className="sf-tour-lesson">
        <div className="sf-tour-lesson-banner" aria-hidden="true">
          <SkillImage src="/stages/full-stack-web-dev/3.jpg" alt="" fill sizes="(max-width: 720px) 90vw, 440px" />
          <span className="sf-tour-shade" />
          <span className="sf-tour-lesson-title">Stage 3 · JavaScript Fundamentals</span>
        </div>
        <p className="sf-tour-lesson-count">
          Step {step + 1} of {total}
        </p>
        <div className="sf-tour-track" aria-hidden="true">
          <motion.span className="sf-tour-fill" initial={false} animate={{ width: `${((step + 1) / total) * 100}%` }} transition={calm(reduce, SOFT_SPRING)} />
        </div>
        <div className="sf-tour-lesson-card" aria-live="polite">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={current.kind}
              className="sf-tour-lesson-step"
              initial={reduce ? false : { opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={reduce ? { opacity: 0, transition: { duration: 0 } } : { opacity: 0, x: -12, transition: { duration: 0.12 } }}
              transition={calm(reduce, { duration: 0.22, ease: EASE_OUT })}
            >
              <span className="sf-tour-lesson-icon" aria-hidden="true">
                <Icon name={current.icon} size={18} />
              </span>
              <span>
                <strong>{current.kind}</strong>
                <span>{current.detail}</span>
              </span>
            </motion.div>
          </AnimatePresence>
        </div>
        <div className="sf-tour-lesson-nav">
          <Button variant="ghost" size="sm" disabled={step === 0} onClick={() => setStep((value) => lessonStep(value, -1))}>
            <Icon name="arrow-left" size={14} />
            Back
          </Button>
          <Button variant="gradient" size="sm" disabled={step === total - 1} onClick={() => setStep((value) => lessonStep(value, 1))}>
            Next step
            <Icon name="arrow-right" size={14} />
          </Button>
        </div>
      </div>
      <div role="status">
        {step === total - 1 ? <DemoSuccess reduce={reduce}>That is a stage. Next comes the explain-back.</DemoSuccess> : null}
      </div>
    </Frame>
  );
}

/* ── Practice ─────────────────────────────────────────────────────────────── */

export function PracticeDemo({ reduce }: { reduce: boolean }) {
  const [source, setSource] = useState<PracticeSource | null>(null);
  const chosen = PRACTICE_SOURCES.find((item) => item.id === source);
  return (
    <Frame label="choose a practice source">
      <div className="sf-tour-sources" role="group" aria-label="Practice source">
        {PRACTICE_SOURCES.map((item) => (
          <button key={item.id} type="button" className="sf-tour-source" aria-pressed={source === item.id} onClick={() => setSource(item.id)}>
            <Icon name={item.icon} size={18} />
            {item.label}
          </button>
        ))}
      </div>
      <AnimatePresence mode="wait" initial={false}>
        {chosen ? (
          <motion.div
            key={chosen.id}
            className="sf-tour-practice-note"
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? { opacity: 0, transition: { duration: 0 } } : { opacity: 0, y: -4, transition: { duration: 0.12 } }}
            transition={calm(reduce, { duration: 0.22, ease: EASE_OUT })}
          >
            <p className="sf-tour-face-tag">
              <Icon name="flask-conical" size={14} /> Practice note · {chosen.label.toLowerCase()}
            </p>
            <p>{chosen.detail}</p>
          </motion.div>
        ) : (
          <p className="sf-tour-hint" key="hint">
            <Icon name="hand" size={14} /> Pick one of the three
          </p>
        )}
      </AnimatePresence>
      <div role="status">
        {chosen ? <DemoSuccess reduce={reduce}>Practice notes live in Notes, beside your stage notes. They never pass a stage.</DemoSuccess> : null}
      </div>
    </Frame>
  );
}

/* ── Activity ─────────────────────────────────────────────────────────────── */

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function ActivityDemo({ reduce }: { reduce: boolean }) {
  const [levels, setLevels] = useState<number[]>(() => Array.from({ length: HEAT_DAYS }, () => 0));
  const { total, activeDays } = heatTotals(levels);
  return (
    <Frame label="fill in a sample activity heatmap">
      <div className="sf-tour-heat-head">
        <p>
          <strong>{total}</strong> {total === 1 ? "contribution" : "contributions"}
        </p>
        <p>
          <strong>{activeDays}</strong> active {activeDays === 1 ? "day" : "days"}
        </p>
      </div>
      <div className="sf-tour-heat" role="group" aria-label="Two sample weeks">
        {levels.map((level, index) => (
          <button
            key={index}
            type="button"
            className="sf-tour-heat-cell"
            data-level={level}
            aria-label={`${index < 7 ? "Last week" : "This week"} ${DAY_LABELS[index % 7]}: ${level === 0 ? "nothing yet" : `${level} ${level === 1 ? "contribution" : "contributions"}`}`}
            onClick={() => setLevels((current) => bumpDay(current, index))}
          />
        ))}
      </div>
      <p className="sf-tour-heat-legend" aria-hidden="true">
        Less
        {[0, 1, 2, 3, 4].map((level) => (
          <span key={level} className="sf-tour-heat-cell" data-level={level} />
        ))}
        More
      </p>
      <ul className="sf-tour-records" aria-label="Your records">
        <li>
          <Icon name="scroll-text" size={16} /> Transcript: every passed stage, with its date
        </li>
        <li>
          <Icon name="award" size={16} /> Certificate: when every stage on a path is passed
        </li>
      </ul>
      <div role="status">
        {activeDays >= 3 ? <DemoSuccess reduce={reduce}>Three active days. Steady beats busy, and the heatmap shows it.</DemoSuccess> : null}
      </div>
    </Frame>
  );
}

/* ── Dopamine Detox ───────────────────────────────────────────────────────── */

export function DetoxDemo({ reduce }: { reduce: boolean }) {
  const [actions, setActions] = useState<string[]>([]);
  const [from, setFrom] = useState(DETOX_DEMO_BASE);
  const result = detoxDemo(actions);

  function add(id: string) {
    setFrom(result.score);
    setActions((list) => [...list, id]);
  }

  return (
    <Frame label="add sample learning to a Detox Score">
      <div className="sf-tour-detox">
        <DetoxGauge score={result.score} from={from} reduce={reduce} size="sm" />
        <div className="sf-tour-detox-side">
          <p className="sf-tour-detox-band">{result.band}</p>
          <p className="sf-tour-detox-today">
            Today: <strong>+{Math.round(result.earned * 10) / 10}</strong> of {result.cap} points
          </p>
          <div className="sf-tour-track" aria-hidden="true">
            <motion.span className="sf-tour-fill" initial={false} animate={{ width: `${(result.earned / result.cap) * 100}%` }} transition={calm(reduce, SOFT_SPRING)} />
          </div>
        </div>
      </div>
      <div className="sf-tour-detox-actions">
        {DETOX_DEMO_ACTIONS.map((action) => (
          <Button key={action.id} variant="quiet" size="sm" onClick={() => add(action.id)}>
            <Icon name={action.icon} size={14} />
            {action.label}
          </Button>
        ))}
        {actions.length ? (
          <button type="button" className="sf-tour-quiet sf-hit" onClick={() => { setFrom(result.score); setActions([]); }}>
            Start over
          </button>
        ) : null}
      </div>
      <div role="status">
        {result.capped ? (
          <DemoSuccess key="cap" reduce={reduce}>Daily limit reached. More hours today add nothing; tomorrow counts again.</DemoSuccess>
        ) : actions.length >= 2 ? (
          <DemoSuccess key="some" reduce={reduce}>Each verified action moves the score. Keep tapping to find the daily limit.</DemoSuccess>
        ) : null}
      </div>
    </Frame>
  );
}

/* ── Themes and accents ───────────────────────────────────────────────────── */

export function ThemeDemo({ reduce }: { reduce: boolean }) {
  const [mode, setMode] = useState<"dark" | "light">("dark");
  const [presetId, setPresetId] = useState<(typeof THEME_DEMO_PRESETS)[number]["id"]>("tide");
  const [tried, setTried] = useState(false);
  const preset = THEME_DEMO_PRESETS.find((item) => item.id === presetId) ?? THEME_DEMO_PRESETS[0];
  return (
    <Frame label="preview a theme and an accent">
      <div className="sf-tour-theme-controls">
        <div className="sf-tour-chips" role="group" aria-label="Theme">
          {(["dark", "light"] as const).map((value) => (
            <button
              key={value}
              type="button"
              className="sf-tour-chip"
              aria-pressed={mode === value}
              onClick={() => {
                setMode(value);
                setTried(true);
              }}
            >
              {mode === value ? <motion.span layoutId="sf-tour-mode-on" className="sf-tour-chip-on" transition={calm(reduce, SOFT_SPRING)} aria-hidden="true" /> : null}
              <span className="sf-tour-chip-text">
                <Icon name={value === "dark" ? "moon" : "sun"} size={14} /> {value === "dark" ? "Dark" : "Light"}
              </span>
            </button>
          ))}
        </div>
        <div className="sf-tour-swatches" role="group" aria-label="Accent">
          {THEME_DEMO_PRESETS.map((item) => (
            <button
              key={item.id}
              type="button"
              className="sf-tour-swatch"
              aria-pressed={presetId === item.id}
              aria-label={item.label}
              title={item.label}
              style={{ backgroundImage: item.gradient }}
              onClick={() => {
                setPresetId(item.id);
                setTried(true);
              }}
            />
          ))}
        </div>
      </div>
      <div className={`sf-tour-theme-preview ${mode}`} style={themeDemoVars(preset) as CSSProperties} aria-label={`Preview: ${preset.label}, ${mode} theme`} role="img">
        <div className="sf-tour-theme-bar">
          <span className="sf-tour-theme-dot" />
          <span className="sf-tour-theme-line" />
          <span className="sf-tour-theme-avatar" />
        </div>
        <div className="sf-tour-theme-card">
          <span className="sf-tour-theme-kicker">Stage 3 of 12</span>
          <span className="sf-tour-theme-title">JavaScript Fundamentals</span>
          <span className="sf-tour-theme-progress">
            <span style={{ width: "62%" }} />
          </span>
          <span className="sf-tour-theme-row">
            <span className="sf-tour-theme-chip">Steady</span>
            <span className="sf-tour-theme-button">Continue</span>
          </span>
        </div>
      </div>
      <div role="status">
        {tried ? (
          <DemoSuccess key={`${presetId}-${mode}`} reduce={reduce}>
            {preset.label}, {mode}. Pick yours in Settings, or with the sun and moon in the top bar.
          </DemoSuccess>
        ) : null}
      </div>
    </Frame>
  );
}

/* ── Notifications ────────────────────────────────────────────────────────── */

export function InboxDemo({ reduce }: { reduce: boolean }) {
  const [read, setRead] = useState<string[]>([]);
  const unread = unreadCount(read);
  return (
    <Frame label="read sample notifications">
      <div className="sf-tour-inbox-head">
        <span className="sf-tour-bell" aria-hidden="true">
          <Icon name="bell" size={18} />
          {unread ? <span className="sf-tour-bell-badge">{unread}</span> : null}
        </span>
        <p>
          {unread ? `${unread} new` : "All caught up"}
        </p>
        <Button variant="ghost" size="sm" disabled={unread === 0} onClick={() => setRead(readAllNotes())}>
          Mark all as read
        </Button>
      </div>
      <ul className="sf-tour-inbox">
        {INBOX_DEMO.map((note) => {
          const isRead = read.includes(note.id);
          return (
            <li key={note.id}>
              <button type="button" className="sf-tour-inbox-item" data-read={isRead ? "true" : undefined} onClick={() => setRead((list) => readNote(list, note.id))}>
                <span className="sf-tour-inbox-icon" aria-hidden="true">
                  <Icon name={note.icon} size={16} />
                </span>
                <span>
                  <strong>{note.title}</strong>
                  <span>{note.message}</span>
                </span>
                {isRead ? <span className="sr-only">, read</span> : (
                  <>
                    <span className="sf-tour-inbox-dot" aria-hidden="true" />
                    <span className="sr-only">, unread</span>
                  </>
                )}
              </button>
            </li>
          );
        })}
      </ul>
      <div role="status">
        {unread === 0 ? <DemoSuccess reduce={reduce}>All caught up. Every kind has its own switch in Settings.</DemoSuccess> : null}
      </div>
    </Frame>
  );
}

/* ── SkillFlow Assistant ──────────────────────────────────────────────────── */

const DEMO_ICON = { help: "circle-help", stage: "flag", learner: "user" } as const;

/** The answer with each [n] as a small numbered chip, the way the real panel shows citations. */
function CitedText({ text }: { text: string }) {
  const parts = text.split(/(\[\d\])/g);
  return (
    <>
      {parts.map((part, index) =>
        /^\[\d\]$/.test(part) ? (
          <span key={index} className="sf-assist-cite" aria-label={`source ${part.slice(1, -1)}`}>
            {part.slice(1, -1)}
          </span>
        ) : (
          <span key={index}>{part}</span>
        ),
      )}
    </>
  );
}

export function AssistantDemo({ reduce }: { reduce: boolean }) {
  const [picked, setPicked] = useState<string | null>(null);
  const [shown, setShown] = useState(0);
  const item = picked ? assistantDemo(picked) : null;
  const total = item ? wordTotal(item.answer) : 0;
  const done = Boolean(item) && (reduce || shown >= total);

  // A scripted "stream": a few words at a time. Nothing is sent anywhere.
  useEffect(() => {
    if (!item || reduce || shown >= total) return undefined;
    const timer = window.setTimeout(() => setShown((count) => count + 3), 70);
    return () => window.clearTimeout(timer);
  }, [item, reduce, shown, total]);

  return (
    <Frame label="ask the assistant a sample question">
      <div className="sf-tour-assist-questions" role="group" aria-label="Sample questions">
        {ASSISTANT_DEMO.map((entry) => (
          <button
            key={entry.id}
            type="button"
            className="sf-tour-assist-q"
            aria-pressed={picked === entry.id}
            onClick={() => {
              setPicked(entry.id);
              setShown(0);
            }}
          >
            <Icon name="message-circle-question" size={15} />
            {entry.question}
          </button>
        ))}
      </div>
      {item ? (
        <div className="sf-tour-assist-answer" aria-live="polite">
          {item.mode === "hint" ? (
            <p className="sf-assist-label" data-mode="hint">
              <Icon name="lightbulb" size={14} /> Hint mode — you&rsquo;ll explain this one yourself
            </p>
          ) : null}
          <p className="sf-tour-assist-text">
            {done ? <CitedText text={item.answer} /> : revealWords(item.answer, shown)}
          </p>
          {done ? (
            <ul className="sf-tour-assist-sources" aria-label="Sources">
              {item.sources.map((source) => (
                <li key={source.n}>
                  <span className="sf-assist-source-n">{source.n}</span>
                  <Icon name={DEMO_ICON[source.kind]} size={14} />
                  <span>{source.title}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
      <div role="status">
        {done ? (
          <DemoSuccess reduce={reduce}>
            {item?.mode === "hint" ? "Hints, not answers, until you pass the stage yourself." : "Every answer shows the sources it came from."}
          </DemoSuccess>
        ) : null}
      </div>
    </Frame>
  );
}
