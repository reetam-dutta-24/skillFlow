import * as React from "react";

/** Section heading with optional subtitle and trailing action. */
export interface SectionHeaderProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  align?: "left" | "center";
  action?: React.ReactNode;
}
export function SectionHeader(props: SectionHeaderProps): React.JSX.Element;
