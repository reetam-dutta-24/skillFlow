import * as React from "react";

/**
 * Multi-series line chart — the AniVerse analytics line chart, reused for
 * mastery growth over time. Cyan/blue series ramp, dashed grid, no fills.
 */
export interface LineSeries { key: string; label?: string; color?: string }
export interface LineChartProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Rows shaped `{ label: "Apr", <seriesKey>: number }`. */
  data?: Array<Record<string, string | number>>;
  series?: LineSeries[];
  height?: number;
  yMax?: number;
}
export function LineChart(props: LineChartProps): React.JSX.Element;
