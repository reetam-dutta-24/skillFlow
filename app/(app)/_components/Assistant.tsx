"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence } from "framer-motion";
import { Icon } from "@/components/core/Icon.jsx";
import { useHydrated } from "@/components/feedback/useCalmMotion";
import { OPEN_ASSISTANT_EVENT } from "@/components/navigation/GlobalSearch";
import {
  MAX_HISTORY,
  parseEvent,
  type AssistantErrorCode,
  type AssistantMode,
  type AssistantSource,
} from "@/lib/assistant/protocol";
import { AssistantPanel } from "./AssistantPanel";

/**
 * The SkillFlow Assistant: a button in the top bar ("Ask SkillFlow"), Ctrl or Cmd + J, and "Ask the assistant" in the
 * Ctrl + K palette open it. It lives in the app shell, so the chat survives moving between pages, and it is kept in
 * React state only: nothing is saved, and a reload or "Clear chat" ends it.
 */

export type AssistantTurn =
  | { id: string; role: "user"; text: string }
  | {
      id: string;
      role: "assistant";
      text: string;
      mode: AssistantMode | null;
      sources: AssistantSource[];
      status: "streaming" | "done" | "stopped" | "error";
      error?: AssistantErrorCode;
    };

let turnSeed = 0;
const nextId = () => `t${Date.now().toString(36)}${(turnSeed += 1)}`;

/** Unverified text (a stopped answer) loses its citation markers and links: only the server's check may keep them. */
function plainText(text: string) {
  return text.replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1").replace(/\[\d{1,3}(?:\s*,\s*\d{1,3})*\]/g, "").replace(/[ \t]{2,}/g, " ").trim();
}

function useAssistantChat() {
  const [turns, setTurns] = useState<AssistantTurn[]>([]);
  const abortRef = useRef<AbortController | null>(null);
  const busy = turns.some((turn) => turn.role === "assistant" && turn.status === "streaming");

  const patch = useCallback((id: string, update: (turn: Extract<AssistantTurn, { role: "assistant" }>) => Partial<Extract<AssistantTurn, { role: "assistant" }>>) => {
    setTurns((list) => list.map((turn) => (turn.id === id && turn.role === "assistant" ? { ...turn, ...update(turn) } : turn)));
  }, []);

  const ask = useCallback(
    async (question: string) => {
      const message = question.trim();
      if (!message || busy) return;
      // Earlier turns that finished, newest last, so a follow-up has context. Errors and stopped answers stay out.
      const history = turns
        .filter((turn) => turn.role === "user" || turn.status === "done")
        .slice(-MAX_HISTORY)
        .map((turn) => ({ role: turn.role, content: turn.text }));
      const answerId = nextId();
      setTurns((list) => [
        ...list,
        { id: nextId(), role: "user", text: message },
        { id: answerId, role: "assistant", text: "", mode: null, sources: [], status: "streaming" },
      ]);
      const controller = new AbortController();
      abortRef.current = controller;
      let finished = false;
      try {
        const response = await fetch("/api/assistant", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ message, history, pathname: window.location.pathname }),
          signal: controller.signal,
          cache: "no-store",
        });
        if (!response.ok || !response.body) {
          const body = (await response.json().catch(() => null)) as { code?: AssistantErrorCode } | null;
          const code: AssistantErrorCode = body?.code ?? (response.status === 429 ? "rate-limit" : "unavailable");
          patch(answerId, () => ({ status: "error", error: code }));
          return;
        }
        const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
        let buffer = "";
        for (;;) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += value;
          let newline = buffer.indexOf("\n");
          while (newline !== -1) {
            const event = parseEvent(buffer.slice(0, newline));
            buffer = buffer.slice(newline + 1);
            newline = buffer.indexOf("\n");
            if (!event) continue;
            if (event.t === "meta") patch(answerId, () => ({ mode: event.mode }));
            else if (event.t === "delta") patch(answerId, (turn) => ({ text: turn.text + event.text }));
            else if (event.t === "final") {
              finished = true;
              patch(answerId, () => ({ text: event.text, mode: event.mode, sources: event.sources, status: "done" }));
            } else if (event.t === "error") {
              finished = true;
              patch(answerId, () => ({ status: "error", error: event.code }));
            }
          }
        }
        if (!finished) patch(answerId, () => ({ status: "error", error: "unavailable" }));
      } catch {
        if (controller.signal.aborted) patch(answerId, (turn) => ({ status: "stopped", text: plainText(turn.text) }));
        else patch(answerId, () => ({ status: "error", error: "unavailable" }));
      } finally {
        if (abortRef.current === controller) abortRef.current = null;
      }
    },
    [busy, patch, turns],
  );

  const stop = useCallback(() => abortRef.current?.abort(), []);
  const clear = useCallback(() => {
    abortRef.current?.abort();
    setTurns([]);
  }, []);

  return { turns, busy, ask, stop, clear };
}

export function Assistant() {
  const hydrated = useHydrated();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [mac, setMac] = useState(false);
  const chat = useAssistantChat();

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (!(event.ctrlKey || event.metaKey) || event.altKey || event.shiftKey || event.key.toLowerCase() !== "j") return;
      // Another dialog (search, the tour, a recall card) keeps the keyboard.
      if (document.querySelector('[aria-modal="true"]:not(.sf-assist-panel)')) return;
      event.preventDefault();
      setMac(/Mac|iPhone|iPad/.test(navigator.platform));
      setOpen((value) => !value);
    }
    function onOpen(event: Event) {
      const question = (event as CustomEvent<{ question?: string }>).detail?.question?.trim();
      if (question) setDraft(question.slice(0, 1000));
      setOpen(true);
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener(OPEN_ASSISTANT_EVENT, onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(OPEN_ASSISTANT_EVENT, onOpen);
    };
  }, []);

  return (
    <>
      <button
        type="button"
        className="sf-assist-trigger"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-keyshortcuts="Control+J Meta+J"
        onClick={() => {
          setMac(/Mac|iPhone|iPad/.test(navigator.platform));
          setOpen(true);
        }}
      >
        <Icon name="sparkles" size={16} />
        <span className="sf-assist-trigger-text">Ask SkillFlow</span>
        <kbd className="sf-assist-trigger-kbd" aria-hidden="true">
          {mac ? "⌘J" : "Ctrl J"}
        </kbd>
      </button>
      {hydrated
        ? createPortal(
            <AnimatePresence>
              {open ? (
                <AssistantPanel
                  key="assistant"
                  turns={chat.turns}
                  busy={chat.busy}
                  draft={draft}
                  onDraft={setDraft}
                  onAsk={(question) => {
                    setDraft("");
                    void chat.ask(question);
                  }}
                  onStop={chat.stop}
                  onClear={chat.clear}
                  onClose={() => setOpen(false)}
                />
              ) : null}
            </AnimatePresence>,
            document.body,
          )
        : null}
    </>
  );
}
