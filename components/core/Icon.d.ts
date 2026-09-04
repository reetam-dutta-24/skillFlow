import * as React from "react";

/**
 * Lucide icon, backed by the `lucide-react` package.
 */
export interface IconProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** kebab-case Lucide name, e.g. "flame", "lock", "circle-check". */
  name: string;
  size?: number;
  strokeWidth?: number;
  color?: string;
}
export function Icon(props: IconProps): React.JSX.Element;
