import type { ReactNode } from "react";
import { ThemeToggle } from "@/components/forms/ThemeToggle.jsx";
import { AccentSync } from "./AccentSync.jsx";
import { SignOutButton } from "./SignOutButton.jsx";

export function DashFrame({ accent, children }: { accent: string; children: ReactNode }) {
  return (
    <div className="sf-dash">
      <AccentSync accent={accent} />
      <header className="sf-dash-bar">
        <a className="sf-wordmark" href="/dashboard">
          SkillFlow
        </a>
        <div className="sf-dash-actions">
          <ThemeToggle quiet />
          <SignOutButton />
        </div>
      </header>
      <main className="sf-dash-main">{children}</main>
    </div>
  );
}
