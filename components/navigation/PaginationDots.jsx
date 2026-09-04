"use client";

import React from "react";

/** Page dots for carousel rows; the active dot widens to a 20px capsule. */
export function PaginationDots({ total = 1, current = 0, onChange, style, ...rest }) {
  if (total <= 1) return null;
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, ...style }} {...rest}>
      {Array.from({ length: total }, (_, i) => (
        <button
          key={i}
          type="button"
          aria-label={"Go to page " + (i + 1)}
          aria-current={i === current ? "page" : undefined}
          onClick={() => onChange && onChange(i)}
          style={{
            width: i === current ? 20 : 8,
            height: 8,
            border: "none",
            padding: 0,
            cursor: "pointer",
            borderRadius: "var(--radius-full)",
            background: i === current ? "var(--accent)" : "var(--border-default)",
            transition: "width var(--dur-fast) var(--ease-in-out), background var(--dur-fast) var(--ease-in-out)",
          }}
        />
      ))}
    </div>
  );
}
