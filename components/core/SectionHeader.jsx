import React from "react";

/** Section heading block — title over a muted subtitle. */
export function SectionHeader({ title, subtitle, align = "left", action, titleId, titleSize, subtitleSize, style, ...rest }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, ...style }} {...rest}>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: align === "center" ? "center" : "flex-start", textAlign: align === "center" ? "center" : "left", flex: 1, minWidth: 0 }}>
        <h2 id={titleId} style={{ margin: 0, fontSize: titleSize || "var(--text-heading)", lineHeight: "var(--text-heading-lh)", fontWeight: "var(--weight-bold)", color: "var(--text-primary)", letterSpacing: "var(--tracking-tight)" }}>{title}</h2>
        {subtitle ? <p style={{ margin: 0, fontSize: subtitleSize || "var(--text-sm)", lineHeight: "var(--text-subtitle-lh)", color: "var(--text-muted)" }}>{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
}
