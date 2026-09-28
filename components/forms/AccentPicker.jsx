"use client";

import React from "react";
import { ACCENTS, applyAccent } from "../../lib/accent";

/**
 * Curated accent presets. Writes data-accent on the document and persists
 * the choice. Surfaces stay on the dark/light theme; only the accent changes.
 */
export function AccentPicker({
  accent: accentProp,
  defaultAccent = "tide",
  onChange,
  target,
  style,
  ...rest
}) {
  const [uncontrolledAccent, setUncontrolledAccent] = React.useState(defaultAccent);
  const accent = accentProp ?? uncontrolledAccent;
  const current = ACCENTS.find((item) => item.id === accent) ?? ACCENTS[0];

  function pick(id) {
    applyAccent(id, target);
    if (accentProp === undefined) setUncontrolledAccent(id);
    if (onChange) onChange(id);
  }

  return (
    <div
      role="group"
      aria-label="Accent color"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "var(--space-3)",
        ...style,
      }}
      {...rest}
    >
      <span
        style={{
          fontFamily: "var(--font-sans)",
          fontSize: "var(--text-xs)",
          fontWeight: "var(--weight-semibold)",
          color: "var(--text-secondary)",
        }}
      >
        {current.label}
      </span>
      <span style={{ display: "inline-flex", flexWrap: "wrap", alignItems: "center", gap: "var(--space-2)" }}>
        {ACCENTS.map((option) => {
          const active = accent === option.id;
          return (
            <button
              key={option.id}
              type="button"
              data-accent-swatch={option.id}
              aria-pressed={active}
              aria-label={`${option.label} accent`}
              onClick={() => pick(option.id)}
              style={{
                width: 28,
                height: 28,
                padding: 0,
                border: "none",
                cursor: "pointer",
                borderRadius: "var(--radius-full)",
                boxShadow: active
                  ? "0 0 0 2px var(--bg-app), 0 0 0 4px var(--text-primary), var(--glow-accent-soft)"
                  : "none",
              }}
            />
          );
        })}
      </span>
    </div>
  );
}
