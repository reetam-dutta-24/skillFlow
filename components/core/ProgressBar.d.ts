import * as React from "react";

/**
 * Linear progress track. Intentional addition — AniVerse only had the
 * segmented onboarding step bar; SkillFlow needs a continuous mastery track.
 */
export interface ProgressBarProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
  max?: number;
  height?: number;
  label?: React.ReactNode;
  showValue?: boolean;
  tone?: "accent" | "pass" | "warn";
}
export function ProgressBar(props: ProgressBarProps): React.JSX.Element;
