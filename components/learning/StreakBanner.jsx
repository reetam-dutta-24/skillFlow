"use client";

import React from "react";
import Link from "next/link";
import { Icon } from "../core/Icon.jsx";

const continueStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  height: 40,
  padding: "0 20px",
  flexShrink: 0,
  border: "none",
  cursor: "pointer",
  borderRadius: "var(--radius-btn)",
  backgroundImage: "var(--gradient-brand)",
  color: "var(--text-on-accent)",
  fontFamily: "var(--font-sans)",
  fontSize: "var(--text-sm)",
  fontWeight: "var(--weight-semibold)",
  textDecoration: "none",
};

/** Home banner. AniVerse ran a gradient greeting with emoji FOMO lines;
 *  SkillFlow states the streak and the single next action. */
export function StreakBanner({ streak = 0, nextLabel, nextSkill, continueHref, onContinue, style, ...rest }) {
  return (
    <section
      style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: "16px 24px",
        padding: "20px 24px",
        borderRadius: "var(--radius-card)",
        background: "var(--surface-card-accent)",
        border: "1px solid var(--border-subtle)",
        ...style,
      }}
      {...rest}
    >
      <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 52, height: 52, flexShrink: 0, borderRadius: "var(--radius-full)", backgroundImage: "var(--gradient-brand)" }}>
        <Icon name="flame" size={24} color="var(--text-on-accent)" />
      </span>
      {/* At least 200px for the text, so on a phone the button wraps below instead of squeezing it. */}
      <div style={{ flex: "1 1 200px", minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: "var(--text-heading)", lineHeight: "var(--text-heading-lh)", fontWeight: "var(--weight-bold)", color: "var(--text-primary)" }}>
          {streak} day{streak === 1 ? "" : "s"} in a row
        </p>
        {nextLabel ? (
          <p style={{ margin: "3px 0 0", fontSize: "var(--text-sm)", color: "var(--text-muted)" }}>
            Next up: <span style={{ color: "var(--text-secondary)", fontWeight: "var(--weight-medium)" }}>{nextLabel}</span>{nextSkill ? " · " + nextSkill : ""}
          </p>
        ) : null}
      </div>
      {continueHref ? (
        <Link href={continueHref} style={continueStyle}>
          Continue
          <Icon name="arrow-right" size={15} color="var(--text-on-accent)" />
        </Link>
      ) : onContinue ? (
        <button type="button" onClick={onContinue} style={continueStyle}>
          Continue
          <Icon name="arrow-right" size={15} color="var(--text-on-accent)" />
        </button>
      ) : null}
    </section>
  );
}
