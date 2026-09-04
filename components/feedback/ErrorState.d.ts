import * as React from "react";

/**
 * Recoverable error panel. Intentional addition — AniVerse rendered errors as
 * a bare red paragraph; SkillFlow needs a consistent error state per screen.
 */
export interface ErrorStateProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  title?: React.ReactNode;
  description?: React.ReactNode;
  onRetry?: () => void;
  retryLabel?: React.ReactNode;
  /** Optional technical detail, rendered in mono at 11px. */
  detail?: React.ReactNode;
  compact?: boolean;
}
export function ErrorState(props: ErrorStateProps): React.JSX.Element;
