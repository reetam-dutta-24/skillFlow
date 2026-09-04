import * as React from "react";

/**
 * Lesson screen. Reuses the AniVerse content-detail pattern (title block with
 * meta chips over a docked player) with the ratings, watchlist, engagement
 * panel, and review section removed, and an explicit external-resource link
 * added below the clip.
 *
 * @startingPoint section="Learning" subtitle="Lesson player with external resource" viewport="860x620"
 */
export interface LessonResource { title: string; url: string; source: string; length?: string }
export interface LessonPlayerProps extends React.HTMLAttributes<HTMLElement> {
  title: React.ReactNode;
  skill?: React.ReactNode;
  stage?: React.ReactNode;
  duration?: React.ReactNode;
  watched?: boolean;
  /** The linked full resource — always labelled as external. */
  resource?: LessonResource;
  onToggleWatched?: () => void;
  onContinue?: () => void;
  poster?: string;
}
export function LessonPlayer(props: LessonPlayerProps): React.JSX.Element;
