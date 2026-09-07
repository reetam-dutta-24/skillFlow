import React from "react";

export type SkillLevel = "beginner" | "some-experience" | "advanced";

const LEVELS: { id: SkillLevel; label: string }[] = [
  { id: "beginner", label: "Beginner" },
  { id: "some-experience", label: "Some experience" },
  { id: "advanced", label: "Advanced" },
];

export interface LevelSelectorProps {
  value: SkillLevel | null;
  onChange: (level: SkillLevel) => void;
}

// Segmented pill control, modeled on ThemeToggle's visual pattern — one
// instance per skill chosen in onboarding Step 1, to set that skill's
// starting stage (not wired into any logic yet, per the mock-data phase).
export function LevelSelector({ value, onChange }: LevelSelectorProps) {
  return (
    <div style={{ display: "inline-flex", flexWrap: "wrap", padding: 3, gap: 2, borderRadius: "var(--radius-full)", background: "var(--surface-card)", border: "1px solid var(--border-subtle)" }}>
      {LEVELS.map((level) => {
        const active = value === level.id;
        return (
          <button
            key={level.id}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(level.id)}
            style={{
              height: 32,
              padding: "0 16px",
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
            {level.label}
          </button>
        );
      })}
    </div>
  );
}
