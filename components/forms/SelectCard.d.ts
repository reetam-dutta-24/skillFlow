import * as React from "react";

/**
 * Selectable option tile for the onboarding card grid.
 * AniVerse used an emoji + label tile; SkillFlow uses a Lucide glyph, a
 * one-line description, and a disabled "coming soon" state.
 *
 * @startingPoint section="Forms" subtitle="Onboarding selection grid tile" viewport="700x220"
 */
export interface SelectCardProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: React.ReactNode;
  description?: React.ReactNode;
  /** Lucide icon name. */
  icon?: string;
  selected?: boolean;
  disabled?: boolean;
  onSelect?: () => void;
}
export function SelectCard(props: SelectCardProps): React.JSX.Element;
