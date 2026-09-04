import React from "react";

const TONES = {
  accent: { bg: "var(--accent-quiet)", fg: "var(--text-accent)", bd: "var(--border-accent)" },
  neutral: { bg: "var(--surface-card)", fg: "var(--text-secondary)", bd: "var(--border-default)" },
  pass: { bg: "var(--state-pass-bg)", fg: "var(--state-pass)", bd: "var(--state-pass)" },
  warn: { bg: "var(--state-warn-bg)", fg: "var(--state-warn)", bd: "var(--state-warn)" },
  fail: { bg: "var(--state-fail-bg)", fg: "var(--state-fail)", bd: "var(--state-fail)" },
  lock: { bg: "var(--surface-lock)", fg: "var(--state-lock)", bd: "var(--border-subtle)" },
  brand: { bg: "transparent", fg: "var(--text-on-accent)", bd: "transparent" },
};

/** Small capsule label. Single restrained palette — no per-category hues. */
export function Chip({ tone = "neutral", size = "sm", icon, style, children, ...rest }) {
  const t = TONES[tone] || TONES.neutral;
  const big = size === "md";
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        whiteSpace: "nowrap",
        height: big ? 28 : 20,
        padding: big ? "0 12px" : "0 8px",
        borderRadius: "var(--radius-chip)",
        fontSize: big ? "var(--text-xs)" : "var(--text-3xs)",
        fontWeight: "var(--weight-medium)",
        lineHeight: 1,
        background: tone === "brand" ? undefined : t.bg,
        backgroundImage: tone === "brand" ? "var(--gradient-brand)" : undefined,
        color: t.fg,
        border: "1px solid " + t.bd,
        ...style,
      }}
      {...rest}
    >
      {icon}
      {children}
    </span>
  );
}
