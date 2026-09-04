import React from "react";

/** Section heading block — title over a muted subtitle. */
export function SectionHeader({ title, subtitle, align = "left", action, style, ...rest }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, ...style }} {...rest}>
      <div style={{ display: "flex", flexDirection: "column", gap: 3, alignItems: align === "center" ? "center" : "flex-start", textAlign: align === "center" ? "center" : "left", flex: 1, minWidth: 0 }}>
        <h2 style={{ margin: 0, fontSize: "var(--text-heading)", lineHeight: "var(--text-heading-lh)", fontWeight: "var(--weight-bold)", color: "var(--text-primary)", letterSpacing: "var(--tracking-tight)" }}>{title}</h2>
        {subtitle ? <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--text-muted)" }}>{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
}
