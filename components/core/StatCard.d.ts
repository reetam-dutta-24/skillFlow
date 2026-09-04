import * as React from "react";

/**
 * Metric tile. AniVerse used a blue-violet gradient fill and vanity metrics;
 * SkillFlow uses a neutral surface and mastery metrics only
 * (streak, skills in progress, milestones passed, quizzes completed).
 *
 * @startingPoint section="Primitives" subtitle="Mastery metric tiles" viewport="700x150"
 */
export interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  label: React.ReactNode;
  value: React.ReactNode;
  unit?: React.ReactNode;
  hint?: React.ReactNode;
  icon?: React.ReactNode;
  /** Accent-tinted variant — at most one per row. */
  emphasis?: boolean;
}
export function StatCard(props: StatCardProps): React.JSX.Element;
