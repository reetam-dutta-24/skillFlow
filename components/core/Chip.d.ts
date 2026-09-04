import * as React from "react";

/**
 * Capsule label. AniVerse mapped ~30 gradient hues to content genres;
 * SkillFlow collapses that to six semantic tones so colour always means state.
 */
export interface ChipProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: "accent" | "neutral" | "pass" | "warn" | "fail" | "lock" | "brand";
  size?: "sm" | "md";
  icon?: React.ReactNode;
}
export function Chip(props: ChipProps): React.JSX.Element;
