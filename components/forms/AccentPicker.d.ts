import * as React from "react";

/** Curated accent gradient picker. Sets `data-accent` and persists the choice. */
export interface AccentPickerProps extends React.HTMLAttributes<HTMLDivElement> {
  accent?: "tide" | "iris" | "grove" | "ember" | "dusk" | "bloom" | "pulse" | "volt" | "ion" | "nova";
  /** Initial preset when `accent` is omitted. Server layouts pass the stored value. */
  defaultAccent?: "tide" | "iris" | "grove" | "ember" | "dusk" | "bloom" | "pulse" | "volt" | "ion" | "nova";
  onChange?: (accent: "tide" | "iris" | "grove" | "ember" | "dusk" | "bloom" | "pulse" | "volt" | "ion" | "nova") => void;
  /** Element that receives the data-accent attribute. */
  target?: HTMLElement | null;
}
export function AccentPicker(props: AccentPickerProps): React.JSX.Element;
