"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { releaseRecall, reviewRecall } from "../recall/actions";

const RESULT_KEY = "skillflow-recall-result";

type Prompt = {
  noteId: string;
  concept: string;
  stageTitle: string;
  skillName: string;
};

type RecallResult = {
  prompt: Prompt;
  label: string;
  review: string;
  retention: number;
  previous: number | null;
  quality: string;
};

export function RecallGate({ prompt }: { prompt: Prompt | null }) {
  const router = useRouter();
  const titleId = useId();
  const cardRef = useRef<HTMLDivElement>(null);
  const [answer, setAnswer] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [result, setResult] = useState<RecallResult | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem(RESULT_KEY);
    if (raw) {
      try {
        setResult(JSON.parse(raw) as RecallResult);
      } catch {
        sessionStorage.removeItem(RESULT_KEY);
      }
    }
    setReady(true);
  }, []);

  const shown = result?.prompt ?? prompt;
  const open = ready && Boolean(shown);

  useEffect(() => {
    if (!open) return undefined;
    const shell = document.querySelector(".sf-app");
    if (shell instanceof HTMLElement) shell.inert = true;
    const here = window.location.href;
    history.pushState(null, "", here);
    function onPop() {
      history.pushState(null, "", here);
    }
    window.addEventListener("popstate", onPop);
    return () => {
      if (shell instanceof HTMLElement) shell.inert = false;
      window.removeEventListener("popstate", onPop);
    };
  }, [open]);

  useEffect(() => {
    const card = cardRef.current;
    const focusable = () =>
      card ? [...card.querySelectorAll<HTMLElement>("textarea, button:not([disabled]), a[href]")] : [];
    focusable()[0]?.focus();
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        return;
      }
      if (event.key !== "Tab") return;
      const nodes = focusable();
      if (!nodes.length) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [result, busy]);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (busy || result || !prompt) return;
    setBusy(true);
    setNotice("");
    const saved = await reviewRecall(prompt.noteId, answer);
    setBusy(false);
    if (!saved.ok) {
      setNotice(saved.error === "unconnected" ? "A model key is needed before this idea can be checked." : saved.error === "empty" ? "Write an answer first." : "The review did not come back. Try again.");
      return;
    }
    const next = { prompt, label: saved.label, review: saved.review, retention: saved.retention, previous: saved.previous, quality: saved.quality };
    sessionStorage.setItem(RESULT_KEY, JSON.stringify(next));
    setResult(next);
  }

  async function onContinue() {
    sessionStorage.removeItem(RESULT_KEY);
    setResult(null);
    await releaseRecall();
    router.refresh();
  }

  const retentionLine = result
    ? result.previous == null
      ? `Retention is ${result.retention}.`
      : result.retention === result.previous
        ? `Retention stays ${result.retention}.`
        : `Retention is ${result.retention}, ${result.retention > result.previous ? "up" : "down"} from ${result.previous}.`
    : "";

  if (!open || !shown) return null;

  return (
    <div className="sf-recall-lock" role="presentation">
      <div
        ref={cardRef}
        className="sf-recall-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <p className="sf-recall-kicker">{shown.skillName} · {shown.stageTitle}</p>
        <h2 id={titleId}>{shown.concept}</h2>
        {result ? (
          <div className="sf-recall-result">
            <p className={`sf-explain-review ${result.quality === "strong" ? "is-pass" : "is-retry"}`}>{result.review}</p>
            <p>{result.label} {retentionLine} This does not change the stage.</p>
            <button type="button" onClick={() => void onContinue()}>Continue</button>
          </div>
        ) : (
          <form onSubmit={onSubmit}>
            <p>Explain this idea again. Any answer opens the app. The score follows how well it holds.</p>
            <textarea value={answer} onChange={(event) => setAnswer(event.target.value)} rows={5} maxLength={8000} required placeholder="What it is, and why it matters" />
            <button type="submit" disabled={busy}>{busy ? "Checking" : "Submit"}</button>
            {notice ? <p className="sf-note-summary" role="alert">{notice}</p> : null}
          </form>
        )}
      </div>
    </div>
  );
}
