"use client";

import React from "react";
import { Icon } from "../core/Icon.jsx";

/** Onboarding card-grid option: selectable, or disabled as "coming soon". */
export function SelectCard({ label, description, icon, selected = false, disabled = false, onSelect, style, ...rest }) {
  const [hover, setHover] = React.useState(false);
  const border = disabled ? "var(--border-subtle)" : selected ? "var(--border-accent)" : hover ? "var(--border-strong)" : "var(--border-default)";
  return (
    <button
      type="button"
      aria-pressed={selected}
      disabled={disabled}
      onClick={() => !disabled && onSelect && onSelect()}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        gap: 8,
        padding: "18px 16px",
        textAlign: "left",
        cursor: disabled ? "not-allowed" : "pointer",
        borderRadius: "var(--radius-card)",
        background: selected ? "var(--surface-card-accent)" : "var(--surface-card)",
        border: "1px solid " + border,
        opacity: disabled ? 0.45 : 1,
        transition: "border-color var(--dur-base) var(--ease-in-out), background var(--dur-base) var(--ease-in-out)",
        ...style,
      }}
      {...rest}
    >
      {selected ? (
        <span style={{ position: "absolute", top: 12, right: 12, display: "inline-flex", alignItems: "center", justifyContent: "center", width: 20, height: 20, borderRadius: "var(--radius-full)", backgroundImage: "var(--gradient-brand)", color: "#fff" }}>
          <Icon name="check" size={12} strokeWidth={3} color="#fff" />
        </span>
      ) : null}
      {icon ? <Icon name={icon} size={22} color={selected ? "var(--text-accent)" : "var(--text-secondary)"} /> : null}
      <span style={{ fontSize: "var(--text-body)", fontWeight: "var(--weight-semibold)", color: "var(--text-primary)" }}>{label}</span>
      {description ? <span style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)", textWrap: "pretty" }}>{description}</span> : null}
      {disabled ? <span style={{ marginTop: 2, fontSize: "var(--text-2xs)", color: "var(--text-faint)" }}>Coming soon</span> : null}
    </button>
  );
}
