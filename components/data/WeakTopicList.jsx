"use client";

import React from "react";
import { Icon } from "../core/Icon.jsx";
import { Chip } from "../core/Chip.jsx";

/** Concepts flagged by low quiz / explain-back performance. */
export function WeakTopicList({ topics = [], onReview, style, ...rest }) {
  return (
    <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 8, ...style }} {...rest}>
      {topics.map((t) => (
        <li key={t.id || t.topic} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: "var(--radius-panel)", background: "var(--surface-card)", border: "1px solid var(--border-subtle)" }}>
          <Icon name="triangle-alert" size={15} color={t.severity === "high" ? "var(--state-fail)" : "var(--state-warn)"} />
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: "block", fontSize: "var(--text-sm)", fontWeight: "var(--weight-semibold)", color: "var(--text-primary)" }}>{t.topic}</span>
            <span style={{ display: "block", fontSize: "var(--text-2xs)", color: "var(--text-muted)" }}>{t.skill}{t.detail ? " · " + t.detail : ""}</span>
          </span>
          <Chip tone={t.severity === "high" ? "fail" : "warn"}>{t.accuracy}% correct</Chip>
          {onReview ? (
            <button type="button" onClick={() => onReview(t)} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", fontFamily: "var(--font-sans)", fontSize: "var(--text-xs)", fontWeight: "var(--weight-semibold)", color: "var(--text-accent)" }}>Review</button>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
