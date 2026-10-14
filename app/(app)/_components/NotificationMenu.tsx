"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/core/Button.jsx";
import { Icon } from "@/components/core/Icon.jsx";
import { NotificationBell } from "@/components/navigation/NotificationBell.jsx";
import { EmptyState } from "@/components/feedback/EmptyState.jsx";
import type { NotificationView } from "@/lib/types/domain";
import { markAllNotificationsRead } from "./notification-actions";

export function NotificationMenu({ items }: { items: NotificationView[] }) {
  // Everything up to this time was marked read here. A note that arrives later still counts as new.
  const [readThrough, setReadThrough] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const list = items.map((item) => ({ ...item, read: item.read || (readThrough != null && item.at <= readThrough) }));
  const count = list.filter((item) => !item.read).length;
  const rootRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useEffect(() => {
    if (!open) return undefined;
    function onKey(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setOpen(false);
      rootRef.current?.querySelector("button")?.focus();
    }
    function onPointer(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [open]);

  function markAll() {
    // The badge clears at once; the time is saved on the profile so a reload keeps it at zero.
    setReadThrough(new Date().toISOString());
    setError("");
    void markAllNotificationsRead().then((result) => {
      if (!result.ok) {
        setReadThrough(null);
        setError(result.error);
      }
    });
  }

  return (
    <div className="sf-app-pop" ref={rootRef}>
      <NotificationBell count={count} aria-expanded={open} aria-controls={open ? titleId : undefined} onClick={() => setOpen((value) => !value)} />
      {open ? (
        <div className="sf-app-pop-panel sf-notes-panel" id={titleId} role="region" aria-label="Notifications">
          <div className="sf-app-pop-head">
            <p>
              Notifications
              {count > 0 ? <span className="sf-notes-count">{count} new</span> : null}
            </p>
            <Button type="button" variant="quiet" size="sm" disabled={count === 0} onClick={markAll}>
              Mark all as read
            </Button>
          </div>
          {error ? (
            <p className="sf-auth-error" role="alert">
              {error}
            </p>
          ) : null}
          {list.length ? (
            <ul className="sf-app-notes" aria-live="polite">
              {list.map((item) => {
                const body = (
                  <>
                    <span className="sf-note-icon" data-kind={item.kind} aria-hidden="true">
                      <Icon name={item.icon} size={16} />
                    </span>
                    <span className="sf-note-copy">
                      <span className="sf-note-title">{item.title}</span>
                      <span className="sf-note-message">{item.message}</span>
                      <span className="sf-note-meta">
                        <span>{item.timeLabel}</span>
                        {item.read ? null : <span className="sf-note-unread">New</span>}
                      </span>
                    </span>
                  </>
                );
                return (
                  <li key={item.id} data-read={item.read ? "true" : "false"}>
                    {item.href ? (
                      <Link className="sf-note-row" href={item.href} onClick={() => setOpen(false)}>
                        {body}
                      </Link>
                    ) : (
                      <div className="sf-note-row">{body}</div>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <EmptyState compact icon="bell" title="No notifications" description="Review results, answers to your questions, and your streak reminder show up here." />
          )}
          <p className="sf-notes-foot">
            <Link href="/settings#notifications" onClick={() => setOpen(false)}>
              Notification settings
            </Link>
          </p>
        </div>
      ) : null}
    </div>
  );
}
