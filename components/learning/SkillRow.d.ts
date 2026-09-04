import * as React from "react";

/**
 * Per-skill horizontal row. Inherits the AniVerse carousel row layout
 * (heading + arrows + scrolling slot track); each selected skill gets its own
 * row and rows are never blended into one mixed feed.
 */
export interface SkillRowProps extends React.HTMLAttributes<HTMLElement> {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  mastery?: number;
  onOpenRoadmap?: () => void;
}
export function SkillRow(props: SkillRowProps): React.JSX.Element;
