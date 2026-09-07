"use client";

import React, { useState } from "react";
import { AppShell } from "@/components/shell/AppShell";
import { SettingsSection } from "@/components/forms/SettingsSection.jsx";
import { ThemeToggle } from "@/components/forms/ThemeToggle.jsx";
import { SkillSelectGrid } from "@/components/onboarding/SkillSelectGrid";
import { Skeleton } from "@/components/feedback/Skeleton.jsx";
import { useMockLoading } from "@/lib/use-mock-loading";
import { useTheme } from "@/lib/theme-context";
import { skills, user } from "@/lib/mock-data";

// A separate component (not inline in SettingsView) so useTheme() resolves
// against the ThemeProvider that AppShell renders around its children.
function AppearanceSection() {
  const { theme, setTheme } = useTheme();
  return (
    <SettingsSection title="Appearance" subtitle="Theme applies across all of SkillFlow">
      <ThemeToggle
        theme={theme}
        onChange={setTheme}
        target={typeof document !== "undefined" ? document.documentElement : null}
      />
    </SettingsSection>
  );
}

function AccountSection() {
  return (
    <SettingsSection title="Account" subtitle="Mock profile — sign-in isn't wired up yet">
      <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "6px 0" }}>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 44,
            height: 44,
            flexShrink: 0,
            borderRadius: "var(--radius-full)",
            backgroundImage: "var(--gradient-brand)",
            color: "#fff",
            fontSize: "var(--text-subtitle)",
            fontWeight: "var(--weight-bold)",
          }}
        >
          {user.name.charAt(0).toUpperCase()}
        </span>
        <div style={{ minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: "var(--text-body)", fontWeight: "var(--weight-semibold)", color: "var(--text-primary)" }}>
            {user.name}
          </p>
          <p style={{ margin: "2px 0 0", fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>{user.email}</p>
        </div>
      </div>
    </SettingsSection>
  );
}

function NichesSection() {
  const [active, setActive] = useState<string[]>(skills.map((s) => s.slug));

  function toggle(slug: string) {
    setActive((prev) => (prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]));
  }

  return (
    <SettingsSection title="Your niches" subtitle="Manage which skills you're actively pursuing">
      <div style={{ marginTop: 4 }}>
        <SkillSelectGrid selected={active} onToggle={toggle} />
      </div>
    </SettingsSection>
  );
}

export function SettingsView() {
  const loading = useMockLoading();

  return (
    <AppShell title="Settings" active="settings">
      {loading ? (
        <>
          <Skeleton height={140} radius="var(--radius-card)" />
          <Skeleton height={120} radius="var(--radius-card)" />
          <Skeleton height={260} radius="var(--radius-card)" />
        </>
      ) : (
        <>
          <AppearanceSection />
          <AccountSection />
          <NichesSection />
        </>
      )}
    </AppShell>
  );
}
