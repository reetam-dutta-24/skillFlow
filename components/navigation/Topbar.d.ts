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
  /** Search is off unless a screen has a real search requirement. */
  showSearch?: boolean;
  /** Slot before the title, used for the mobile menu button. */
  leading?: React.ReactNode;
  /** Replaces the bell when the shell supplies its own menu. */
  notificationSlot?: React.ReactNode;
  /** Page content owns the h1. The shell title is then plain text. */
  titleAs?: "h1" | "p";
  menuItems?: { label: string; icon: string; danger?: boolean; href?: string }[];
  onMenuSelect?: (label: string) => void;
}
export function Topbar(props: TopbarProps): React.JSX.Element;
