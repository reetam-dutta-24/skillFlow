import * as React from "react";

/**
 * Split-screen auth layout, inherited from AniVerse's `(auth)` route:
 * a copy panel on the left and a centered card on the right. The blurred
 * poster collage is replaced by a soft two-stop accent wash, since SkillFlow
 * has no cover imagery.
 *
 * @startingPoint section="Navigation" subtitle="Split-screen sign-in layout" viewport="1100x620"
 */
export interface AuthShellProps extends React.HTMLAttributes<HTMLDivElement> {
  headline: React.ReactNode;
  sub?: React.ReactNode;
  brand?: React.ReactNode;
}
export function AuthShell(props: AuthShellProps): React.JSX.Element;
