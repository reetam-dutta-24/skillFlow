import React from "react";
import { Chip } from "./Chip.jsx";

/** Replaces the AniVerse "AI Match %" badge. */
export function MasteryChip({ percent, size = "sm", style, ...rest }) {
  return (
    <Chip tone="brand" size={size} style={style} {...rest}>
      Mastery {Math.round(percent)}%
    </Chip>
  );
}
