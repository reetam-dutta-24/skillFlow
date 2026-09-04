"use client";

import React from "react";
import { Icon } from "../core/Icon.jsx";

/** Outlined auth field with a leading icon and password reveal. */
export function AuthInput({ icon, type = "text", style, ...rest }) {
  const [focus, setFocus] = React.useState(false);
  const [visible, setVisible] = React.useState(false);
  const isPassword = type === "password";
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        height: 44,
        width: "100%",
        padding: "0 14px",
        borderRadius: "var(--radius-btn)",
        background: "var(--surface-card)",
        border: "1px solid " + (focus ? "var(--border-accent)" : "var(--border-default)"),
        transition: "border-color var(--dur-base) var(--ease-in-out)",
        ...style,
      }}
    >
      {icon ? <Icon name={icon} size={16} color="var(--text-faint)" /> : null}
      <input
        type={isPassword && !visible ? "password" : "text"}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        style={{ height: "100%", flex: 1, minWidth: 0, background: "transparent", border: "none", outline: "none", color: "var(--text-primary)", fontFamily: "var(--font-sans)", fontSize: "var(--text-body)" }}
        {...rest}
      />
      {isPassword ? (
        <button type="button" onClick={() => setVisible((v) => !v)} aria-label={visible ? "Hide password" : "Show password"} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", color: "var(--text-faint)", display: "inline-flex" }}>
          <Icon name={visible ? "eye-off" : "eye"} size={16} />
        </button>
      ) : null}
    </div>
  );
}
