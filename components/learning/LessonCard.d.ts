import * as React from "react";

/**
 * Lesson / stage card for the segmented skill rows. Structure inherited from
 * the AniVerse `PosterCard` slot (160px wide, 18px radius) with the hover
 * expand-panel, rating chip, and genre-colour system removed.
 *
 * @startingPoint section="Learning" subtitle="Lesson card states" viewport="700x220"
 */
export interface LessonCardProps extends React.HTMLAttributes<HTMLElement> {
  title: React.ReactNode;
  skill?: React.ReactNode;
  /** Short factual meta, e.g. "12 min · video". */
  meta?: React.ReactNode;
  status?: "done" | "active" | "todo" | "locked";
  /** Mastery percentage; omit when the lesson has no verified mastery yet. */
  mastery?: number;
  kind?: "lesson" | "quiz" | "gate";
  thumbnail?: string;
  onOpen?: () => void;
}
export function LessonCard(props: LessonCardProps): React.JSX.Element;
