import * as React from "react";

/** Mastery percentage badge — the SkillFlow reframing of AniVerse's "AI Match %". */
export interface MasteryChipProps extends React.HTMLAttributes<HTMLSpanElement> {
  percent: number;
  size?: "sm" | "md";
}
export function MasteryChip(props: MasteryChipProps): React.JSX.Element;
