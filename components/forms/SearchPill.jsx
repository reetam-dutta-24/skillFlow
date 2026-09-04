"use client";

import React from "react";
import { Icon } from "../core/Icon.jsx";

/** Slim capsule search input used in the topbar and section headers. */
export function SearchPill({ placeholder = "Search skills, stages, lessons", value, onChange, style, ...rest }) {
  const [focus, setFocus] = React.useState(false);
  return (
    <label
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        height: 40,
        width: "100%",
        minWidth: 0,
        padding: "0 14px",
        borderRadius: "var(--radius-full)",
        background: "var(--surface-card)",
        border: "1px solid " + (focus ? "var(--border-accent)" : "var(--border-default)"),
        transition: "border-color var(--dur-base) var(--ease-in-out)",
        ...style,
      }}
    >
      <Icon name="search" size={15} color="var(--text-faint)" />
      <input
        type="search"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange && onChange(e.target.value)}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        style={{ flex: 1, minWidth: 0, background: "transparent", border: "none", outline: "none", color: "var(--text-primary)", fontFamily: "var(--font-sans)", fontSize: "var(--text-sm)" }}
        {...rest}
      />
    </label>
  );
}
