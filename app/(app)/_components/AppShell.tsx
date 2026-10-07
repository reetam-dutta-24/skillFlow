"use client";

import { Suspense, useEffect, useId, useRef, useState, type ReactNode } from "react";
import clsx from "clsx";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/core/Icon.jsx";
import { useSpectrumLightShade } from "@/components/theme/useSpectrumShade";
import { Sidebar, type SidebarItem } from "@/components/navigation/Sidebar.jsx";
import { Topbar } from "@/components/navigation/Topbar.jsx";
import { ShellRoleProvider, useShellReview, useShellRole } from "./shell-role";

const NAV: SidebarItem[] = [
  { id: "home", label: "Home", icon: "house", href: "/dashboard" },
  { id: "niches", label: "Niches", icon: "library", href: "/skills" },
  { id: "clips", label: "Clips", icon: "clapperboard", href: "/clips" },
  { id: "creator", label: "Creator studio", icon: "video", href: "/creator" },
  { id: "roadmaps", label: "Roadmaps", icon: "route", href: "/roadmap" },
  { id: "nearby", label: "Nearby", icon: "map-pin", href: "/nearby" },
  { id: "open-source", label: "Open Source", icon: "git-pull-request", href: "/open-source" },
  { id: "progress", label: "Progress", icon: "chart-line", href: "/progress" },
  { id: "notes", label: "Notes", icon: "notebook-pen", href: "/notes" },
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

/** Shown to admins and niche reviewers only, right after Open Source. */
const REVIEW_ITEM: SidebarItem = {
  id: "review",
  label: "Review",
  icon: "git-pull-request",
  href: "/open-source/review",
};

type ShellProps = {
  account: ReactNode;
  notifications: ReactNode;
  /** Streams the per-person review count into the nav. Renders nothing visible. */
  review: ReactNode;
  children: ReactNode;
};

function activeId(pathname: string) {
  if (pathname.startsWith("/dev")) return "";
  if (pathname.startsWith("/admin")) return "admin";
  if (pathname.startsWith("/open-source/review")) return "review";
  if (pathname.startsWith("/open-source")) return "open-source";
  if (pathname.startsWith("/skills")) return "niches";
  if (pathname.startsWith("/clips")) return "clips";
  if (pathname.startsWith("/creator")) return "creator";
  if (pathname.startsWith("/profile")) return "creator";
  if (pathname.startsWith("/nearby") || pathname.startsWith("/map")) return "nearby";
  if (pathname.startsWith("/roadmap") || pathname.startsWith("/lesson") || pathname.startsWith("/milestone")) return "roadmaps";
  if (pathname.startsWith("/analytics")) return "analytics";
  if (pathname.startsWith("/progress")) return "progress";
  if (pathname.startsWith("/notes")) return "notes";
  if (pathname.startsWith("/settings")) return "settings";
  if (pathname.startsWith("/submit")) return "submit";
  if (
    pathname.startsWith("/upgrade") ||
    pathname.startsWith("/transcript")
  ) return "";
  return "home";
}

function titleFor(pathname: string) {
  if (pathname.startsWith("/admin")) return "Admin";
  if (pathname.startsWith("/open-source/review")) return "Review";
  if (pathname.startsWith("/open-source")) return "Open Source";
  if (pathname.startsWith("/skills")) return "Niches";
  if (pathname.startsWith("/clips")) return "Clips";
  if (pathname.startsWith("/nearby") || pathname.startsWith("/map")) return "Nearby";
  if (pathname.startsWith("/roadmap")) return "Roadmaps";
  if (pathname.startsWith("/analytics")) return "Analytics";
  if (pathname.startsWith("/progress")) return "Progress";
  if (pathname.startsWith("/upgrade")) return "Upgrade";
  if (pathname.startsWith("/notes")) return "Notes";
  if (pathname.startsWith("/creator")) return "Creator studio";
  if (pathname.startsWith("/profile")) return "Profile";
  if (pathname.startsWith("/transcript")) return "Transcript";
  if (pathname.startsWith("/settings")) return "Settings";
  if (pathname.startsWith("/submit/byor")) return "Bring your own resource";
  if (pathname.startsWith("/submit")) return "Submit a resource";
  if (pathname === "/dev/routes") return "Routes";
  if (pathname === "/dev/missing") return "Page not found";
  if (pathname === "/dev/error") return "Something went wrong";
  if (pathname.startsWith("/lesson")) return "Lesson";
  if (pathname.startsWith("/milestone")) return "Explain-back";
  return "Home";
}

function navItems(role: "USER" | "ADMIN", review: number | null) {
  const items = review === null
    ? NAV
    : NAV.flatMap((item) => (item.id === "open-source" ? [item, { ...REVIEW_ITEM, badge: review }] : [item]));
  return role === "ADMIN" ? [...items, ADMIN_ITEM] : items;
}

function PathTitle() {
  return titleFor(usePathname());
}

function LiveSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return <Sidebar items={navItems(useShellRole(), useShellReview())} active={activeId(pathname)} onNavigate={onNavigate} />;
}

