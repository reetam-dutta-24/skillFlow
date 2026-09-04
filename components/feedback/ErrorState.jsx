"use client";

import React from "react";
import { Icon } from "../core/Icon.jsx";

/** Recoverable-failure panel with a retry action. */
export function ErrorState({ title = "Something didn't load", description, onRetry, retryLabel = "Try again", detail, compact = false, style, ...rest }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        padding: compact ? "28px 24px" : "48px 32px",
        textAlign: "center",
        borderRadius: "var(--radius-card)",
        background: "var(--state-fail-bg)",
        border: "1px solid var(--state-fail)",
        ...style,
      }}
      {...rest}
    >
      <Icon name="circle-alert" size={20} color="var(--state-fail)" />
      <h3 style={{ margin: 0, fontSize: "var(--text-subtitle)", fontWeight: "var(--weight-semibold)", color: "var(--text-primary)" }}>{title}</h3>
      {description ? <p style={{ margin: 0, maxWidth: 400, fontSize: "var(--text-sm)", color: "var(--text-secondary)", textWrap: "pretty" }}>{description}</p> : null}
      {detail ? <code style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-2xs)", color: "var(--text-faint)" }}>{detail}</code> : null}
      {onRetry ? (
        <button type="button" onClick={onRetry} style={{ marginTop: 8, height: 40, padding: "0 20px", cursor: "pointer", borderRadius: "var(--radius-btn)", background: "transparent", border: "1px solid var(--border-strong)", color: "var(--text-primary)", fontFamily: "var(--font-sans)", fontSize: "var(--text-sm)", fontWeight: "var(--weight-semibold)" }}>{retryLabel}</button>
      ) : null}
    </div>
  );
}
