import * as React from "react";

/**
 * Dark/light theme switch. New in SkillFlow — AniVerse was dark-only.
 * Sets `data-theme` on `target` (default `document.documentElement`).
 */
export interface ThemeToggleProps extends React.HTMLAttributes<HTMLDivElement> {
  theme?: "dark" | "light";
  onChange?: (theme: "dark" | "light") => void;
  /** Element that receives the data-theme attribute. */
  target?: HTMLElement | null;
  /** Icons only, no labels — for the topbar. */
  compact?: boolean;
}
export function ThemeToggle(props: ThemeToggleProps): React.JSX.Element;
