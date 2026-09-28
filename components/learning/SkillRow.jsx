"use client";

import React from "react";
import Link from "next/link";
import { Icon } from "../core/Icon.jsx";

const roadmapStyle = {
  background: "none",
  border: "none",
  padding: 0,
  cursor: "pointer",
  fontFamily: "var(--font-sans)",
  fontSize: "var(--text-xs)",
  fontWeight: "var(--weight-semibold)",
  color: "var(--text-secondary)",
  textDecoration: "none",
};

/** One horizontally scrollable row per skill — segmented, never blended. */
export function SkillRow({ title, subtitle, mastery, roadmapHref, scrollable = true, onOpenRoadmap, children, style, ...rest }) {
  const ref = React.useRef(null);
  function scroll(dir) {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollBy({ left: dir * 340, behavior: reduce ? "auto" : "smooth" });
  }
  return (
    <section style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%", minWidth: 0, ...style }} {...rest}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{ margin: 0, fontSize: "var(--text-subtitle)", fontWeight: "var(--weight-bold)", color: "var(--text-primary)" }}>{title}</h3>
          {subtitle ? <p style={{ margin: "2px 0 0", fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>{subtitle}</p> : null}
        </div>
        {mastery != null ? <span style={{ fontSize: "var(--text-xs)", color: "var(--text-accent)", fontWeight: "var(--weight-semibold)" }}>{mastery}% mastery</span> : null}
        {roadmapHref ? (
          <Link href={roadmapHref} style={roadmapStyle}>Roadmap</Link>
        ) : onOpenRoadmap ? (
          <button type="button" onClick={onOpenRoadmap} style={roadmapStyle}>Roadmap</button>
        ) : null}
        {scrollable ? (
          <div style={{ display: "flex", gap: 4 }}>
            {[-1, 1].map((d) => (
              <button key={d} type="button" aria-label={d < 0 ? "Scroll left" : "Scroll right"} onClick={() => scroll(d)} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, cursor: "pointer", borderRadius: "var(--radius-full)", background: "var(--surface-card)", border: "1px solid var(--border-default)", color: "var(--text-secondary)" }}>
                <Icon name={d < 0 ? "chevron-left" : "chevron-right"} size={15} />
              </button>
            ))}
          </div>
        ) : null}
      </div>
      <div ref={ref} style={{ display: "flex", gap: 16, width: "100%", minWidth: 0, overflowX: scrollable ? "auto" : "visible", paddingBottom: 4, scrollbarWidth: "none" }}>
        {children}
      </div>
    </section>
  );
}
