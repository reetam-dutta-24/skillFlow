import * as React from "react";

/** Capsule search field. AniVerse outlined it in brand magenta; here the border is neutral until focus. */
export interface SearchPillProps {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  style?: React.CSSProperties;
}
export function SearchPill(props: SearchPillProps): React.JSX.Element;
