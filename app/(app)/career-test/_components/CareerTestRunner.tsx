"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/core/Button.jsx";
import { Icon } from "@/components/core/Icon.jsx";
import { IPIP_INSTRUCTIONS, IPIP_SCALE, ONET_INSTRUCTIONS, ONET_SCALE, SOURCES } from "@/lib/career/meta";
import { IPIP_PAGES, TOTAL_ITEMS, TOTAL_PAGES, pageItems, type CareerAnswers } from "@/lib/career/score";
import { finishCareerTest, saveCareerAnswers } from "../actions";

/**
 * The career-fit test: an intro, then 18 pages of ten statements (12 personality, 6 interests).
 * Each page saves when the learner moves on, so closing the tab loses at most one page.
 */
export function CareerTestRunner({
  initialAnswers,
  startPage,
  started,
}: {
  initialAnswers: CareerAnswers;
  startPage: number;
  started: boolean;
}) {
  const router = useRouter();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [phase, setPhase] = useState<"intro" | "test" | "finishing">("intro");
  const [page, setPage] = useState(Math.min(startPage, TOTAL_PAGES - 1));
  const [answers, setAnswers] = useState<CareerAnswers>(initialAnswers);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  const { part, items } = pageItems(page);
  const answeredCount = Object.keys(answers.ipip).length + Object.keys(answers.onet).length;
  const pageDone = items.every((item) => answers[part][String(item.n)] !== undefined);
  const last = page === TOTAL_PAGES - 1;
  const scale = part === "ipip" ? IPIP_SCALE : ONET_SCALE;
  const firstNumber = page * 10 + 1;

  useEffect(() => {
    if (phase === "test") headingRef.current?.focus();
  }, [page, phase]);

  function choose(n: number, value: number) {
    setAnswers((current) => ({ ...current, [part]: { ...current[part], [String(n)]: value } }));
  }

  async function next() {
    setPending(true);
    setError("");
    const pageAnswers = Object.fromEntries(items.map((item) => [String(item.n), answers[part][String(item.n)]]));
    try {
      const saved = await saveCareerAnswers({ [part]: pageAnswers });
      if (!saved.ok) {
        setError(saved.error);
        setPending(false);
        return;
      }
      if (!last) {
        setPage(page + 1);
        setPending(false);
        window.scrollTo({ top: 0 });
        return;
      }
      setPhase("finishing");
      const finished = await finishCareerTest();
      if (!finished.ok) {
        setError(finished.error);
        setPhase("test");
        setPending(false);
        return;
      }
      router.push("/career-test/report");
      router.refresh();
    } catch {
      setError("Your answers could not be saved. Check your connection and try again.");
      setPhase("test");
      setPending(false);
    }
  }

  if (phase === "intro") {
    return (
      <div className="sf-ct">
        <header className="sf-ct-intro">
          <p className="sf-ct-kicker">Career-fit test</p>
          <h1>Find the paths that fit how you think and what you enjoy</h1>
          <p className="sf-ct-lede">
            Two published questionnaires, then a detailed report: your interests, your personality traits, the paths that fit you best, and how to
            approach each one.
          </p>
        </header>
        <div className="sf-ct-parts">
          <article>
            <span className="sf-ct-partnum">1</span>
            <h2>Personality</h2>
            <p>120 short statements from the IPIP-NEO-120. They measure the five broad traits and 30 narrower facets.</p>
          </article>
          <article>
            <span className="sf-ct-partnum">2</span>
            <h2>Interests</h2>
            <p>60 work activities from the O*NET® Interest Profiler. They measure your six Holland interest areas.</p>
          </article>
        </div>
        <ul className="sf-ct-facts">
          <li>
            <Icon name="clock" size={16} /> About 25 minutes, 180 questions in total
          </li>
          <li>
            <Icon name="save" size={16} /> Saved after every page. Leave and come back any time
          </li>
          <li>
            <Icon name="lock" size={16} /> Private to you. Delete it whenever you like
          </li>
        </ul>
        <p className="sf-ct-note">{SOURCES.note}</p>
        <div className="sf-ct-start">
          <Button type="button" variant="gradient" size="lg" onClick={() => setPhase("test")}>
            {started ? `Continue (${answeredCount} of ${TOTAL_ITEMS} answered)` : "Start the test"}
          </Button>
        </div>
      </div>
    );
  }

  if (phase === "finishing") {
    return (
      <div className="sf-ct sf-ct-finishing" role="status" aria-live="polite">
        <span className="sf-btn-spinner" aria-hidden="true" />
        <h1>Writing your report…</h1>
        <p>Scoring 180 answers and putting your results into words. This takes up to half a minute.</p>
      </div>
    );
  }

  return (
    <div className="sf-ct">
      <div className="sf-ct-progress">
        <div className="sf-ct-progress-row">
          <span>
            Part {part === "ipip" ? 1 : 2} of 2 · {part === "ipip" ? "Personality" : "Interests"}
          </span>
          <span>
            {answeredCount} of {TOTAL_ITEMS} answered
          </span>
        </div>
        <div
          className="sf-ct-meter"
          role="progressbar"
          aria-label="Questions answered"
          aria-valuemin={0}
          aria-valuemax={TOTAL_ITEMS}
          aria-valuenow={answeredCount}
        >
          <span style={{ width: `${(answeredCount / TOTAL_ITEMS) * 100}%` }} />
        </div>
      </div>
      <header className="sf-ct-pagehead">
        <h1 ref={headingRef} tabIndex={-1}>
          {part === "ipip" ? "How accurately does each phrase describe you?" : "How would you feel about doing this work?"}
        </h1>
        <p>{part === "ipip" ? IPIP_INSTRUCTIONS : ONET_INSTRUCTIONS}</p>
        <p className="sf-ct-pagecount">
          Questions {firstNumber}–{firstNumber + items.length - 1} of {TOTAL_ITEMS}
          {page === IPIP_PAGES ? " · Part 2 starts here" : ""}
        </p>
      </header>
      <ol className="sf-ct-items" start={firstNumber}>
        {items.map((item, index) => {
          const value = answers[part][String(item.n)];
          const name = `${part}-${item.n}`;
          return (
            <li key={name} className={value !== undefined ? "sf-ct-item is-done" : "sf-ct-item"}>
              <fieldset>
                <legend>
                  <span className="sf-ct-num" aria-hidden="true">
                    {firstNumber + index}
                  </span>
                  {item.text}
                </legend>
                <div className="sf-ct-scale">
                  {scale.map((option) => (
                    <label key={option.value} className={value === option.value ? "is-on" : undefined}>
                      <input
                        type="radio"
                        name={name}
                        value={option.value}
                        checked={value === option.value}
                        onChange={() => choose(item.n, option.value)}
                      />
                      <span>{option.label}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            </li>
          );
        })}
      </ol>
      {error ? (
        <p className="sf-auth-error" role="alert">
          {error}
        </p>
      ) : null}
      <div className="sf-ct-nav">
        <Button type="button" variant="ghost" disabled={page === 0 || pending} onClick={() => setPage(page - 1)}>
          Back
        </Button>
        <span className="sf-ct-navhint" aria-live="polite">
          {pageDone ? "" : `${items.filter((item) => answers[part][String(item.n)] === undefined).length} left on this page`}
        </span>
        <Button
          type="button"
          variant="gradient"
          size="lg"
          disabled={!pageDone}
          pending={pending}
          pendingLabel="Saving…"
          onClick={() => void next()}
        >
          {last ? "See my report" : "Next"}
        </Button>
      </div>
    </div>
  );
}