function CloseMenuOnNavigate({ close }: { close: () => void }) {
  const pathname = usePathname();
  const previous = useRef(pathname);
  useEffect(() => {
    if (previous.current === pathname) return;
    previous.current = pathname;
    close();
  }, [pathname, close]);
  return null;
}

export function AppShell({ account, notifications, review, children }: ShellProps) {
  return (
    <ShellRoleProvider>
      {review}
      <AppShellFrame account={account} notifications={notifications}>
        {children}
      </AppShellFrame>
    </ShellRoleProvider>
  );
}

function AppShellFrame({ account, notifications, children }: Omit<ShellProps, "review">) {
  const lightShade = useSpectrumLightShade();
  const [menuOpen, setMenuOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const wasOpen = useRef(false);

  function closeMenu() {
    setMenuOpen(false);
  }

  useEffect(() => {
    if (wasOpen.current && !menuOpen) triggerRef.current?.focus();
    wasOpen.current = menuOpen;
  }, [menuOpen]);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 960px)");
    function onChange() {
      if (media.matches) setMenuOpen(false);
    }
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const panel = panelRef.current;
    const focusable = () =>
      panel ? [...panel.querySelectorAll<HTMLElement>("a[href], button:not([disabled]), [tabindex]:not([tabindex='-1'])")] : [];
    focusable()[0]?.focus();

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setMenuOpen(false);
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
  }, [menuOpen]);

  const menuButton = (
    <button
      ref={triggerRef}
      type="button"
      className="sf-app-menu-btn"
      aria-expanded={menuOpen}
      aria-controls={menuOpen ? `${titleId}-dialog` : undefined}
      onClick={() => setMenuOpen(true)}
    >
      <Icon name="menu" size={18} />
      <span className="sf-sr">Open menu</span>
    </button>
  );

  return (
    <div className={clsx("sf-app", lightShade && "spectrum-light-shade text-slate-950")}>
      <Suspense fallback={null}>
        <CloseMenuOnNavigate close={closeMenu} />
      </Suspense>
      <div className="sf-app-nav">
        <Suspense fallback={<Sidebar items={NAV} active="" />}>
          <LiveSidebar />
        </Suspense>
      </div>
      <div className="sf-app-body" {...(menuOpen ? { inert: true } : {})}>
        <a className="sf-skip" href="#main">
          Skip to main content
        </a>
        <Topbar
          title={
            <Suspense fallback="SkillFlow">
              <PathTitle />
            </Suspense>
          }
          titleAs="p"
          showSearch={false}
          leading={menuButton}
          notificationSlot={notifications}
          accountSlot={account}
        />
        <main id="main" className="sf-app-main">
          {children}
        </main>
      </div>
      {menuOpen ? (
        <div className="sf-app-drawer" id={`${titleId}-dialog`} role="dialog" aria-modal="true" aria-labelledby={titleId}>
          <button type="button" className="sf-app-backdrop" tabIndex={-1} aria-hidden="true" onClick={closeMenu} />
          <div className="sf-app-drawer-panel" ref={panelRef}>
            <p className="sf-sr" id={titleId}>Menu</p>
            <button type="button" className="sf-app-drawer-close" onClick={closeMenu}>
              Close
            </button>
            <Suspense fallback={<Sidebar items={NAV} active="" onNavigate={closeMenu} />}>
              <LiveSidebar onNavigate={closeMenu} />
            </Suspense>
          </div>
        </div>
      ) : null}
    </div>
  );
}
