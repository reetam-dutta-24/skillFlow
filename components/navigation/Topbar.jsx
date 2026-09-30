"use client";

import React from "react";
import { SearchPill } from "../forms/SearchPill.jsx";
import { ThemeToggle } from "../forms/ThemeToggle.jsx";
import { NotificationBell } from "./NotificationBell.jsx";
import { UserProfileMenu } from "./UserProfileMenu.jsx";

/** Sticky page header: title, search, notifications, theme, account. */
export function Topbar({ title, user, theme = "dark", onThemeChange, themeTarget, notifications = 0, onNotificationsClick, searchValue, onSearchChange, showSearch = true, leading = null, notificationSlot = null, accountSlot = null, titleAs = "h1", menuItems, onMenuSelect, className, style, ...rest }) {
  return (
    <header
      className={["sf-topbar", className].filter(Boolean).join(" ")}
      style={style}
      {...rest}
    >
      {leading}
      {titleAs === "p" ? (
        <p className="sf-topbar-title">{title}</p>
      ) : (
        <h1 className="sf-topbar-title">{title}</h1>
      )}
      <div className="sf-topbar-tools">
        {showSearch ? (
          <div className="sf-topbar-search">
            <SearchPill value={searchValue} onChange={onSearchChange} />
          </div>
        ) : null}
        <ThemeToggle compact theme={theme} onChange={onThemeChange} target={themeTarget} />
        {notificationSlot ?? <NotificationBell count={notifications} onClick={onNotificationsClick} />}
        {accountSlot ?? (user ? <UserProfileMenu {...user} items={menuItems} onSelect={onMenuSelect} /> : null)}
      </div>
    </header>
  );
}
