import * as React from "react";

/**
 * Sticky top bar. Same composition as AniVerse (title, search, bell, account)
 * with the theme toggle added and the gradient page title replaced by plain type.
 */
export interface TopbarProps extends React.HTMLAttributes<HTMLElement> {
  title: React.ReactNode;
  user?: { name: string; handle?: string; email?: string; avatarUrl?: string };
  theme?: "dark" | "light";
  onThemeChange?: (theme: "dark" | "light") => void;
  themeTarget?: HTMLElement | null;
  /** Unread count; rendered as a quiet dot, never a loud badge. */
  notifications?: number;
  onNotificationsClick?: () => void;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
}
export function Topbar(props: TopbarProps): React.JSX.Element;
