"use client";

import React from "react";
import { Icon } from "../core/Icon.jsx";
import { Chip } from "../core/Chip.jsx";

/** Lesson screen: hook clip on top, external full resource below, then actions. */
export function LessonPlayer({ title, skill, stage, duration, watched = false, resource, onToggleWatched, onContinue, poster, style, ...rest }) {
  return (
    <section style={{ display: "flex", flexDirection: "column", gap: 20, width: "100%", maxWidth: 820, ...style }} {...rest}>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <span style={{ fontSize: "var(--text-2xs)", fontWeight: "var(--weight-semibold)", letterSpacing: "var(--tracking-wide)", textTransform: "uppercase", color: "var(--text-faint)" }}>{skill}{stage ? " · " + stage : ""}</span>
        <h1 style={{ margin: 0, fontSize: "var(--text-title)", lineHeight: "var(--text-title-lh)", fontWeight: "var(--weight-bold)", letterSpacing: "var(--tracking-tight)", color: "var(--text-primary)" }}>{title}</h1>
        <div style={{ display: "flex", gap: 8, marginTop: 2 }}>
          {duration ? <Chip tone="neutral">{duration}</Chip> : null}
          <Chip tone={watched ? "pass" : "neutral"}>{watched ? "Watched" : "Hook clip"}</Chip>
        </div>
      </div>

      <div style={{ position: "relative", aspectRatio: "16 / 9", overflow: "hidden", borderRadius: "var(--radius-card)", background: "var(--bg-sunken)", border: "1px solid var(--border-subtle)" }}>
        {poster ? <img src={poster} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.6 }} /> : null}
        <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 60, height: 60, borderRadius: "var(--radius-full)", backgroundImage: "var(--gradient-brand)" }}>
            <Icon name="play" size={22} color="#fff" />
          </span>
        </span>
      </div>

      {resource ? (
        <a href={resource.url} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 18px", textDecoration: "none", borderRadius: "var(--radius-panel)", background: "var(--surface-card)", border: "1px solid var(--border-default)" }}>
          <Icon name="external-link" size={17} color="var(--accent)" />
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: "block", fontSize: "var(--text-body)", fontWeight: "var(--weight-semibold)", color: "var(--text-primary)" }}>{resource.title}</span>
            <span style={{ display: "block", marginTop: 2, fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>External · {resource.source}{resource.length ? " · " + resource.length : ""}</span>
          </span>
          <Icon name="arrow-up-right" size={16} color="var(--text-faint)" />
        </a>
      ) : null}

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <button type="button" onClick={onToggleWatched} style={{ display: "inline-flex", alignItems: "center", gap: 7, height: 44, padding: "0 20px", cursor: "pointer", borderRadius: "var(--radius-btn)", background: "transparent", border: "1px solid " + (watched ? "var(--state-pass)" : "var(--border-strong)"), color: watched ? "var(--state-pass)" : "var(--text-primary)", fontFamily: "var(--font-sans)", fontSize: "var(--text-sm)", fontWeight: "var(--weight-semibold)" }}>
          <Icon name={watched ? "circle-check" : "circle"} size={15} color={watched ? "var(--state-pass)" : "var(--text-muted)"} />
          {watched ? "Marked as watched" : "Mark as watched"}
        </button>
        <button type="button" onClick={onContinue} style={{ display: "inline-flex", alignItems: "center", gap: 7, height: 44, padding: "0 24px", border: "none", cursor: "pointer", borderRadius: "var(--radius-btn)", backgroundImage: "var(--gradient-brand)", color: "#fff", fontFamily: "var(--font-sans)", fontSize: "var(--text-sm)", fontWeight: "var(--weight-semibold)" }}>
          Continue to quiz
          <Icon name="arrow-right" size={15} color="#fff" />
        </button>
      </div>
    </section>
  );
}
