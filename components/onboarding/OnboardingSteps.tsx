import React from "react";
import { Icon } from "../core/Icon.jsx";

export interface OnboardingStepsProps {
  steps: string[];
  /** 1-indexed — which step is currently active. */
  current: number;
}

// Desktop-only vertical step rail (hidden below md, where PaginationDots +
// the step title take over — see onboarding-view.tsx). Visual language
// borrowed from RoadmapStage's status circle/connector, simplified: no
// lock/blur, since wizard steps are sequential, not gated content.
export function OnboardingSteps({ steps, current }: OnboardingStepsProps) {
  return (
    <ol className="hidden md:flex" style={{ flexDirection: "column", listStyle: "none", margin: 0, padding: 0, width: 200, flexShrink: 0 }}>
      {steps.map((label, i) => {
        const step = i + 1;
        const done = step < current;
        const active = step === current;
        const last = i === steps.length - 1;
        return (
          <li key={label} style={{ display: "flex", gap: 14 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 28,
                  height: 28,
                  flexShrink: 0,
                  borderRadius: "var(--radius-full)",
                  background: active ? "var(--accent-quiet)" : done ? "var(--surface-card)" : "transparent",
                  border: "1px solid " + (active ? "var(--border-accent)" : done ? "var(--state-pass)" : "var(--border-default)"),
                  fontSize: "var(--text-xs)",
                  fontWeight: "var(--weight-semibold)",
                  color: active ? "var(--accent)" : done ? "var(--state-pass)" : "var(--text-faint)",
                }}
              >
                {done ? <Icon name="check" size={13} color="var(--state-pass)" strokeWidth={3} /> : step}
              </span>
              {!last ? <span style={{ flex: 1, width: 1, minHeight: 28, marginTop: 4, background: done ? "var(--state-pass)" : "var(--border-default)", opacity: done ? 0.5 : 1 }} /> : null}
            </div>
            <p
              style={{
                margin: "4px 0 0",
                fontSize: "var(--text-sm)",
                fontWeight: active ? "var(--weight-semibold)" : "var(--weight-medium)",
                color: active ? "var(--text-primary)" : done ? "var(--text-secondary)" : "var(--text-faint)",
              }}
            >
              {label}
            </p>
          </li>
        );
      })}
    </ol>
  );
}
