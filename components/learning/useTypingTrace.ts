"use client";

import { useRef } from "react";
import type { TypingTrace } from "@/lib/explain/authenticity";

/**
 * Counts how an answer reached its text box: characters typed, characters pasted or dropped, and how long the box
 * had focus. Counts only, never the keystrokes. One trace per key (an idea, or the hands-on write-up). Clearing the box
 * starts the trace again, so pasting notes and then rewriting from scratch is not held against anyone. Spoken text is
 * added by the dictation button, not through `change`, so it counts as neither.
 */
type Live = TypingTrace & { focusAt: number | null };

const PASTE_TYPES = new Set(["insertFromPaste", "insertFromDrop", "insertFromPasteAsQuotation", "insertFromYank"]);

export function useTypingTrace() {
  const store = useRef(new Map<string, Live>());

  function entry(key: string): Live {
    let row = store.current.get(key);
    if (!row) {
      row = { typed: 0, pasted: 0, activeMs: 0, focusAt: null };
      store.current.set(key, row);
    }
    return row;
  }

  return {
    change(key: string, before: string, after: string, inputType: string | undefined) {
      const row = entry(key);
      if (!after.trim()) {
        row.typed = 0;
        row.pasted = 0;
        row.activeMs = 0;
        if (row.focusAt !== null) row.focusAt = performance.now();
        return;
      }
      const added = after.length - before.length;
      if (added <= 0) return;
      if (inputType && PASTE_TYPES.has(inputType)) row.pasted += added;
      else row.typed += added;
    },
    focus(key: string) {
      entry(key).focusAt = performance.now();
    },
    blur(key: string) {
      const row = entry(key);
      if (row.focusAt === null) return;
      row.activeMs += performance.now() - row.focusAt;
      row.focusAt = null;
    },
    snapshot(key: string): TypingTrace {
      const row = entry(key);
      const live = row.focusAt === null ? 0 : performance.now() - row.focusAt;
      return { typed: row.typed, pasted: row.pasted, activeMs: Math.round(row.activeMs + live) };
    },
  };
}
