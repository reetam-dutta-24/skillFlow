import React from "react";
import { Icon } from "../core/Icon.jsx";

/** Centered zero-data panel. */
export function EmptyState({ icon = "inbox", title, description, action, compact = false, style, ...rest }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        padding: compact ? "32px 24px" : "56px 32px",
        textAlign: "center",
        borderRadius: "var(--radius-card)",
        background: "var(--surface-card)",
        border: "1px solid var(--border-subtle)",
        ...style,
      }}
      {...rest}
    >
      <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 44, height: 44, marginBottom: 4, borderRadius: "var(--radius-full)", background: "var(--accent-quiet)" }}>
        <Icon name={icon} size={20} color="var(--accent)" />
      </span>
      <h3 style={{ margin: 0, fontSize: "var(--text-subtitle)", fontWeight: "var(--weight-semibold)", color: "var(--text-primary)" }}>{title}</h3>
      {description ? <p style={{ margin: 0, maxWidth: 380, fontSize: "var(--text-sm)", color: "var(--text-muted)", textWrap: "pretty" }}>{description}</p> : null}
      {action ? <div style={{ marginTop: 10 }}>{action}</div> : null}
    </div>
  );
}
