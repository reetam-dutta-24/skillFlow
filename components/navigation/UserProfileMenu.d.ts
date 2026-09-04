import * as React from "react";

/** Account avatar and dropdown, carried over from the AniVerse shell. */
export interface UserProfileMenuItem { label: string; icon: string; danger?: boolean }
export interface UserProfileMenuProps extends React.HTMLAttributes<HTMLDivElement> {
  name: string;
  handle?: string;
  email?: string;
  avatarUrl?: string;
  /** `sidebar` opens upward from the bottom rail. */
  placement?: "topbar" | "sidebar";
  items?: UserProfileMenuItem[];
  onSelect?: (label: string) => void;
}
export function UserProfileMenu(props: UserProfileMenuProps): React.JSX.Element;
