"use client";

import React from "react";
import { Icon } from "../core/Icon.jsx";
import { applyTheme } from "../../lib/theme";

const OPTIONS = [
  { id: "light", label: "Light", icon: "sun" },
  { id: "dark", label: "Dark", icon: "moon" },
];

/**
 * Segmented dark/light control. Writes the theme class onto `target`
 * (default: the document element) and persists the choice in a cookie.
 */
export function ThemeToggle({
  theme: themeProp,
  defaultTheme = "dark",
  onChange,
  target,
  compact = false,
  style,
  ...rest
}) {
  const [uncontrolledTheme, setUncontrolledTheme] = React.useState(defaultTheme);
  const theme = themeProp ?? uncontrolledTheme;

  function pick(id) {
    applyTheme(id, target);
    if (themeProp === undefined) setUncontrolledTheme(id);
    if (onChange) onChange(id);
  }

  return (
    <div
      role="group"
      aria-label="Color theme"
      style={{
        display: "inline-flex",
        padding: 3,
        gap: 2,
        borderRadius: "var(--radius-full)",
        background: "var(--surface-card)",
        border: "1px solid var(--border-subtle)",
        ...style,
      }}
      {...rest}
    >
      {OPTIONS.map((option) => {
        const active = theme === option.id;
        return (
          <button
            key={option.id}
            type="button"
            aria-pressed={active}
            aria-label={compact ? `${option.label} theme` : undefined}
            onClick={() => pick(option.id)}
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
              backgroundColor: "transparent",
              boxShadow: active ? "var(--glow-accent-soft)" : "none",
              transition:
                "color var(--dur-fast) var(--ease-in-out), box-shadow var(--dur-base) var(--ease-in-out)",
            }}
          >
            <Icon name={option.icon} size={14} />
            {compact ? null : option.label}
          </button>
        );
      })}
    </div>
  );
}
