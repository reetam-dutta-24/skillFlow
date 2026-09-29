"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/core/Button.jsx";
import { NotificationBell } from "@/components/navigation/NotificationBell.jsx";
import { EmptyState } from "@/components/feedback/EmptyState.jsx";
import type { NotificationView } from "@/lib/types/domain";

export function NotificationMenu({ items }: { items: NotificationView[] }) {
  const [readIds, setReadIds] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const list = items.map((item) => ({ ...item, read: item.read || readIds.includes(item.id) }));
  const rootRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const unread = list.some((item) => !item.read);

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
    setReadIds(items.map((item) => item.id));
  }

  return (
    <div className="sf-app-pop" ref={rootRef}>
      <NotificationBell count={unread ? 1 : 0} aria-expanded={open} aria-controls={open ? titleId : undefined} onClick={() => setOpen((value) => !value)} />
      {open ? (
        <div className="sf-app-pop-panel" id={titleId} role="region" aria-label="Notifications">
          <div className="sf-app-pop-head">
            <p>Notifications</p>
            <Button type="button" variant="quiet" size="sm" disabled={!unread} onClick={markAll}>
              Mark all as read
            </Button>
          </div>
          {list.length ? (
            <ul className="sf-app-notes" aria-live="polite">
              {list.map((item) => (
                <li key={item.id} data-read={item.read ? "true" : "false"}>
                  <p>{item.title}</p>
                  <p>{item.message}</p>
                  <p>
                    <span>{item.timeLabel}</span>
                    {item.read ? <span>Read</span> : <span>Unread</span>}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState compact icon="bell" title="No notifications" description="Review updates will show up here." />
          )}
        </div>
      ) : null}
    </div>
  );
}
