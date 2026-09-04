import React from "react";

/** Linear progress track — mastery, quiz position, onboarding steps. */
export function ProgressBar({ value = 0, max = 100, height = 6, label, showValue = false, tone = "accent", style, ...rest }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const fill = tone === "pass" ? "var(--state-pass)" : tone === "warn" ? "var(--state-warn)" : "var(--gradient-brand)";
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, width: "100%", ...style }} {...rest}>
      {label || showValue ? (
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>
          <span>{label}</span>
          {showValue ? <span style={{ color: "var(--text-primary)", fontWeight: "var(--weight-semibold)" }}>{Math.round(pct)}%</span> : null}
        </div>
      ) : null}
      <div role="progressbar" aria-valuenow={value} aria-valuemax={max} style={{ height, borderRadius: "var(--radius-full)", background: "var(--chart-track)", overflow: "hidden" }}>
        <div style={{ width: pct + "%", height: "100%", borderRadius: "var(--radius-full)", background: fill, transition: "width var(--dur-slow) var(--ease-out-expo)" }} />
      </div>
    </div>
  );
}
