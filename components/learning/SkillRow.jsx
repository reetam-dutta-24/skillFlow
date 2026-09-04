"use client";

import React from "react";
import { Icon } from "../core/Icon.jsx";

/** One horizontally scrollable row per skill — segmented, never blended. */
export function SkillRow({ title, subtitle, mastery, onOpenRoadmap, children, style, ...rest }) {
  const ref = React.useRef(null);
  function scroll(dir) {
    const el = ref.current;
    if (el) el.scrollBy({ left: dir * 340, behavior: "smooth" });
  }
  return (
    <section style={{ display: "flex", flexDirection: "column", gap: 12, ...style }} {...rest}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{ margin: 0, fontSize: "var(--text-subtitle)", fontWeight: "var(--weight-bold)", color: "var(--text-primary)" }}>{title}</h3>
          {subtitle ? <p style={{ margin: "2px 0 0", fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>{subtitle}</p> : null}
        </div>
        {mastery != null ? <span style={{ fontSize: "var(--text-xs)", color: "var(--text-accent)", fontWeight: "var(--weight-semibold)" }}>{mastery}% mastery</span> : null}
        {onOpenRoadmap ? (
          <button type="button" onClick={onOpenRoadmap} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", fontFamily: "var(--font-sans)", fontSize: "var(--text-xs)", fontWeight: "var(--weight-semibold)", color: "var(--text-secondary)" }}>Roadmap</button>
        ) : null}
        <div style={{ display: "flex", gap: 4 }}>
          {[-1, 1].map((d) => (
            <button key={d} type="button" aria-label={d < 0 ? "Scroll left" : "Scroll right"} onClick={() => scroll(d)} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, cursor: "pointer", borderRadius: "var(--radius-full)", background: "var(--surface-card)", border: "1px solid var(--border-default)", color: "var(--text-secondary)" }}>
              <Icon name={d < 0 ? "chevron-left" : "chevron-right"} size={15} />
            </button>
          ))}
        </div>
      </div>
      <div ref={ref} style={{ display: "flex", gap: 16, overflowX: "auto", paddingBottom: 4, scrollbarWidth: "none" }}>
        {children}
      </div>
    </section>
  );
}
