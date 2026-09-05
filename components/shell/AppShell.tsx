"use client";

import React, { useState } from "react";
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

  return (
    <div style={{ display: "flex", minHeight: "100dvh" }}>
      <Sidebar
        items={SKILLFLOW_NAV}
        active={active}
        onNavigate={(id) => {
          const path = NAV_PATHS[id];
          if (path) router.push(path);
        }}
        brand="SkillFlow"
      />
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
        />
        <main
          style={{
            flex: 1,
            width: "100%",
            maxWidth: "var(--content-max)",
            margin: "0 auto",
            padding: "32px var(--page-pad-x)",
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
