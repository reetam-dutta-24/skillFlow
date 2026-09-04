import * as React from "react";

/**
 * Donut chart — the AniVerse genre pie/donut, reused for per-skill mastery.
 * Pass `value` for a single-percentage ring with a centre readout, or
 * `slices` for a labelled multi-skill breakdown.
 */
export interface DonutSlice { label: string; value: number; color?: string }
export interface DonutChartProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
  slices?: DonutSlice[];
  label?: string;
  size?: number;
  thickness?: number;
}
export function DonutChart(props: DonutChartProps): React.JSX.Element;
