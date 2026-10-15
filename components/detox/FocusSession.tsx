"use client";

import { createContext, useCallback, useContext, useEffect, useId, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/core/Button.jsx";
import { Icon } from "@/components/core/Icon.jsx";
import { useToast } from "@/components/feedback/Toast";
import { saveFocusSession } from "@/app/(app)/detox/actions";

/**
 * Focus sessions for the Detox Score. The session lives in the app shell so it keeps running while the learner moves
 * between pages, and it is kept in localStorage so a reload does not lose it. Minutes count only while a learning page
 * (a lesson, an explain-back, Notes, or a recall card) is open in a visible tab. The server checks the total against
 * the clock when it is saved.
 */

const STORAGE_KEY = "skillflow-focus";
const TICK_MS = 1000;

export type FocusPlan = 25 | 50;
type Stored = { startedAt: number; planned: FocusPlan; focusedMs: number };

type FocusValue = {
  session: Stored | null;
  counting: boolean;
  start: (planned: FocusPlan) => void;
  finish: () => Promise<void>;
  cancel: () => void;
  saving: boolean;
};

const FocusContext = createContext<FocusValue | null>(null);

/** Pages where minutes count. The recall card counts wherever it is open. */
export function isFocusPage(pathname: string) {
  return /^\/(lesson|milestone|notes)(\/|$)/.test(pathname);
}

function readStored(): Stored | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const value = JSON.parse(raw) as Partial<Stored>;
    if (typeof value.startedAt !== "number" || (value.planned !== 25 && value.planned !== 50) || typeof value.focusedMs !== "number") return null;
    return { startedAt: value.startedAt, planned: value.planned, focusedMs: value.focusedMs };
  } catch {
    return null;
  }
}

function writeStored(value: Stored | null) {
  try {
    if (value) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    else window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Blocked storage: the session still runs in this tab.
  }
}

/** One small store for the session, so a reload and other tabs see the same one. The server always sees none. */
let cached: Stored | null | undefined;
const listeners = new Set<() => void>();

function snapshot() {
  if (cached === undefined) cached = readStored();
  return cached;
}

function setStore(value: Stored | null) {
  cached = value;
  writeStored(value);
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  function onStorage(event: StorageEvent) {
    if (event.key !== STORAGE_KEY) return;
    cached = readStored();
    listener();
  }
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

const serverSnapshot = () => null;

export function FocusSessionProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const toast = useToast();
  const session = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  const [onPage, setOnPage] = useState(false);
  const [saving, setSaving] = useState(false);
  const last = useRef<number>(0);
  const finishing = useRef(false);
  const counting = Boolean(session) && onPage;

  const finish = useCallback(async () => {
    const current = snapshot();
    if (!current || finishing.current) return;
    finishing.current = true;
    setSaving(true);
    const minutes = Math.floor(current.focusedMs / 60000);
    try {
      const result = await saveFocusSession({ startedAt: current.startedAt, plannedMinutes: current.planned, focusedMinutes: minutes });
      if (result.ok && result.saved) toast(`Focus session saved: ${result.minutes} ${result.minutes === 1 ? "minute" : "minutes"} counted.`);
      else if (result.ok) toast("Session ended. No learning minutes were counted this time.", "info");
      else toast(result.error, "info");
      router.refresh();
    } catch {
      toast("The session could not be saved. Check your connection.", "info");
    } finally {
      setStore(null);
      setSaving(false);
      finishing.current = false;
    }
  }, [router, toast]);

  const running = Boolean(session);
  useEffect(() => {
    if (!running) return undefined;
    last.current = Date.now();
    const timer = window.setInterval(() => {
      const now = Date.now();
      // A sleeping laptop or a throttled tab must not add a big jump.
      const delta = Math.min(now - last.current, 2 * TICK_MS);
      last.current = now;
      const visible = document.visibilityState === "visible";
      const learning = isFocusPage(window.location.pathname) || Boolean(document.querySelector(".sf-recall-lock"));
      const active = visible && learning;
      setOnPage(active);
      const current = snapshot();
      if (!current) return;
      if (active) setStore({ ...current, focusedMs: current.focusedMs + delta });
      if (now - current.startedAt >= current.planned * 60000) void finish();
    }, TICK_MS);
    return () => window.clearInterval(timer);
  }, [running, finish]);

  const start = useCallback((planned: FocusPlan) => {
    setStore({ startedAt: Date.now(), planned, focusedMs: 0 });
  }, []);

  const cancel = useCallback(() => {
    setStore(null);
  }, []);

  const value = useMemo(() => ({ session, counting, start, finish, cancel, saving }), [session, counting, start, finish, cancel, saving]);
  return <FocusContext.Provider value={value}>{children}</FocusContext.Provider>;
}

export function useFocusSession() {
  return useContext(FocusContext);
}

function clock(ms: number) {
  const total = Math.max(0, Math.round(ms / 1000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

/** The running session in the top bar: time left, minutes counted, and a small panel to finish or stop it. */
export function FocusPill() {
  const focus = useFocusSession();
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const wrapRef = useRef<HTMLDivElement>(null);
  // Starts at 0 so nothing reads the clock while rendering; the first tick fills it in.
  const [tick, setNow] = useState(0);

  useEffect(() => {
    if (!focus?.session) return undefined;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [focus?.session]);

  useEffect(() => {
    if (!open) return undefined;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    function onClick(event: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  if (!focus?.session) return null;
  const { session, counting } = focus;
  const now = tick || session.startedAt;
  const left = session.startedAt + session.planned * 60000 - now;
  const counted = Math.floor(session.focusedMs / 60000);
  const share = Math.min(1, Math.max(0, (now - session.startedAt) / (session.planned * 60000)));

  return (
    <div className="sf-focus-pill-wrap" ref={wrapRef}>
      <button
        type="button"
        className="sf-focus-pill"
        data-counting={counting ? "true" : undefined}
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="sf-focus-pill-ring" style={{ ["--share" as string]: share }} aria-hidden="true">
          <Icon name="timer" size={14} />
        </span>
        <span className="sf-focus-pill-time">{clock(left)}</span>
        <span className="sf-sr">
          left in your focus session, {counted} {counted === 1 ? "minute" : "minutes"} counted{counting ? ", counting now" : ", paused"}
        </span>
      </button>
      {open ? (
        <div className="sf-focus-panel" id={panelId} role="dialog" aria-label="Focus session">
          <p className="sf-focus-panel-title">
            <Icon name="timer" size={16} /> {session.planned}-minute focus session
          </p>
          <p className="sf-focus-panel-count">
            <strong>{counted}</strong> {counted === 1 ? "minute" : "minutes"} counted · {clock(left)} left
          </p>
          <p className="sf-focus-panel-state" data-counting={counting ? "true" : undefined}>
            {counting ? "Counting now. Stay with this page." : "Paused. Minutes count on a lesson, an explain-back, Notes, or a recall card."}
          </p>
          <div className="sf-focus-panel-actions">
            <Button variant="gradient" size="sm" pending={focus.saving} pendingLabel="Saving…" onClick={() => void focus.finish().then(() => setOpen(false))}>
              Finish and save
            </Button>
            <Button variant="ghost" size="sm" onClick={() => { focus.cancel(); setOpen(false); }}>
              Stop without saving
            </Button>
          </div>
          <Link className="sf-focus-panel-link" href="/detox#focus" onClick={() => setOpen(false)}>
            About focus sessions
          </Link>
        </div>
      ) : null}
    </div>
  );
}
