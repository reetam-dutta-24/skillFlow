import * as React from "react";

/** Preset dots plus a custom gradient. Sets `data-accent` and persists the choice. */
export interface AccentPickerProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Controlled preset id or `custom:#start:#end`. */
  accent?: string;
  /** Initial value when `accent` is omitted. A saved profile accent is fine. */
  defaultAccent?: string;
  onChange?: (accent: string) => void;
  /** Element that receives the data-accent attribute. */
  target?: HTMLElement | null;
}
export function AccentPicker(props: AccentPickerProps): React.JSX.Element;
