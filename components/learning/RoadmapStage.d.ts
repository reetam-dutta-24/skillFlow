import * as React from "react";

/**
 * One stage on a path. A photo, the stage number on the rail, and its state in words and color.
 * The current stage gets an accent edge and a "Start stage" cue. Locked stages stay readable and
 * say what opens them.
 *
 * @startingPoint section="Learning" subtitle="Roadmap stage, unlocked and locked" viewport="700x330"
 */
export interface RoadmapStageProps extends Omit<React.LiHTMLAttributes<HTMLLIElement>, "title"> {
  index: number;
  title: React.ReactNode;
  /** Stage photo, 16:9. A designed placeholder is shown when it is missing. */
  image?: string;
  description?: React.ReactNode;
  status?: "done" | "active" | "todo" | "locked";
  /** The learner's next stage. Only one per path. */
  current?: boolean;
  mastery?: number;
  /** Factual meta line, e.g. "3 lessons · explain-back". */
  meta?: React.ReactNode;
  /** Shown when locked, e.g. "Pass DAW Basics and Signal Flow to open this stage." */
  unlockHint?: React.ReactNode;
  /** Overrides the cue on an open card ("Start stage", "Review stage", "Open stage"). */
  ctaLabel?: React.ReactNode;
  /** Hides the connector line on the last stage. */
  last?: boolean;
  /** Opens the stage. Locked stages ignore this. */
  href?: string;
}
export function RoadmapStage(props: RoadmapStageProps): React.JSX.Element;
