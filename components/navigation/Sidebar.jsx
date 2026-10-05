"use client";

import React from "react";
import Link from "next/link";
import { Icon } from "../core/Icon.jsx";

export const SKILLFLOW_NAV = [
  { id: "home", label: "Home", icon: "house", href: "/dashboard" },
  { id: "niches", label: "Niches", icon: "library", href: "/skills" },
  { id: "clips", label: "Clips", icon: "clapperboard", href: "/clips" },
  { id: "creator", label: "Creator studio", icon: "video", href: "/creator" },
  { id: "roadmaps", label: "Roadmaps", icon: "route", href: "/roadmap" },
  { id: "nearby", label: "Nearby", icon: "map-pin", href: "/nearby" },
  { id: "open-source", label: "Open Source", icon: "git-pull-request", href: "/open-source" },
  { id: "progress", label: "Progress", icon: "chart-line", href: "/progress" },
  { id: "analytics", label: "Analytics", icon: "chart-pie", href: "/analytics" },
  { id: "submit", label: "Submit a resource", icon: "file-plus", href: "/submit" },
  { id: "settings", label: "Settings", icon: "settings", href: "/settings" },
];

/** Fixed left rail — 168px on desktop, drawer on mobile. */
export function Sidebar({ items = SKILLFLOW_NAV, active = "home", onNavigate, brand = "SkillFlow", footer, navLabel = "Main", style, ...rest }) {
  return (
    <aside
      style={{
        display: "flex",
        flexDirection: "column",
        width: "var(--sidebar-w)",
        flexShrink: 0,
        padding: "20px 16px 24px",
        background: "var(--bg-sidebar)",
        borderRight: "1px solid var(--border-subtle)",
        ...style,
      }}
      {...rest}
    >
      <span style={{ padding: "0 8px", fontSize: "var(--text-subtitle)", fontWeight: "var(--weight-bold)", letterSpacing: "var(--tracking-tight)", color: "var(--text-primary)" }}>{brand}</span>
      <nav aria-label={navLabel} style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 32 }}>
        {items.map((item) => {
          const on = item.id === active;
          const itemStyle = {
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "10px 14px",
            border: "none",
            cursor: "pointer",
            textAlign: "left",
            textDecoration: "none",
            borderRadius: "var(--radius-full)",
            background: on ? "var(--surface-active)" : "transparent",
            color: on ? "var(--text-primary)" : "var(--text-secondary)",
            fontFamily: "var(--font-sans)",
            fontSize: "var(--text-sm)",
            fontWeight: "var(--weight-medium)",
            transition: "background var(--dur-fast) var(--ease-in-out), color var(--dur-fast) var(--ease-in-out)",
          };
          const inner = (
            <>
              <Icon name={item.icon} size={16} />
              <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.label}</span>
              {item.badge ? (
                <>
                  <span
                    aria-hidden="true"
                    style={{
                      minWidth: 20,
                      padding: "1px 6px",
                      borderRadius: "var(--radius-full)",
                      background: "var(--accent-quiet)",
                      color: "var(--text-accent)",
                      fontSize: "var(--text-3xs)",
                      fontWeight: "var(--weight-semibold)",
                      textAlign: "center",
                    }}
                  >
                    {item.badge > 99 ? "99+" : item.badge}
                  </span>
                  <span className="sf-sr">, {item.badge} waiting</span>
                </>
              ) : null}
            </>
          );
          if (item.href) {
            return (
              <Link key={item.id} href={item.href} aria-current={on ? "page" : undefined} onClick={() => onNavigate && onNavigate(item.id)} style={itemStyle}>
                {inner}
              </Link>
            );
          }
          return (
            <button key={item.id} type="button" onClick={() => onNavigate && onNavigate(item.id)} style={itemStyle}>
              {inner}
            </button>
          );
        })}
      </nav>
      <div style={{ marginTop: "auto" }}>{footer}</div>
    </aside>
  );
}
