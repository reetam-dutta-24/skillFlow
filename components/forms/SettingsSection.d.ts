import * as React from "react";

/** Glass panel wrapping a group of settings rows. */
export interface SettingsSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
}
export function SettingsSection(props: SettingsSectionProps): React.JSX.Element;
