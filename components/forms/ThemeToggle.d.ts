import * as React from "react";

/**
 * Dark/light theme switch. New in SkillFlow — AniVerse was dark-only.
 * Adds `dark` or `light` on `target` (default `document.documentElement`)
 * and persists the choice in a cookie.
 */
export interface ThemeToggleProps extends React.HTMLAttributes<HTMLDivElement> {
  theme?: "dark" | "light";
  /** Initial mode when `theme` is omitted. Server layouts pass the stored value. */
  defaultTheme?: "dark" | "light";
  onChange?: (theme: "dark" | "light") => void;
  /** Element that receives the theme class. */
  target?: HTMLElement | null;
  /** Icons only, no labels — for the topbar. */
  compact?: boolean;
  /** Hides the segmented track chrome. Already implemented on the component. */
  quiet?: boolean;
}
export function ThemeToggle(props: ThemeToggleProps): React.JSX.Element;
