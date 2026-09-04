"use client";

import React from "react";
import { Icon } from "../core/Icon.jsx";
import { Chip } from "../core/Chip.jsx";
import { MasteryChip } from "../core/MasteryChip.jsx";

const STATUS = {
  done: { icon: "circle-check", color: "var(--state-pass)", label: "Completed" },
  active: { icon: "circle-play", color: "var(--accent)", label: "In progress" },
  todo: { icon: "circle", color: "var(--text-faint)", label: "Not started" },
  locked: { icon: "lock", color: "var(--state-lock)", label: "Locked" },
};

/** Carousel/grid card for a lesson or stage. 160px slot, per AniVerse. */
export function LessonCard({ title, skill, meta, status = "todo", mastery, kind = "lesson", thumbnail, onOpen, style, ...rest }) {
  const [hover, setHover] = React.useState(false);
  const s = STATUS[status] || STATUS.todo;
  const locked = status === "locked";
  return (
    <article
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={() => !locked && onOpen && onOpen()}
      style={{
        width: "var(--card-slot-w)",
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        cursor: locked ? "default" : "pointer",
        borderRadius: "var(--radius-tile)",
        background: "var(--surface-card)",
        border: "1px solid " + (hover && !locked ? "var(--border-accent)" : "var(--border-subtle)"),
        boxShadow: hover && !locked ? "var(--shadow-card-lift)" : "none",
        transform: hover && !locked ? "translateY(-2px)" : "none",
        transition: "transform var(--dur-base) var(--ease-out-expo), border-color var(--dur-base) var(--ease-in-out), box-shadow var(--dur-base) var(--ease-in-out)",
        ...style,
      }}
      {...rest}
    >
      <div style={{ position: "relative", height: 90, background: "var(--bg-sunken)", overflow: "hidden" }}>
        {thumbnail ? (
          <img src={thumbnail} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", filter: locked ? "var(--blur-lock)" : "none" }} />
        ) : (
          <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-faint)" }}>
            <Icon name={kind === "quiz" ? "list-checks" : kind === "gate" ? "message-square-quote" : "play"} size={20} color="var(--text-faint)" />
          </span>
        )}
        <span style={{ position: "absolute", top: 8, left: 8, display: "inline-flex", alignItems: "center", justifyContent: "center", width: 22, height: 22, borderRadius: "var(--radius-full)", background: "rgba(0,0,0,.55)" }}>
          <Icon name={s.icon} size={13} color={s.color} />
        </span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, padding: "10px 12px 12px" }}>
        <p style={{ margin: 0, fontSize: "var(--text-sm)", fontWeight: "var(--weight-semibold)", lineHeight: 1.3, color: "var(--text-primary)", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{title}</p>
        {skill ? <p style={{ margin: 0, fontSize: "var(--text-2xs)", color: "var(--text-faint)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{skill}</p> : null}
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          {mastery != null ? <MasteryChip percent={mastery} /> : null}
          {meta ? <Chip tone={locked ? "lock" : "neutral"}>{meta}</Chip> : null}
        </div>
      </div>
    </article>
  );
}
