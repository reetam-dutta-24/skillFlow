"use client";

import { useEffect, useId, useRef } from "react";
import { motion } from "framer-motion";
import { Icon } from "@/components/core/Icon.jsx";
import { useCalmMotion } from "@/components/feedback/useCalmMotion";
import { useFocusTrap } from "@/components/feedback/useFocusTrap";
import { ERROR_COPY, MAX_MESSAGE } from "@/lib/assistant/protocol";
import type { AssistantTurn } from "./Assistant";
import { AssistantAnswer } from "./AssistantAnswer";

export const SUGGESTED_QUESTIONS = [
  "What should I do next?",
  "How does explain-back decide I passed?",
  "Which free path fits design?",
  "How is my Detox Score calculated?",
] as const;

const ANNOUNCE: Record<"streaming" | "done" | "stopped" | "error", string> = {
  streaming: "",
  done: "Answer ready.",
  stopped: "Stopped.",
  error: "The assistant could not answer.",
};

/**
 * The assistant's panel: a right-side panel on desktop and a bottom sheet on a phone. A modal dialog with a focus trap;
 * Escape closes it and focus returns to whatever opened it. Enter sends, Shift + Enter adds a line.
 */
export function AssistantPanel({
  turns,
  busy,
  draft,
  onDraft,
  onAsk,
  onStop,
  onClear,
  onClose,
}: {
  turns: AssistantTurn[];
  busy: boolean;
  draft: string;
  onDraft: (value: string) => void;
  onAsk: (question: string) => void;
  onStop: () => void;
  onClear: () => void;
  onClose: () => void;
}) {
  const reduce = useCalmMotion();
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useFocusTrap(panelRef, true, onClose);

  useEffect(() => {
    inputRef.current?.focus();
    const html = document.documentElement;
    const previous = html.style.overflow;
    html.style.overflow = "hidden";
    return () => {
      html.style.overflow = previous;
    };
  }, []);

  // Keep the newest text in view while it streams.
  const last = turns[turns.length - 1];
  const lastLength = last ? last.text.length : 0;
  useEffect(() => {
    const log = logRef.current;
    if (log) log.scrollTo({ top: log.scrollHeight, behavior: reduce ? "auto" : "smooth" });
  }, [turns.length, lastLength, reduce]);

  // One calm announcement per finished answer, instead of reading every streamed word.
  const lastStatus = last?.role === "assistant" ? last.status : null;
  const announce = lastStatus ? ANNOUNCE[lastStatus] : "";

  function submit() {
    const question = draft.trim();
    if (!question || busy) return;
    onAsk(question);
    inputRef.current?.focus();
  }

  const remaining = MAX_MESSAGE - draft.length;

  return (
    <motion.div
      className="sf-assist"
      initial={reduce ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={reduce ? { opacity: 0, transition: { duration: 0 } } : { opacity: 0, transition: { duration: 0.14 } }}
      transition={reduce ? { duration: 0 } : { duration: 0.16 }}
    >
      <button type="button" className="sf-assist-backdrop" tabIndex={-1} aria-hidden="true" onClick={onClose} />
      <motion.div
        ref={panelRef}
        className="sf-assist-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        initial={reduce ? false : { x: 24, y: 0, opacity: 0.6 }}
        animate={{ x: 0, y: 0, opacity: 1 }}
        transition={reduce ? { duration: 0 } : { duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      >
        <header className="sf-assist-head">
          <span className="sf-assist-mark" aria-hidden="true">
            <Icon name="sparkles" size={18} />
          </span>
          <div className="sf-assist-head-text">
            <h2 id={titleId}>Ask SkillFlow</h2>
            <p>Answers from SkillFlow&rsquo;s help and catalog, with sources</p>
          </div>
          {turns.length ? (
            <button type="button" className="sf-assist-head-btn" onClick={onClear}>
              Clear chat
            </button>
          ) : null}
          <button type="button" className="sf-assist-head-btn sf-assist-close" onClick={onClose}>
            <Icon name="x" size={16} />
            <span className="sf-sr">Close the assistant</span>
          </button>
        </header>

        <div ref={logRef} className="sf-assist-log" aria-live="off">
          {turns.length === 0 ? (
            <div className="sf-assist-empty">
              <p>
                Ask about how SkillFlow works, what a path covers, or what to do next. Answers cite their sources, and you
                explain each stage&rsquo;s ideas yourself.
              </p>
              <ul className="sf-assist-suggest" aria-label="Suggested questions">
                {SUGGESTED_QUESTIONS.map((question) => (
                  <li key={question}>
                    <button type="button" onClick={() => onAsk(question)}>
                      <Icon name="message-circle-question" size={15} />
                      {question}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <ol className="sf-assist-turns">
              {turns.map((turn) =>
                turn.role === "user" ? (
                  <li key={turn.id} className="sf-assist-q">
                    <span className="sf-sr">You asked: </span>
                    {turn.text}
                  </li>
                ) : (
                  <li key={turn.id} className="sf-assist-a">
                    <span className="sf-sr">Assistant: </span>
                    {turn.mode === "hint" ? (
                      <p className="sf-assist-label" data-mode="hint">
                        <Icon name="lightbulb" size={14} /> Hint mode — you&rsquo;ll explain this one yourself
                      </p>
                    ) : turn.mode === "not-sure" && turn.status === "done" ? (
                      <p className="sf-assist-label" data-mode="not-sure">
                        <Icon name="circle-help" size={14} /> Not covered by SkillFlow&rsquo;s sources
                      </p>
                    ) : null}
                    {turn.status === "error" ? (
                      <p className="sf-assist-error" role="alert">
                        <Icon name={turn.error === "rate-limit" ? "timer" : "cloud-off"} size={16} />
                        {ERROR_COPY[turn.error ?? "unavailable"]}
                      </p>
                    ) : (
                      <AssistantAnswer turn={turn} reduce={reduce} />
                    )}
                  </li>
                ),
              )}
            </ol>
          )}
        </div>

        <p className="sf-sr" role="status" aria-live="polite">
          {announce}
        </p>

        <form
          className="sf-assist-form"
          onSubmit={(event) => {
            event.preventDefault();
            submit();
          }}
        >
          <label className="sf-sr" htmlFor={`${titleId}-input`}>
            Your question
          </label>
          <textarea
            id={`${titleId}-input`}
            ref={inputRef}
            rows={2}
            value={draft}
            maxLength={MAX_MESSAGE}
            placeholder="Ask a question about SkillFlow…"
            onChange={(event) => onDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
                event.preventDefault();
                submit();
              }
            }}
          />
          <div className="sf-assist-form-row">
            <span className="sf-assist-count" aria-hidden={remaining > 100}>
              {remaining <= 100 ? `${remaining} characters left` : "Enter to send · Shift + Enter for a new line"}
            </span>
            {busy ? (
              <button type="button" className="sf-btn sf-btn--outline sf-btn--sm" onClick={onStop}>
                <Icon name="square" size={14} /> Stop
              </button>
            ) : (
              <button type="submit" className="sf-btn sf-btn--gradient sf-btn--sm" disabled={!draft.trim()}>
                <Icon name="send-horizontal" size={14} /> Ask
              </button>
            )}
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
