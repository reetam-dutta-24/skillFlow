import * as React from "react";

/** Toggle row for a boolean setting. */
export interface SettingsToggleProps {
  label: React.ReactNode;
  description?: React.ReactNode;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  style?: React.CSSProperties;
}
export function SettingsToggle(props: SettingsToggleProps): React.JSX.Element;
