import * as React from "react";

/** Glass panel with a heading, wrapping a chart. Carried over from AniVerse analytics. */
export interface ChartPanelProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
}
export function ChartPanel(props: ChartPanelProps): React.JSX.Element;
