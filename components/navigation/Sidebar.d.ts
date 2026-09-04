import * as React from "react";

/**
 * Left navigation rail, inherited from the AniVerse dashboard shell
 * (168px desktop width, capsule nav items, 15% white active fill).
 * The item list is SkillFlow's, not AniVerse's.
 *
 * @startingPoint section="Navigation" subtitle="App navigation rail" viewport="700x400"
 */
export interface SidebarItem { id: string; label: string; icon: string }
export interface SidebarProps extends React.HTMLAttributes<HTMLElement> {
  items?: SidebarItem[];
  active?: string;
  onNavigate?: (id: string) => void;
  brand?: React.ReactNode;
  /** Bottom slot — normally `UserProfileMenu`. */
  footer?: React.ReactNode;
}
export function Sidebar(props: SidebarProps): React.JSX.Element;
export const SKILLFLOW_NAV: SidebarItem[];
