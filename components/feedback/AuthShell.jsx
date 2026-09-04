import React from "react";

/** Split-screen auth layout: quiet left panel, centered card on the right. */
export function AuthShell({ headline, sub, brand = "SkillFlow", children, style, ...rest }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", minHeight: "100%", width: "100%", ...style }} {...rest}>
      <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", padding: 48, background: "var(--bg-sunken)" }}>
        <div aria-hidden="true" style={{ position: "absolute", inset: 0, opacity: 0.5, backgroundImage: "radial-gradient(ellipse 80% 60% at 20% 20%, rgba(34,211,238,.16) 0%, transparent 60%), radial-gradient(ellipse 70% 70% at 85% 80%, rgba(37,99,235,.16) 0%, transparent 62%)", filter: "blur(2px)" }} />
        <div style={{ position: "relative", maxWidth: 400, textAlign: "left" }}>
          <p style={{ margin: 0, fontSize: "var(--text-subtitle)", fontWeight: "var(--weight-bold)", letterSpacing: "var(--tracking-tight)", color: "var(--text-primary)" }}>{brand}</p>
          <h1 style={{ margin: "20px 0 0", fontSize: "var(--text-title)", lineHeight: "var(--text-title-lh)", fontWeight: "var(--weight-bold)", letterSpacing: "var(--tracking-tight)", color: "var(--text-primary)", textWrap: "pretty" }}>{headline}</h1>
          {sub ? <p style={{ margin: "12px 0 0", fontSize: "var(--text-subtitle)", lineHeight: "var(--text-subtitle-lh)", color: "var(--text-muted)", textWrap: "pretty" }}>{sub}</p> : null}
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 24px", background: "var(--bg-app)" }}>
        <div style={{ width: "100%", maxWidth: 400, padding: "36px 28px", borderRadius: "var(--radius-card)", background: "var(--surface-card)", border: "1px solid var(--border-subtle)", boxShadow: "var(--shadow-panel)" }}>
          {children}
        </div>
      </div>
    </div>
  );
}
