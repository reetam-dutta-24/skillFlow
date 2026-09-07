"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar, SKILLFLOW_NAV } from "../navigation/Sidebar.jsx";
import { Topbar } from "../navigation/Topbar.jsx";
import { ThemeProvider, useTheme } from "@/lib/theme-context";
import { skills, user } from "@/lib/mock-data";

const NAV_PATHS: Record<string, string> = {
  home: "/dashboard",
  roadmaps: `/roadmap/${skills[0]?.slug ?? ""}`,
  progress: "/progress",
  settings: "/settings",
  // "library" has no page in this batch — Sidebar click is a deliberate no-op.
};

export interface AppShellProps {
  title: string;
  active: string;
  children: React.ReactNode;
}

function Shell({ title, active, children }: AppShellProps) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [search, setSearch] = useState("");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Baseline overlay a11y: Escape closes the drawer. (No full focus trap yet —
  // acceptable for this UI-shell phase, but worth revisiting before real launch.)
  useEffect(() => {
    if (!mobileNavOpen) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setMobileNavOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mobileNavOpen]);

  function navigate(id: string) {
    setMobileNavOpen(false);
    const path = NAV_PATHS[id];
    if (path) router.push(path);
  }

  return (
    <div style={{ display: "flex", minHeight: "100dvh" }}>
      {/* Desktop rail — hidden below md, where it's replaced by the drawer below.
          Visibility is on this wrapper div, not on Sidebar itself: Sidebar's own
          inline style already sets display:flex, which would otherwise always
          win over a className since inline styles beat stylesheet rules. */}
      <div className="hidden md:flex">
        <Sidebar items={SKILLFLOW_NAV} active={active} onNavigate={navigate} brand="SkillFlow" />
      </div>

      {mobileNavOpen ? (
        <div role="dialog" aria-modal="true" aria-label="Navigation menu" className="md:hidden">
          <div
            onClick={() => setMobileNavOpen(false)}
            aria-hidden="true"
            style={{ position: "fixed", inset: 0, zIndex: 40, background: "rgba(0,0,0,.5)", animation: "sf-fade-up var(--dur-fast) var(--ease-in-out) both" }}
          />
          <Sidebar
            items={SKILLFLOW_NAV}
            active={active}
            onNavigate={navigate}
            brand="SkillFlow"
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              bottom: 0,
              zIndex: 50,
              width: "var(--sidebar-w-mobile)",
              boxShadow: "var(--shadow-panel)",
              animation: "sf-slide-in var(--dur-base) var(--ease-out-expo) both",
            }}
          />
        </div>
      ) : null}

      <div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0 }}>
        <Topbar
          title={title}
          user={user}
          theme={theme}
          onThemeChange={setTheme}
          themeTarget={typeof document !== "undefined" ? document.documentElement : null}
          notifications={2}
          searchValue={search}
          onSearchChange={setSearch}
          onMenuClick={() => setMobileNavOpen(true)}
        />
        <main
          className="px-[var(--page-pad-x-xs)] sm:px-[var(--page-pad-x-sm)] lg:px-[var(--page-pad-x)]"
          style={{
            flex: 1,
            width: "100%",
            maxWidth: "var(--content-max)",
            margin: "0 auto",
            paddingTop: 32,
            paddingBottom: 32,
            display: "flex",
            flexDirection: "column",
            gap: 32,
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}

export function AppShell(props: AppShellProps) {
  return (
    <ThemeProvider>
      <Shell {...props} />
    </ThemeProvider>
  );
}
