import React from "react";

const TINTS = {
  neutral: "var(--surface-card)",
  accent: "var(--surface-card-accent)",
  sunken: "var(--bg-sunken)",
};

/** Translucent panel with the AniVerse inner shadow. */
export function GlassCard({ tint = "neutral", bordered = true, radius, style, children, ...rest }) {
  return (
    <div
      style={{
        position: "relative",
        overflow: "hidden",
        borderRadius: radius || "var(--radius-card)",
        background: TINTS[tint] || TINTS.neutral,
        border: bordered ? "1px solid var(--border-subtle)" : "none",
        boxShadow: "var(--shadow-card-inner)",
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
}
