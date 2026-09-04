"use client";

import React from "react";
import { Icon } from "../core/Icon.jsx";

const ITEMS = [
  { label: "Progress", icon: "chart-line" },
  { label: "Settings", icon: "settings" },
  { label: "Sign out", icon: "log-out", danger: true },
];

/** Avatar + account dropdown. Opens up in the sidebar, down in the topbar. */
export function UserProfileMenu({ name, handle, email, avatarUrl, placement = "topbar", items = ITEMS, onSelect, style, ...rest }) {
  const [open, setOpen] = React.useState(false);
  const sidebar = placement === "sidebar";
  const initial = (name || "?").charAt(0).toUpperCase();
  return (
    <div style={{ position: "relative", width: sidebar ? "100%" : undefined, ...style }} {...rest}>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          width: sidebar ? "100%" : undefined,
          padding: sidebar ? "6px 6px" : "4px 6px",
          border: "none",
          cursor: "pointer",
          borderRadius: "var(--radius-panel)",
          background: open ? "var(--surface-hover)" : "transparent",
          transition: "background var(--dur-fast) var(--ease-in-out)",
        }}
      >
        {avatarUrl ? (
          <img src={avatarUrl} alt="" style={{ width: 32, height: 32, borderRadius: "var(--radius-full)", objectFit: "cover", flexShrink: 0 }} />
        ) : (
          <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 32, height: 32, flexShrink: 0, borderRadius: "var(--radius-full)", backgroundImage: "var(--gradient-brand)", color: "#fff", fontSize: "var(--text-sm)", fontWeight: "var(--weight-bold)" }}>{initial}</span>
        )}
        <span style={{ flex: sidebar ? 1 : undefined, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textAlign: "left", fontSize: "var(--text-sm)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)" }}>{name}</span>
        <Icon name="chevron-down" size={14} color="var(--text-faint)" />
      </button>
      {open ? (
        <div
          style={{
            position: "absolute",
            zIndex: 50,
            width: 240,
            overflow: "hidden",
            left: sidebar ? 0 : undefined,
            right: sidebar ? undefined : 0,
            bottom: sidebar ? "calc(100% + 8px)" : undefined,
            top: sidebar ? undefined : "calc(100% + 10px)",
            borderRadius: "var(--radius-panel)",
            background: "var(--bg-elevated)",
            border: "1px solid var(--border-default)",
            boxShadow: "var(--shadow-menu)",
            animation: "sf-fade-up var(--dur-fast) var(--ease-out-expo) both",
          }}
        >
          <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border-subtle)" }}>
            <p style={{ margin: 0, fontSize: "var(--text-sm)", fontWeight: "var(--weight-semibold)", color: "var(--text-primary)" }}>{name}</p>
            {handle ? <p style={{ margin: "1px 0 0", fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>@{handle}</p> : null}
            {email ? <p style={{ margin: "1px 0 0", fontSize: "var(--text-2xs)", color: "var(--text-faint)" }}>{email}</p> : null}
          </div>
          <ul style={{ listStyle: "none", margin: 0, padding: "6px 0" }}>
            {items.map((item) => (
              <li key={item.label}>
                <button
                  type="button"
                  onClick={() => { setOpen(false); onSelect && onSelect(item.label); }}
                  style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "10px 16px", border: "none", background: "transparent", cursor: "pointer", fontFamily: "var(--font-sans)", fontSize: "var(--text-sm)", color: item.danger ? "var(--state-fail)" : "var(--text-secondary)" }}
                >
                  <Icon name={item.icon} size={15} color={item.danger ? "var(--state-fail)" : "var(--accent)"} />
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
