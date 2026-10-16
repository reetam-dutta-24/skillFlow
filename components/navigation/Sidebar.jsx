"use client";

import React from "react";
import Link from "next/link";
import { Icon } from "../core/Icon.jsx";

export const SKILLFLOW_NAV = [
  { id: "home", label: "Home", icon: "house", href: "/dashboard", section: "Learn" },
  { id: "roadmaps", label: "Paths", icon: "route", href: "/roadmap" },
  { id: "niches", label: "Niches", icon: "library", href: "/skills" },
  { id: "notes", label: "Notes", icon: "notebook-pen", href: "/notes" },
  { id: "detox", label: "Detox", icon: "leaf", href: "/detox" },
  { id: "progress", label: "Progress", icon: "chart-line", href: "/progress", section: "Track" },
  { id: "analytics", label: "Analytics", icon: "chart-pie", href: "/analytics" },
  { id: "clips", label: "Clips", icon: "clapperboard", href: "/clips", section: "Community" },
  { id: "open-source", label: "Open Source", icon: "git-pull-request", href: "/open-source" },
  { id: "nearby", label: "Nearby", icon: "map-pin", href: "/nearby" },
  { id: "settings", label: "Settings", icon: "settings", href: "/settings", section: "Account" },
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
        overflowY: "auto",
        ...style,
      }}
      {...rest}
    >
      <span style={{ padding: "0 8px", fontSize: "var(--text-subtitle)", fontWeight: "var(--weight-bold)", letterSpacing: "var(--tracking-tight)", color: "var(--text-primary)" }}>{brand}</span>
      <nav aria-label={navLabel} style={{ display: "flex", flexDirection: "column", gap: 2, marginTop: 24 }}>
        {items.map((item) => {
          const on = item.id === active;
          const itemStyle = {
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "9px 14px",
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
          // A group label is decoration for sighted readers; the nav keeps one flat list for assistive tech.
          const label = item.section ? (
            <span className="sf-nav-section" aria-hidden="true">
              {item.section}
            </span>
          ) : null;
          if (item.href) {
            return (
              <React.Fragment key={item.id}>
                {label}
                <Link href={item.href} aria-current={on ? "page" : undefined} onClick={() => onNavigate && onNavigate(item.id)} style={itemStyle}>
                  {inner}
                </Link>
              </React.Fragment>
            );
          }
          return (
            <React.Fragment key={item.id}>
              {label}
              <button type="button" onClick={() => onNavigate && onNavigate(item.id)} style={itemStyle}>
                {inner}
              </button>
            </React.Fragment>
          );
        })}
      </nav>
      <div style={{ marginTop: "auto" }}>{footer}</div>
    </aside>
  );
}
