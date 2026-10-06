import * as React from "react";

/**
 * One stage in the vertical roadmap for a single skill. New in SkillFlow.
 * Unlocked stages show the full preview and are tappable. Locked stages stay
 * readable behind a lock sign. The last two stages of a path set `conceal`
 * and blur that preview.
 *
 * @startingPoint section="Learning" subtitle="Roadmap stage, unlocked and locked" viewport="700x330"
 */
export interface RoadmapStageProps extends React.LiHTMLAttributes<HTMLLIElement> {
  index: number;
  title: React.ReactNode;
  /** Stage photo. Shown above the title. */
  image?: string;
  description?: React.ReactNode;
  status?: "done" | "active" | "todo" | "locked";
  mastery?: number;
  /** Factual meta line, e.g. "3 lessons · explain-back". */
  meta?: React.ReactNode;
  /** Required when locked, e.g. "Pass DAW Basics and Signal Flow to open this stage." */
  unlockHint?: React.ReactNode;
  /** Blur this locked stage. Used for the last two stages on a path. */
  conceal?: boolean;
  /** Hides the connector line on the last stage. */
  last?: boolean;
  /** Opens the stage. Locked stages ignore this and stay plain text. */
  href?: string;
  onOpen?: () => void;
}
export function RoadmapStage(props: RoadmapStageProps): React.JSX.Element;
