"use client";

import React from "react";

const SIZES = {
  sm: { height: 32, radius: "var(--radius-btn-sm)", padding: "0 14px", font: "var(--text-xs)" },
  md: { height: 40, radius: "var(--radius-btn)", padding: "0 20px", font: "var(--text-sm)" },
  lg: { height: 44, radius: "var(--radius-btn)", padding: "0 24px", font: "var(--text-sm)" },
  xl: { height: 52, radius: "var(--radius-btn)", padding: "0 28px", font: "var(--text-subtitle)" },
};

/** Primary action. `gradient` is the one gradient surface in the system. */
export function Button({
  variant = "outline",
  size = "md",
  full = false,
  pill = false,
  disabled = false,
  style,
  children,
  ...rest
}) {
  const s = SIZES[size] || SIZES.md;
  const [hover, setHover] = React.useState(false);
  const base = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    whiteSpace: "nowrap",
    height: s.height,
    padding: s.padding,
    borderRadius: pill ? "var(--radius-full)" : s.radius,
    fontFamily: "var(--font-sans)",
    fontSize: s.font,
    fontWeight: "var(--weight-semibold)",
    lineHeight: 1,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.5 : 1,
    width: full ? "100%" : undefined,
    transition: "background var(--dur-base) var(--ease-in-out), border-color var(--dur-base) var(--ease-in-out), color var(--dur-base) var(--ease-in-out)",
    border: "1px solid transparent",
  };
  const variants = {
    gradient: {
      backgroundImage: hover && !disabled ? "none" : "var(--gradient-brand)",
      background: hover && !disabled ? "transparent" : undefined,
      borderColor: hover && !disabled ? "var(--border-accent)" : "transparent",
      color: hover && !disabled ? "var(--text-accent)" : "var(--text-on-accent)",
    },
    outline: {
      background: hover && !disabled ? "var(--accent-quiet)" : "transparent",
      borderColor: "var(--border-accent)",
      color: "var(--text-primary)",
    },
    ghost: {
      background: hover && !disabled ? "var(--surface-hover)" : "transparent",
      borderColor: "transparent",
      color: hover && !disabled ? "var(--text-primary)" : "var(--text-secondary)",
    },
    quiet: {
      background: hover && !disabled ? "var(--surface-hover)" : "var(--surface-card)",
      borderColor: "var(--border-default)",
      color: "var(--text-primary)",
    },
  };
  return (
    <button
      type="button"
      disabled={disabled}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ ...base, ...(variants[variant] || variants.outline), ...style }}
      {...rest}
    >
      {children}
    </button>
  );
}
