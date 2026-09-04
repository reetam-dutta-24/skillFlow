"use client";

import React from "react";
import { Icon } from "../core/Icon.jsx";

const OPTIONS = [
  { id: "light", label: "Light", icon: "sun" },
  { id: "dark", label: "Dark", icon: "moon" },
];

/** Segmented dark/light control. Toggles the dark/light class on the target element. */
export function ThemeToggle({ theme = "dark", onChange, target, compact = false, style, ...rest }) {
  function pick(id) {
    const root = target || document.documentElement;
    if (root) {
      root.classList.remove("dark", "light");
      root.classList.add(id);
    }
    if (onChange) onChange(id);
  }
  return (
    <div style={{ display: "inline-flex", padding: 3, gap: 2, borderRadius: "var(--radius-full)", background: "var(--surface-card)", border: "1px solid var(--border-subtle)", ...style }} {...rest}>
      {OPTIONS.map((o) => {
        const active = theme === o.id;
        return (
          <button
            key={o.id}
            type="button"
            aria-pressed={active}
            onClick={() => pick(o.id)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              height: 30,
              padding: compact ? "0 9px" : "0 14px",
              border: "none",
              cursor: "pointer",
              borderRadius: "var(--radius-full)",
              fontFamily: "var(--font-sans)",
              fontSize: "var(--text-xs)",
              fontWeight: "var(--weight-semibold)",
              color: active ? "var(--text-on-accent)" : "var(--text-muted)",
              backgroundImage: active ? "var(--gradient-brand)" : "none",
              background: active ? undefined : "transparent",
              transition: "color var(--dur-fast) var(--ease-in-out)",
            }}
          >
            <Icon name={o.icon} size={14} />
            {compact ? null : o.label}
          </button>
        );
      })}
    </div>
  );
}
