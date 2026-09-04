import React from "react";

/** Mastery-relevant metric tile. Neutral surface; value in accent. */
export function StatCard({ label, value, unit, hint, icon, emphasis = false, style, ...rest }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 6,
        padding: "16px 18px",
        borderRadius: "var(--radius-panel)",
        background: emphasis ? "var(--surface-card-accent)" : "var(--surface-card)",
        border: "1px solid " + (emphasis ? "var(--border-accent)" : "var(--border-subtle)"),
        ...style,
      }}
      {...rest}
    >
      <span style={{ display: "flex", alignItems: "center", gap: 7, fontSize: "var(--text-xs)", fontWeight: "var(--weight-medium)", color: "var(--text-muted)" }}>
        {icon}
        {label}
      </span>
      <span style={{ display: "flex", alignItems: "baseline", gap: 4, fontSize: "var(--text-title)", lineHeight: 1, fontWeight: "var(--weight-bold)", color: emphasis ? "var(--text-accent)" : "var(--text-primary)" }}>
        {value}
        {unit ? <span style={{ fontSize: "var(--text-subtitle)", fontWeight: "var(--weight-medium)", color: "var(--text-muted)" }}>{unit}</span> : null}
      </span>
      {hint ? <span style={{ fontSize: "var(--text-2xs)", color: "var(--text-faint)" }}>{hint}</span> : null}
    </div>
  );
}
