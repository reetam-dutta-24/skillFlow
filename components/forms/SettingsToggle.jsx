"use client";

import React from "react";

/** Boolean setting row with a capsule switch. */
export function SettingsToggle({ label, description, checked = false, onChange, style, ...rest }) {
  return (
    <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, padding: "6px 0", cursor: "pointer", ...style }} {...rest}>
      <span style={{ minWidth: 0 }}>
        <span style={{ display: "block", fontSize: "var(--text-body)", fontWeight: "var(--weight-semibold)", color: "var(--text-primary)" }}>{label}</span>
        {description ? <span style={{ display: "block", marginTop: 2, fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>{description}</span> : null}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange && onChange(!checked)}
        style={{
          position: "relative",
          height: 24,
          width: 44,
          flexShrink: 0,
          border: "none",
          padding: 0,
          cursor: "pointer",
          borderRadius: "var(--radius-full)",
          backgroundImage: checked ? "var(--gradient-brand)" : "none",
          background: checked ? undefined : "var(--surface-active)",
          transition: "background var(--dur-base) var(--ease-in-out)",
        }}
      >
        <span style={{ position: "absolute", top: 2, left: checked ? 22 : 2, width: 20, height: 20, borderRadius: "var(--radius-full)", background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,.3)", transition: "left var(--dur-base) var(--ease-out-expo)" }} />
      </button>
    </label>
  );
}
