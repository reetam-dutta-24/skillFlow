import * as React from "react";

/**
 * Loading placeholders. Intentional addition — AniVerse used Suspense
 * fallbacks with ad-hoc divs; SkillFlow standardises the shimmer.
 */
export interface SkeletonProps extends React.HTMLAttributes<HTMLSpanElement> {
  width?: number | string;
  height?: number | string;
  radius?: string;
}
export function Skeleton(props: SkeletonProps): React.JSX.Element;

/** Card-shaped skeleton matching the 160px LessonCard slot. */
export function SkeletonCard(props: React.HTMLAttributes<HTMLDivElement>): React.JSX.Element;
