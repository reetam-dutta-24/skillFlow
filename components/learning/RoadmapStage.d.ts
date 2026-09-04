import * as React from "react";

/**
 * One stage in the vertical roadmap for a single skill. New in SkillFlow.
 * Unlocked stages show the full preview and are tappable; locked stages blur
 * the preview behind a lock and state exactly what unlocks them.
 *
 * @startingPoint section="Learning" subtitle="Roadmap stage, unlocked and locked" viewport="700x330"
 */
export interface RoadmapStageProps extends React.LiHTMLAttributes<HTMLLIElement> {
  index: number;
  title: React.ReactNode;
  description?: React.ReactNode;
  status?: "done" | "active" | "todo" | "locked";
  mastery?: number;
  /** Factual meta line, e.g. "3 lessons · 1 quiz · explain-back gate". */
  meta?: React.ReactNode;
  /** Required when locked, e.g. "Complete the explain-back check on Hooks & State to unlock." */
  unlockHint?: React.ReactNode;
  /** Hides the connector line on the last stage. */
  last?: boolean;
  onOpen?: () => void;
}
export function RoadmapStage(props: RoadmapStageProps): React.JSX.Element;
