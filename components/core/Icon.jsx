import React from "react";
import * as icons from "lucide-react";

/** kebab-case Lucide name -> the PascalCase export lucide-react ships, e.g. "circle-check" -> "CircleCheck". */
function toPascalCase(name) {
  return name
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
}

/** Lucide glyph wrapper, backed by the lucide-react package. */
export function Icon({ name, size = 16, strokeWidth = 2, color = "currentColor", style, ...rest }) {
  const Glyph = icons[toPascalCase(name)];
  if (!Glyph) return null;
  return (
    <Glyph
      aria-hidden="true"
      width={size}
      height={size}
      strokeWidth={strokeWidth}
      color={color}
      style={{ display: "inline-flex", flexShrink: 0, ...style }}
      {...rest}
    />
  );
}
