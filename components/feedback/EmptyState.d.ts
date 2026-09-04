import * as React from "react";

/** Zero-data panel, carried over from the AniVerse `EmptyState` with the brand-gradient icon badge softened to an accent tint. */
export interface EmptyStateProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  /** Lucide icon name. */
  icon?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  compact?: boolean;
}
export function EmptyState(props: EmptyStateProps): React.JSX.Element;
