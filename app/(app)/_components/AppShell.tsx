"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Icon } from "@/components/core/Icon.jsx";
import { Sidebar, type SidebarItem } from "@/components/navigation/Sidebar.jsx";
import { Topbar } from "@/components/navigation/Topbar.jsx";

const NAV: SidebarItem[] = [
  { id: "home", label: "Home", icon: "house", href: "/dashboard" },
  { id: "niches", label: "Niches", icon: "library", href: "/skills" },
  { id: "clips", label: "Clips", icon: "clapperboard", href: "/clips" },
  { id: "roadmaps", label: "Roadmaps", icon: "route", href: "/roadmap" },
  { id: "progress", label: "Progress", icon: "chart-line", href: "/progress" },
  { id: "analytics", label: "Analytics", icon: "chart-pie", href: "/analytics" },
  { id: "submit", label: "Submit a resource", icon: "file-plus", href: "/submit" },
  { id: "settings", label: "Settings", icon: "settings", href: "/settings" },
];

const ADMIN_ITEM: SidebarItem = {
  id: "admin",
  label: "Admin",
  icon: "inbox",
  href: "/admin/submissions",
};

type ShellUser = {
  name: string;
  email: string | null;
  image: string | null;
  role: "USER" | "ADMIN";
};

function activeId(pathname: string) {
  if (pathname.startsWith("/dev")) return "";
  if (pathname.startsWith("/admin")) return "admin";
  if (pathname.startsWith("/skills")) return "niches";
  if (pathname.startsWith("/clips")) return "clips";
  if (pathname.startsWith("/roadmap") || pathname.startsWith("/lesson") || pathname.startsWith("/quiz") || pathname.startsWith("/milestone")) return "roadmaps";
  if (pathname.startsWith("/analytics")) return "analytics";
  if (pathname.startsWith("/progress")) return "progress";
  if (pathname.startsWith("/settings")) return "settings";
  if (pathname.startsWith("/submit")) return "submit";
  if (
    pathname.startsWith("/upgrade") ||
    pathname.startsWith("/leaderboard") ||
    pathname.startsWith("/notes") ||
    pathname.startsWith("/creator") ||
    pathname.startsWith("/projects") ||
    pathname.startsWith("/transcript")
  ) return "";
  return "home";
}

function titleFor(pathname: string) {
  if (pathname.startsWith("/admin")) return "Admin";
  if (pathname.startsWith("/skills")) return "Niches";
  if (pathname.startsWith("/clips")) return "Clips";
  if (pathname.startsWith("/roadmap")) return "Roadmaps";
  if (pathname.startsWith("/analytics")) return "Analytics";
  if (pathname.startsWith("/progress")) return "Progress";
  if (pathname.startsWith("/upgrade")) return "Upgrade";
  if (pathname.startsWith("/leaderboard")) return "Leaderboard";
  if (pathname.startsWith("/notes")) return "Notes";
  if (pathname.startsWith("/creator")) return "Creator";
  if (pathname.startsWith("/projects")) return "Project review";
  if (pathname.startsWith("/transcript")) return "Transcript";
  if (pathname.startsWith("/settings")) return "Settings";
  if (pathname.startsWith("/submit/byor")) return "Bring your own resource";
  if (pathname.startsWith("/submit")) return "Submit a resource";
  if (pathname === "/dev/routes") return "Routes";
  if (pathname === "/dev/missing") return "Page not found";
  if (pathname === "/dev/error") return "Something went wrong";
  if (pathname.startsWith("/lesson")) return "Lesson";
  if (pathname.startsWith("/quiz")) return "Quiz";
  if (pathname.startsWith("/milestone")) return "Explain-back";
  return "Home";
}

export function AppShell({ user, notifications, children }: { user: ShellUser; notifications: ReactNode; children: ReactNode }) {
  const pathname = usePathname();
  const [openPath, setOpenPath] = useState<string | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const wasOpen = useRef(false);
  const items = user.role === "ADMIN" ? [...NAV, ADMIN_ITEM] : NAV;
  const active = activeId(pathname);
  const open = openPath === pathname;

  function closeMenu() {
    setOpenPath(null);
  }

  useEffect(() => {
    if (wasOpen.current && !open) triggerRef.current?.focus();
    wasOpen.current = open;
  }, [open]);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 960px)");
    function onChange() {
      if (media.matches) setOpenPath(null);
    }
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const panel = panelRef.current;
    const focusable = () =>
      panel ? [...panel.querySelectorAll<HTMLElement>("a[href], button:not([disabled]), [tabindex]:not([tabindex='-1'])")] : [];
    focusable()[0]?.focus();

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpenPath(null);
        return;
      }
      if (event.key !== "Tab") return;
      const nodes = focusable();
      if (!nodes.length) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="sf-app">
      <div className="sf-app-nav">
        <Sidebar items={items} active={active} />
      </div>
      <div className="sf-app-body" {...(open ? { inert: true } : {})}>
        <a className="sf-skip" href="#main">
          Skip to main content
        </a>
        <Topbar
          title={titleFor(pathname)}
          titleAs="p"
          showSearch={false}
          leading={
            <button
              ref={triggerRef}
              type="button"
              className="sf-app-menu-btn"
              aria-expanded={open}
              aria-controls={open ? `${titleId}-dialog` : undefined}
              onClick={() => setOpenPath(pathname)}
            >
              <Icon name="menu" size={18} />
              <span className="sf-sr">Open menu</span>
            </button>
          }
          notificationSlot={notifications}
          user={{ name: user.name, email: user.email ?? undefined, avatarUrl: user.image ?? undefined }}
          menuItems={[
            { label: "Settings", icon: "settings", href: "/settings" },
            { label: "Log out", icon: "log-out", danger: true },
          ]}
          onMenuSelect={(label) => {
            if (label === "Log out") void signOut({ callbackUrl: "/" });
          }}
        />
        <main id="main" className="sf-app-main">
          {children}
        </main>
      </div>
      {open ? (
        <div className="sf-app-drawer" id={`${titleId}-dialog`} role="dialog" aria-modal="true" aria-labelledby={titleId}>
          <button type="button" className="sf-app-backdrop" tabIndex={-1} aria-hidden="true" onClick={closeMenu} />
          <div className="sf-app-drawer-panel" ref={panelRef}>
            <p className="sf-sr" id={titleId}>Menu</p>
            <button type="button" className="sf-app-drawer-close" onClick={closeMenu}>
              Close
            </button>
            <Sidebar items={items} active={active} onNavigate={() => setOpenPath(null)} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
