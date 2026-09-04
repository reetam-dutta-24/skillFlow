"use client";

import React from "react";
import { SearchPill } from "../forms/SearchPill.jsx";
import { ThemeToggle } from "../forms/ThemeToggle.jsx";
import { NotificationBell } from "./NotificationBell.jsx";
import { UserProfileMenu } from "./UserProfileMenu.jsx";

/** Sticky page header: title, search, notifications, theme, account. */
export function Topbar({ title, user, theme = "dark", onThemeChange, themeTarget, notifications = 0, onNotificationsClick, searchValue, onSearchChange, style, ...rest }) {
  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 30,
        display: "flex",
        alignItems: "center",
        gap: 16,
        height: "var(--topbar-h)",
        padding: "0 32px",
        background: "var(--bg-app)",
        borderBottom: "1px solid var(--border-subtle)",
        ...style,
      }}
      {...rest}
    >
      <h1 style={{ margin: 0, flexShrink: 0, fontSize: "var(--text-heading)", fontWeight: "var(--weight-bold)", letterSpacing: "var(--tracking-tight)", color: "var(--text-primary)" }}>{title}</h1>
      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 300 }}><SearchPill value={searchValue} onChange={onSearchChange} /></div>
        <ThemeToggle compact theme={theme} onChange={onThemeChange} target={themeTarget} />
        <NotificationBell count={notifications} onClick={onNotificationsClick} />
        {user ? <UserProfileMenu {...user} /> : null}
      </div>
    </header>
  );
}
