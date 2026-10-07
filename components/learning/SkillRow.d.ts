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
  /** Route for the roadmap control. Used instead of `onOpenRoadmap` when the destination is a page. */
  roadmapHref?: string;
  /** When set, the row can stop following this skill. Explain-back history stays. */
  skillId?: string;
  /** Hide the scroll arrows when the row has nothing to scroll. */
  scrollable?: boolean;
  onOpenRoadmap?: () => void;
}
export function SkillRow(props: SkillRowProps): React.JSX.Element;
