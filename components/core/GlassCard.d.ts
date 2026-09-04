import * as React from "react";

/** Translucent tinted panel — the base surface for every SkillFlow card and section. */
export interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  tint?: "neutral" | "accent" | "sunken";
  bordered?: boolean;
  /** Override the 24px card radius (e.g. `var(--radius-panel)`). */
  radius?: string;
}
export function GlassCard(props: GlassCardProps): React.JSX.Element;
