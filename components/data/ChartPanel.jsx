import React from "react";
import { GlassCard } from "../core/GlassCard.jsx";

/** Titled panel wrapping a chart or stat block. */
export function ChartPanel({ title, subtitle, action, children, style, ...rest }) {
  return (
    <GlassCard style={{ display: "flex", flexDirection: "column", gap: 16, padding: 20, ...style }} {...rest}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: "var(--text-subtitle)", fontWeight: "var(--weight-bold)", color: "var(--text-primary)" }}>{title}</h2>
          {subtitle ? <p style={{ margin: "2px 0 0", fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>{subtitle}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </GlassCard>
  );
}
