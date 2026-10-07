"use client";

import React from "react";

/**
 * Page dots for carousel rows; the active dot widens to a 20px capsule.
 * Each dot sits in a 24px transparent button so it is still easy to hit.
 */
export function PaginationDots({ total = 1, current = 0, onChange, style, ...rest }) {
  if (total <= 1) return null;
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0, ...style }} {...rest}>
      {Array.from({ length: total }, (_, i) => (
        <button
          key={i}
          type="button"
          aria-label={"Go to page " + (i + 1)}
          aria-current={i === current ? "page" : undefined}
          onClick={() => onChange && onChange(i)}
          style={{
            display: "inline-grid",
            placeItems: "center",
            minWidth: 24,
            height: 24,
            border: "none",
            padding: "0 2px",
            cursor: "pointer",
            background: "transparent",
          }}
        >
          <span
            aria-hidden="true"
            style={{
              display: "block",
              width: i === current ? 20 : 8,
              height: 8,
              borderRadius: "var(--radius-full)",
              background: i === current ? "var(--accent)" : "var(--border-default)",
              transition: "width var(--dur-fast) var(--ease-in-out), background var(--dur-fast) var(--ease-in-out)",
            }}
          />
        </button>
      ))}
    </div>
  );
}
