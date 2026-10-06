"use client";

import React from "react";
import Link from "next/link";
import { Icon } from "../core/Icon.jsx";
import { Chip } from "../core/Chip.jsx";
import { SkillImage } from "../core/SkillImage";

const STATUS = {
  done: { icon: "circle-check", color: "var(--state-pass)", chip: "pass", label: "Passed" },
  active: { icon: "circle-dot", color: "var(--accent)", chip: "accent", label: "In progress" },
  todo: { icon: "circle", color: "var(--text-faint)", chip: "neutral", label: "Available" },
  locked: { icon: "lock", color: "var(--state-lock)", chip: "lock", label: "Locked" },
};

/** One stage in a skill roadmap. A locked stage shows a lock. Only the last two stages on a path are blurred. */
export function RoadmapStage({ index, title, image, description, status = "todo", mastery, meta, unlockHint, conceal = false, last = false, href, onOpen, style, ...rest }) {
  const [hover, setHover] = React.useState(false);
  const s = STATUS[status] || STATUS.todo;
  const locked = status === "locked";
  const veiled = locked && conceal;
  const open = Boolean(href) && !locked;
  const panelStyle = {
    position: "relative",
    flex: 1,
    minWidth: 0,
    marginBottom: 10,
    padding: "12px 14px",
    overflow: "hidden",
    cursor: locked || (!open && !onOpen) ? "default" : "pointer",
    borderRadius: "var(--radius-card)",
    background: veiled ? "var(--surface-lock)" : "var(--surface-card)",
    border: "1px solid " + (!locked && hover ? "var(--border-accent)" : "var(--border-subtle)"),
    transition: "border-color var(--dur-base) var(--ease-in-out)",
    textDecoration: "none",
    color: "inherit",
  };
  const panel = (
    <>
      <div className="sf-stage-body" style={{ filter: veiled ? "var(--blur-lock)" : "none", opacity: veiled ? 0.5 : 1, userSelect: veiled ? "none" : "auto" }}>
        <div className="sf-stage-copy">
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
            <span style={{ fontSize: "var(--text-2xs)", fontWeight: "var(--weight-semibold)", letterSpacing: "var(--tracking-wide)", textTransform: "uppercase", color: "var(--text-faint)" }}>Stage {index}</span>
            {mastery != null && !locked ? <Chip tone="accent">{mastery}% mastery</Chip> : null}
            {!veiled ? <Chip tone={s.chip}>{s.label}</Chip> : null}
          </div>
          <h3 style={{ margin: 0, fontSize: "var(--text-sm)", fontWeight: "var(--weight-semibold)", color: "var(--text-primary)" }}>{title}</h3>
          {description ? <p className="sf-stage-desc">{description}</p> : null}
          {locked && !veiled && unlockHint ? <p className="sf-stage-meta">{unlockHint}</p> : null}
          {meta ? <p className="sf-stage-meta">{meta}</p> : null}
        </div>
        {image ? (
          <span className="sf-stage-photo-wrap">
            <SkillImage className="sf-stage-photo" src={image} alt="" fill sizes="148px" />
          </span>
        ) : null}
      </div>
      {veiled ? (
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, padding: 20, textAlign: "center" }}>
          <Icon name="lock" size={18} color="var(--state-lock)" />
          <p style={{ margin: 0, maxWidth: 380, fontSize: "var(--text-xs)", color: "var(--text-secondary)", textWrap: "pretty" }}>{unlockHint}</p>
        </div>
      ) : null}
    </>
  );
  return (
    <li style={{ display: "flex", gap: 16, listStyle: "none", ...style }} {...rest}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0, paddingTop: 14 }}>
        <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 32, height: 32, borderRadius: "var(--radius-full)", background: status === "active" ? "var(--accent-quiet)" : "var(--surface-card)", border: "1px solid " + (status === "active" ? "var(--border-accent)" : "var(--border-subtle)") }}>
          <Icon name={s.icon} size={16} color={s.color} />
        </span>
        {!last ? <span style={{ flex: 1, width: 1, minHeight: 24, marginTop: 6, background: status === "done" ? "var(--state-pass)" : "var(--border-default)", opacity: status === "done" ? 0.5 : 1 }} /> : null}
      </div>
      {open ? (
        <Link href={href} className="sf-roadmap-open" style={panelStyle} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
          {panel}
        </Link>
      ) : (
        <div style={panelStyle} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} onClick={() => !locked && onOpen && onOpen()}>
          {panel}
        </div>
      )}
    </li>
  );
}
