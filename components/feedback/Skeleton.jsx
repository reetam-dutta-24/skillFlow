import React from "react";

/** Loading placeholder. Match the shape of what's arriving. */
export function Skeleton({ width = "100%", height = 14, radius = "var(--radius-btn-sm)", style, ...rest }) {
  return (
    <span
      aria-hidden="true"
      style={{
        display: "block",
        width,
        height,
        borderRadius: radius,
        backgroundColor: "var(--skeleton-base)",
        backgroundImage: "linear-gradient(90deg, transparent 0%, var(--skeleton-sheen) 50%, transparent 100%)",
        backgroundSize: "200% 100%",
        animation: "sf-sheen 1.4s var(--ease-in-out) infinite",
        ...style,
      }}
      {...rest}
    />
  );
}

/** Loading stand-in matching the LessonCard slot. */
export function SkeletonCard({ style, ...rest }) {
  return (
    <div style={{ width: "var(--card-slot-w)", flexShrink: 0, overflow: "hidden", borderRadius: "var(--radius-tile)", background: "var(--surface-card)", border: "1px solid var(--border-subtle)", ...style }} {...rest}>
      <Skeleton height={90} radius="0" />
      <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "12px" }}>
        <Skeleton height={12} />
        <Skeleton height={10} width="60%" />
        <Skeleton height={16} width="45%" radius="var(--radius-chip)" />
      </div>
    </div>
  );
}
