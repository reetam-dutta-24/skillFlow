import * as React from "react";

/**
 * SkillFlow action button. `gradient` is the primary CTA and the only
 * gradient-filled surface in the system; on hover it de-fills to an
 * accent outline (behaviour inherited from AniVerse).
 *
 * @startingPoint section="Primitives" subtitle="Button variants and sizes" viewport="700x150"
 */
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "gradient" | "outline" | "ghost" | "quiet";
  size?: "sm" | "md" | "lg" | "xl";
  /** Stretch to the container width. */
  full?: boolean;
  /** Fully rounded capsule instead of the 10px button radius. */
  pill?: boolean;
  /** The action is running: shows a spinner, keeps the width, disables the button, sets aria-busy. */
  pending?: boolean;
  /** Optional text while pending, e.g. "Saving…". Defaults to the normal label. */
  pendingLabel?: React.ReactNode;
}
export function Button(props: ButtonProps): React.JSX.Element;
