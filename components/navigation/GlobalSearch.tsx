"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Icon } from "@/components/core/Icon.jsx";
import { useCalmMotion, useHydrated } from "@/components/feedback/useCalmMotion";
import { useFocusTrap } from "@/components/feedback/useFocusTrap";
import { groupHits, KIND_LABEL, searchEntries, words, type SearchEntry, type SearchHit } from "@/lib/search/score";
import { SEARCH_SUGGESTIONS, STATIC_SEARCH } from "@/lib/search/static";
import { applyTheme, readTheme } from "@/lib/theme";

/**
 * Global search in the top bar. Pages, features, settings, and quick actions are searched in the browser at once;
 * niches, stages, resources, and Open Source posts come from /api/search (a cached index). Ctrl or Cmd + K, or "/",
 * opens it from anywhere. Recent picks are kept per browser in localStorage.
 */

const RECENT_KEY = "skillflow-recent-search";
export const OPEN_TOUR_EVENT = "skillflow-open-tour";

type Recent = Pick<SearchEntry, "id" | "kind" | "title" | "description" | "href" | "icon" | "action" | "badge">;

function readRecent(): Recent[] {
  try {
    const raw = window.localStorage.getItem(RECENT_KEY);
    const list = raw ? (JSON.parse(raw) as Recent[]) : [];
    return Array.isArray(list) ? list.filter((item) => item && typeof item.title === "string").slice(0, 5) : [];
  } catch {
    return [];
  }
}

function saveRecent(entry: SearchEntry) {
  try {
    const item: Recent = { id: entry.id, kind: entry.kind, title: entry.title, description: entry.description, href: entry.href, icon: entry.icon, action: entry.action, badge: entry.badge };
    const next = [item, ...readRecent().filter((other) => other.id !== entry.id)].slice(0, 5);
    window.localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    // Private mode: search still works, it just does not remember.
  }
}

function typingTarget(target: EventTarget | null) {
  return target instanceof HTMLElement && (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));
}

/** The title with each query word's first match in bold. */
function Highlight({ text, query }: { text: string; query: string }) {
  const tokens = words(query).filter((token) => token.length > 0);
  if (!tokens.length) return <>{text}</>;
  const lower = text.toLowerCase();
  const marks: [number, number][] = [];
  for (const token of tokens) {
    const at = lower.indexOf(token);
    if (at >= 0) marks.push([at, at + token.length]);
  }
  marks.sort((a, b) => a[0] - b[0]);
  const parts: ReactNode[] = [];
  let cursor = 0;
  marks.forEach(([start, end], index) => {
    if (start < cursor) return;
    if (start > cursor) parts.push(text.slice(cursor, start));
    parts.push(<mark key={index}>{text.slice(start, end)}</mark>);
    cursor = end;
  });
  parts.push(text.slice(cursor));
  return <>{parts}</>;
}

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const hydrated = useHydrated();
  const [mac, setMac] = useState(false);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const combo = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k";
      const slash = event.key === "/" && !event.ctrlKey && !event.metaKey && !event.altKey && !typingTarget(event.target);
      if (!combo && !slash) return;
      if (document.querySelector('[aria-modal="true"]') && !combo) return;
      event.preventDefault();
      setMac(/Mac|iPhone|iPad/.test(navigator.platform));
      setOpen(true);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <button
        type="button"
        className="sf-search-trigger"
        aria-haspopup="dialog"
        aria-label="Search SkillFlow"
        aria-keyshortcuts="Control+K Meta+K /"
        onClick={() => {
          setMac(/Mac|iPhone|iPad/.test(navigator.platform));
          setOpen(true);
        }}
      >
        <Icon name="search" size={16} />
        <span className="sf-search-trigger-text" aria-hidden="true">Search SkillFlow</span>
        <kbd className="sf-search-trigger-kbd" aria-hidden="true">
          {mac ? "⌘K" : "Ctrl K"}
        </kbd>
      </button>
      {hydrated ? createPortal(<AnimatePresence>{open ? <SearchDialog key="search" onClose={() => setOpen(false)} /> : null}</AnimatePresence>, document.body) : null}
    </>
  );
}

