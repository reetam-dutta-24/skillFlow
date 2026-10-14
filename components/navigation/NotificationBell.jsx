"use client";

import React from "react";
import { Icon } from "../core/Icon.jsx";

/** Bell with a numeric unread badge. The count is capped at 99+ so the bell keeps its size. */
export function NotificationBell({ count = 0, onClick, style, ...rest }) {
  const [hover, setHover] = React.useState(false);
  const label = count > 99 ? "99+" : String(count);
  return (
    <button
      type="button"
      aria-label={count > 0 ? `Notifications, ${count} unread` : "Notifications"}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="sf-bell"
      style={{
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 34,
        height: 34,
        border: "none",
        cursor: "pointer",
        borderRadius: "var(--radius-btn)",
        background: hover ? "var(--surface-hover)" : "transparent",
        color: "var(--text-secondary)",
        transition: "background var(--dur-fast) var(--ease-in-out)",
        ...style,
      }}
      {...rest}
    >
      <Icon name="bell" size={17} />
      {count > 0 ? (
        <span className="sf-bell-badge" aria-hidden="true">
          {label}
        </span>
      ) : null}
    </button>
  );
}
