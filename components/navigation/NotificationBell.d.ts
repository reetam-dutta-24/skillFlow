import * as React from "react";

/**
 * Topbar notification affordance. AniVerse showed a magenta "+N" badge with
 * a glow; SkillFlow shows a 6px accent dot — presence, not pressure.
 */
export interface NotificationBellProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Any value > 0 shows the dot; the number itself is never rendered. */
  count?: number;
}
export function NotificationBell(props: NotificationBellProps): React.JSX.Element;