function SearchDialog({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const reduce = useCalmMotion();
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();
  const [query, setQuery] = useState("");
  const [remote, setRemote] = useState<SearchHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(0);
  const [recent] = useState<Recent[]>(() => (typeof window === "undefined" ? [] : readRecent()));

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

  const trimmed = query.trim();
  useEffect(() => {
    if (trimmed.length < 2) return undefined;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setLoading(true);
      fetch(`/api/search?q=${encodeURIComponent(trimmed)}`, { signal: controller.signal, cache: "no-store" })
        .then((response) => (response.ok ? response.json() : { hits: [] }))
        .then((data: { hits?: SearchHit[] }) => {
          setRemote(Array.isArray(data.hits) ? data.hits : []);
          setLoading(false);
        })
        .catch(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
    }, 140);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [trimmed]);

  const groups = useMemo(() => {
    if (!trimmed) {
      const suggestions = SEARCH_SUGGESTIONS.map((id) => STATIC_SEARCH.find((entry) => entry.id === id)).filter((entry) => entry !== undefined);
      const list = [
        ...(recent.length ? [{ kind: "recent" as const, label: "Recent", hits: recent.map((item) => ({ ...item, score: 0 })) }] : []),
        { kind: "suggested" as const, label: "Try", hits: suggestions.map((entry) => ({ ...entry, score: 0 })) },
      ];
      return list;
    }
    const local = searchEntries(STATIC_SEARCH, trimmed, 12);
    const live = trimmed.length >= 2 ? remote : [];
    return groupHits([...local, ...live]);
  }, [trimmed, remote, recent]);

  const flat = useMemo(() => groups.flatMap((group) => group.hits), [groups]);
  // Each option's place in the flat list, worked out once, so arrow keys and the list agree.
  const indexed = useMemo(() => {
    let next = 0;
    return groups.map((group) => ({ ...group, items: group.hits.map((hit) => ({ hit, index: next++ })) }));
  }, [groups]);
  const current = Math.min(active, Math.max(0, flat.length - 1));

  const choose = useCallback(
    (hit: SearchEntry) => {
      saveRecent(hit);
      onClose();
      if (hit.action === "theme") {
        applyTheme(readTheme() === "dark" ? "light" : "dark");
        return;
      }
      if (hit.action === "tour") {
        if (window.location.pathname === "/dashboard") window.dispatchEvent(new CustomEvent(OPEN_TOUR_EVENT));
        else router.push("/dashboard?tour=1");
        return;
      }
      if (hit.href) router.push(hit.href);
    },
    [onClose, router],
  );

  function onKeyDown(event: React.KeyboardEvent) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((index) => (flat.length ? (Math.min(index, flat.length - 1) + 1) % flat.length : 0));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((index) => (flat.length ? (Math.min(index, flat.length - 1) - 1 + flat.length) % flat.length : 0));
    } else if (event.key === "Enter") {
      const hit = flat[current];
      if (hit) {
        event.preventDefault();
        choose(hit);
      }
    }
  }

  useEffect(() => {
    document.getElementById(`${listId}-opt-${current}`)?.scrollIntoView({ block: "nearest" });
  }, [current, listId]);

  const count = trimmed ? flat.length : 0;

  return (
    <motion.div
      className="sf-search"
      initial={reduce ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={reduce ? { opacity: 0, transition: { duration: 0 } } : { opacity: 0, transition: { duration: 0.12 } }}
      transition={reduce ? { duration: 0 } : { duration: 0.16 }}
    >
      <button type="button" className="sf-search-backdrop" tabIndex={-1} aria-hidden="true" onClick={onClose} />
      <motion.div
        ref={panelRef}
        className="sf-search-panel"
        role="dialog"
        aria-modal="true"
        aria-label="Search SkillFlow"
        initial={reduce ? false : { y: -10, scale: 0.98 }}
        animate={{ y: 0, scale: 1 }}
        transition={reduce ? { duration: 0 } : { duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="sf-search-field">
          <Icon name="search" size={18} />
          <input
            ref={inputRef}
            type="search"
            role="combobox"
            aria-expanded={flat.length > 0}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={flat.length ? `${listId}-opt-${current}` : undefined}
            aria-label="Search niches, stages, resources, features, and settings"
            placeholder="Search niches, stages, features, settings…"
            value={query}
            maxLength={80}
            onChange={(event) => {
              setQuery(event.target.value);
              setActive(0);
              if (event.target.value.trim().length < 2) setRemote([]);
            }}
            onKeyDown={onKeyDown}
          />
          {loading ? <span className="sf-btn-spinner" aria-hidden="true" /> : null}
          <button type="button" className="sf-search-close" onClick={onClose}>
            Esc
            <span className="sf-sr"> to close search</span>
          </button>
        </div>

        <p className="sf-sr" role="status" aria-live="polite">
          {trimmed ? `${count} ${count === 1 ? "result" : "results"}` : ""}
        </p>

        <div className="sf-search-results">
          {trimmed && flat.length === 0 && !loading ? (
            <div className="sf-search-empty">
              <Icon name="search-x" size={22} />
              <p>
                Nothing matches &ldquo;{trimmed}&rdquo; yet. Try a niche like <strong>chess</strong>, a feature like <strong>recall</strong>, or a
                setting like <strong>dark mode</strong>.
              </p>
            </div>
          ) : (
            <ul id={listId} role="listbox" aria-label="Search results" className="sf-search-list">
              {indexed.map((group) => (
                <li key={group.kind} role="presentation" className="sf-search-group">
                  <p className="sf-search-group-label" role="presentation">
                    {group.label}
                  </p>
                  <ul role="group" aria-label={group.label}>
                    {group.items.map(({ hit, index }) => {
                      return (
                        <li
                          key={`${group.kind}-${hit.id}`}
                          id={`${listId}-opt-${index}`}
                          role="option"
                          aria-selected={index === current}
                          className="sf-search-option"
                          onMouseMove={() => setActive(index)}
                          onClick={() => choose(hit)}
                        >
                          <span className="sf-search-option-icon" data-kind={hit.kind} aria-hidden="true">
                            <Icon name={hit.icon ?? "arrow-right"} size={16} />
                          </span>
                          <span className="sf-search-option-text">
                            <span className="sf-search-option-title">
                              <Highlight text={hit.title} query={trimmed} />
                            </span>
                            {hit.description ? <span className="sf-search-option-desc">{hit.description}</span> : null}
                          </span>
                          {hit.badge ? <span className="sf-search-badge" data-badge={hit.badge}>{hit.badge}</span> : null}
                          <span className="sf-search-kind">{KIND_LABEL[hit.kind]}</span>
                        </li>
                      );
                    })}
                  </ul>
                </li>
              ))}
            </ul>
          )}
        </div>

        <p className="sf-search-foot" aria-hidden="true">
          <span>
            <kbd>↑</kbd>
            <kbd>↓</kbd> to move
          </span>
          <span>
            <kbd>Enter</kbd> to open
          </span>
          <span>
            <kbd>Esc</kbd> to close
          </span>
        </p>
      </motion.div>
    </motion.div>
  );
}
