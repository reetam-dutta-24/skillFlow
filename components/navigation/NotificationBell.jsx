"use client";

import React from "react";
import { Icon } from "../core/Icon.jsx";

/** Bell with a quiet unread dot — no count badge, no glow. */
export function NotificationBell({ count = 0, onClick, style, ...rest }) {
  const [hover, setHover] = React.useState(false);
  return (
    <button
      type="button"
      aria-label={count > 0 ? "Notifications, unread" : "Notifications"}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
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
        <span style={{ position: "absolute", top: 7, right: 8, width: 6, height: 6, borderRadius: "var(--radius-full)", background: "var(--accent)" }} />
      ) : null}
    </button>
  );
}
