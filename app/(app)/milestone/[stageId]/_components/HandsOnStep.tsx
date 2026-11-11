"use client";

import { useEffect, useRef, useState } from "react";
import { DictationButton } from "@/components/learning/DictationButton";
import { useTypingTrace } from "@/components/learning/useTypingTrace";
import { uploadLocalFile } from "@/app/(app)/uploads/actions";
import { answerMethod, appendSpoken } from "@/lib/explain/dictation";
import { MIN_WRITEUP_WORDS } from "@/lib/explain/hands-on";
import type { IntegrityView } from "@/lib/explain/authenticity";
import type { HandsOnView } from "@/lib/types/pages";
import { submitHandsOn } from "../actions";
import { IntegrityNotice } from "./IntegrityNotice";

type Kind = HandsOnView["kinds"][number]["kind"];

const ACCEPT: Record<Exclude<Kind, "link">, string> = {
  image: "image/jpeg,image/png,image/webp,image/gif",
  video: "video/mp4,video/webm,video/quicktime",
  doc: "application/pdf",
};

const UPLOAD_KIND: Record<Exclude<Kind, "link">, string> = { image: "image", video: "video", doc: "any" };

function wordCount(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * The last step on a practical path: show one small piece of real work for this stage and say what you did. The
 * write-up can be typed or spoken, and goes through the same own-words check as the ideas. `onAccepted` lets the
 * wizard offer Finish this stage.
 */
export function HandsOnStep({
  stageId,
  handsOn,
  onAccepted,
}: {
  stageId: string;
  handsOn: HandsOnView;
  onAccepted: () => void;
}) {
  const previous = handsOn.proof;
  const firstKind = (previous && handsOn.kinds.some((item) => item.kind === previous.kind) ? previous.kind : handsOn.kinds[0]?.kind) as Kind;
  const [kind, setKind] = useState<Kind>(firstKind);
  const [link, setLink] = useState(previous?.kind === "link" ? previous.url : "");
  const [file, setFile] = useState(previous && previous.kind !== "link" ? previous.url : "");
  const [writeUp, setWriteUp] = useState(previous?.writeUp ?? "");
  const [spoken, setSpoken] = useState(0);
  const [phase, setPhase] = useState<"write" | "uploading" | "reading">("write");
  const [result, setResult] = useState<{ accepted: boolean; review: string; integrity: IntegrityView | null } | null>(
    previous ? { accepted: previous.accepted, review: previous.review, integrity: null } : null,
  );
  const [problem, setProblem] = useState<string | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const trace = useTypingTrace();
  const draftKey = `skillflow-proof:${stageId}`;
  const busy = phase !== "write";
  const words = wordCount(writeUp);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  // The write-up is kept on this device until the work is accepted, like an explain-back draft.
  useEffect(() => {
    if (previous?.writeUp) return;
    try {
      const stored = window.localStorage.getItem(draftKey);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one restore from storage after mount
      if (stored) setWriteUp(stored);
    } catch {
      // Storage can be blocked; the step still works.
    }
  }, [draftKey, previous?.writeUp]);

  function keep(next: string) {
    try {
      window.localStorage.setItem(draftKey, next);
    } catch {
      // Ignore: private mode or full storage.
    }
  }

  function reopen() {
    setProblem(null);
    if (result && !result.accepted) setResult(null);
  }

  function editWriteUp(next: string, inputType?: string) {
    trace.change("proof", writeUp, next, inputType);
    setWriteUp(next);
    keep(next);
    reopen();
  }

  function speak(text: string) {
    const phrase = text.trim();
    if (!phrase) return;
    setWriteUp((current) => {
      const next = appendSpoken(current, phrase);
      keep(next);
      return next;
    });
    setSpoken((count) => count + phrase.length + 1);
    reopen();
  }

  async function upload(chosen: File | undefined) {
    if (!chosen || kind === "link") return;
    setProblem(null);
    setPhase("uploading");
    const body = new FormData();
    body.set("file", chosen);
    body.set("kind", UPLOAD_KIND[kind]);
    const saved = await uploadLocalFile(body).catch(() => ({ ok: false as const, error: "The upload failed. Try again." }));
    setPhase("write");
    if (!saved.ok) {
      setProblem(saved.error);
      return;
    }
    setFile(saved.url);
    reopen();
  }

  async function check() {
    const url = kind === "link" ? link.trim() : file;
    if (!url) {
      setProblem(kind === "link" ? "Paste the link to your work first." : "Upload the file first.");
      return;
    }
    if (words < MIN_WRITEUP_WORDS) {
      setProblem(`Say what you did in at least ${MIN_WRITEUP_WORDS} words: what you made, how, and one thing you changed or fixed.`);
      return;
    }
    setProblem(null);
    setResult(null);
    setPhase("reading");
    const reply = await submitHandsOn({
      stageId,
      kind,
      url,
      writeUp,
      method: answerMethod(writeUp, spoken),
      trace: trace.snapshot("proof"),
    }).catch(() => ({ ok: false as const, error: "unavailable" as const }));
    setPhase("write");
    if (!reply.ok) {
      setProblem(
        reply.error === "invalid" && "message" in reply && reply.message
          ? reply.message
          : reply.error === "unconnected"
            ? "The review model is not connected yet. Nothing was saved."
            : "We could not review this right now. Nothing was saved; try again.",
      );
      return;
    }
    setResult({ accepted: reply.accepted, review: reply.review, integrity: reply.integrity });
    if (reply.accepted) {
      try {
        window.localStorage.removeItem(draftKey);
      } catch {
        // Nothing to clear.
      }
      onAccepted();
    }
  }

  const accepted = result?.accepted === true;

  return (
    <section className="sf-explain-step sf-handson" aria-labelledby="handson-title">
      <p className="sf-explain-kicker">Last step · Show your work</p>
      <h2 id="handson-title" ref={headingRef} tabIndex={-1}>
        Show one small piece of real work
      </h2>
      <p className="sf-explain-hint">{handsOn.task}</p>
      <p className="sf-handson-examples">
        <span>For example:</span> {handsOn.examples.join(" · ")}
      </p>

      {accepted ? null : (
        <>
          <fieldset className="sf-handson-kinds" disabled={busy}>
            <legend className="sf-explain-label">What are you showing?</legend>
            {handsOn.kinds.map((item) => (
              <label key={item.kind} className="sf-handson-kind" data-on={kind === item.kind ? "true" : undefined}>
                <input
                  type="radio"
                  name="proof-kind"
                  value={item.kind}
                  checked={kind === item.kind}
                  onChange={() => {
                    setKind(item.kind);
                    setFile("");
                    reopen();
                  }}
                />
                {item.label}
              </label>
            ))}
          </fieldset>

          {kind === "link" ? (
            <div className="sf-handson-field">
              <label className="sf-explain-label" htmlFor="proof-link">
                Link to your work
              </label>
              <input
                id="proof-link"
                type="url"
                inputMode="url"
                placeholder="https://"
                value={link}
                disabled={busy}
                onChange={(event) => {
                  setLink(event.target.value);
                  reopen();
                }}
              />
            </div>
          ) : (
            <div className="sf-handson-field">
              <label className="sf-explain-label" htmlFor="proof-file">
                {kind === "image" ? "Photo or screenshot" : kind === "video" ? "Short video (up to 40 MB)" : "PDF (up to 12 MB)"}
              </label>
              <input
                id="proof-file"
                type="file"
                accept={ACCEPT[kind]}
                disabled={busy}
                onChange={(event) => void upload(event.target.files?.[0])}
              />
              {phase === "uploading" ? <p className="sf-explain-hint">Uploading…</p> : null}
              {file ? (
                <div className="sf-handson-preview">
                  {kind === "image" ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={file} alt="Your uploaded work" width={320} height={180} decoding="async" />
                  ) : kind === "video" ? (
                    <video src={file} controls preload="metadata" width={320} height={180} />
                  ) : (
                    <a href={file} target="_blank" rel="noreferrer">
                      Open your PDF
                    </a>
                  )}
                </div>
              ) : null}
            </div>
          )}

          <div className="sf-handson-field">
            <div className="sf-explain-field-head">
              <label className="sf-explain-label" htmlFor="proof-writeup">
                What you did
              </label>
              <DictationButton onPhrase={speak} disabled={busy} controls="proof-writeup" />
            </div>
            <textarea
              id="proof-writeup"
              rows={6}
              value={writeUp}
              disabled={busy}
              onChange={(event) => editWriteUp(event.target.value, (event.nativeEvent as InputEvent).inputType)}
              onFocus={() => trace.focus("proof")}
              onBlur={() => trace.blur("proof")}
              placeholder="What you made, how you did it, and one thing that went wrong or that you changed, and why."
              aria-describedby="proof-words"
            />
            <p className="sf-explain-draft" id="proof-words" data-enough={words >= MIN_WRITEUP_WORDS ? "true" : undefined}>
              {words} of {MIN_WRITEUP_WORDS} words. The reviewer reads this; it cannot see photos or videos.
            </p>
          </div>
        </>
      )}

      {problem ? (
        <p className="sf-explain-notice" role="alert">
          {problem}
        </p>
      ) : null}
      {phase === "reading" ? (
        <p className="sf-explain-reading" aria-live="polite">
          Reading what you did
        </p>
      ) : null}
      {result ? (
        <div className={result.accepted ? "sf-explain-review is-pass" : "sf-explain-review is-retry"} role="status">
          <p className="sf-explain-kicker">
            {result.integrity?.status === "blocked" ? "Use your own words" : result.accepted ? "Your work holds" : "Not yet"}
          </p>
          <p>{result.review}</p>
        </div>
      ) : null}
      {result?.integrity && result.integrity.status !== "clear" ? <IntegrityNotice integrity={result.integrity} /> : null}

      {accepted ? null : (
        <div className="sf-explain-actions">
          <button type="button" className="sf-milestone-cta" disabled={busy} onClick={() => void check()}>
            {phase === "reading" ? "Reading…" : result ? "Check it again" : "Check my work"}
          </button>
        </div>
      )}
    </section>
  );
}
