"use client";

import React from "react";
import { Icon } from "../core/Icon.jsx";
import { Chip } from "../core/Chip.jsx";

const STATUS = {
  done: { icon: "circle-check", color: "var(--state-pass)", chip: "pass", label: "Passed" },
  active: { icon: "circle-dot", color: "var(--accent)", chip: "accent", label: "In progress" },
  todo: { icon: "circle", color: "var(--text-faint)", chip: "neutral", label: "Available" },
  locked: { icon: "lock", color: "var(--state-lock)", chip: "lock", label: "Locked" },
};

/** One stage in a skill roadmap. Locked stages blur the preview and explain why. */
export function RoadmapStage({ index, title, description, status = "todo", mastery, meta, unlockHint, last = false, onOpen, style, ...rest }) {
  const [hover, setHover] = React.useState(false);
  const s = STATUS[status] || STATUS.todo;
  const locked = status === "locked";
  return (
    <li style={{ display: "flex", gap: 16, listStyle: "none", ...style }} {...rest}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0, paddingTop: 20 }}>
        <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 32, height: 32, borderRadius: "var(--radius-full)", background: status === "active" ? "var(--accent-quiet)" : "var(--surface-card)", border: "1px solid " + (status === "active" ? "var(--border-accent)" : "var(--border-subtle)") }}>
          <Icon name={s.icon} size={16} color={s.color} />
        </span>
        {!last ? <span style={{ flex: 1, width: 1, minHeight: 24, marginTop: 6, background: status === "done" ? "var(--state-pass)" : "var(--border-default)", opacity: status === "done" ? 0.5 : 1 }} /> : null}
      </div>
      <div
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onClick={() => !locked && onOpen && onOpen()}
        style={{
          position: "relative",
          flex: 1,
          minWidth: 0,
          marginBottom: 16,
          padding: "18px 20px",
          overflow: "hidden",
          cursor: locked ? "default" : "pointer",
          borderRadius: "var(--radius-card)",
          background: locked ? "var(--surface-lock)" : "var(--surface-card)",
          border: "1px solid " + (!locked && hover ? "var(--border-accent)" : "var(--border-subtle)"),
          transition: "border-color var(--dur-base) var(--ease-in-out)",
        }}
      >
        <div style={{ filter: locked ? "var(--blur-lock)" : "none", opacity: locked ? 0.5 : 1, userSelect: locked ? "none" : "auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <span style={{ fontSize: "var(--text-2xs)", fontWeight: "var(--weight-semibold)", letterSpacing: "var(--tracking-wide)", textTransform: "uppercase", color: "var(--text-faint)" }}>Stage {index}</span>
            {mastery != null && !locked ? <Chip tone="accent">{mastery}% mastery</Chip> : null}
            {!locked ? <Chip tone={s.chip}>{s.label}</Chip> : null}
          </div>
          <h3 style={{ margin: 0, fontSize: "var(--text-subtitle)", fontWeight: "var(--weight-semibold)", color: "var(--text-primary)" }}>{title}</h3>
          {description ? <p style={{ margin: "5px 0 0", fontSize: "var(--text-sm)", color: "var(--text-muted)", textWrap: "pretty" }}>{description}</p> : null}
          {meta ? <p style={{ margin: "8px 0 0", fontSize: "var(--text-2xs)", color: "var(--text-faint)" }}>{meta}</p> : null}
        </div>
        {locked ? (
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, padding: 20, textAlign: "center" }}>
            <Icon name="lock" size={18} color="var(--state-lock)" />
            <p style={{ margin: 0, maxWidth: 380, fontSize: "var(--text-xs)", color: "var(--text-secondary)", textWrap: "pretty" }}>{unlockHint}</p>
          </div>
        ) : null}
      </div>
    </li>
  );
}
