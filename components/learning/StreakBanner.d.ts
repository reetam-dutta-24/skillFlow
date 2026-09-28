import * as React from "react";

/**
 * Home page banner. Replaces the AniVerse `WelcomeBanner`: one fact
 * (the streak) and one action (resume), no emoji highlight list, no counters.
 *
 * @startingPoint section="Learning" subtitle="Home streak + resume banner" viewport="700x140"
 */
export interface StreakBannerProps extends React.HTMLAttributes<HTMLElement> {
  streak?: number;
  /** The lesson or stage the user resumes into. */
  nextLabel?: React.ReactNode;
  nextSkill?: React.ReactNode;
  /** Link for the resume action. Used instead of `onContinue` when the destination is a route. */
  continueHref?: string;
  onContinue?: () => void;
}
export function StreakBanner(props: StreakBannerProps): React.JSX.Element;
