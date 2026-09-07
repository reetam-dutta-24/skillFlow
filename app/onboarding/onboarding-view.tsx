"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/core/Button.jsx";
import { GradientButton } from "@/components/core/GradientButton.jsx";
import { GlassCard } from "@/components/core/GlassCard.jsx";
import { Icon } from "@/components/core/Icon.jsx";
import { SettingsToggle } from "@/components/forms/SettingsToggle.jsx";
import { Skeleton } from "@/components/feedback/Skeleton.jsx";
import { PaginationDots } from "@/components/navigation/PaginationDots.jsx";
import { OnboardingSteps } from "@/components/onboarding/OnboardingSteps";
import { SkillSelectGrid } from "@/components/onboarding/SkillSelectGrid";
import { LevelSelector, type SkillLevel } from "@/components/onboarding/LevelSelector";
import { useMockLoading } from "@/lib/use-mock-loading";
import { skills } from "@/lib/mock-data";

const STEP_TITLES = ["Choose your skills", "Set your level", "Notifications", "Enter SkillFlow"];
const TOTAL_STEPS = STEP_TITLES.length;

export function OnboardingView() {
  const router = useRouter();
  const loading = useMockLoading();

  const [step, setStep] = useState(1);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [levels, setLevels] = useState<Record<string, SkillLevel>>({});
  const [reminderEnabled, setReminderEnabled] = useState(true);

  function toggleSkill(slug: string) {
    setSelectedSkills((prev) => (prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]));
  }

  const chosenSkills = skills.filter((s) => selectedSkills.includes(s.slug));
  const allLevelsSet = chosenSkills.length > 0 && chosenSkills.every((s) => levels[s.slug]);

  const canContinue = step === 1 ? selectedSkills.length > 0 : step === 2 ? allLevelsSet : true;

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100dvh", background: "var(--bg-app)" }}>
      <header style={{ display: "flex", alignItems: "center", height: "var(--topbar-h)", padding: "0 24px", borderBottom: "1px solid var(--border-subtle)" }}>
        <span style={{ fontSize: "var(--text-subtitle)", fontWeight: "var(--weight-bold)", letterSpacing: "var(--tracking-tight)", color: "var(--text-primary)" }}>SkillFlow</span>
      </header>

      <main style={{ flex: 1, width: "100%", maxWidth: 880, margin: "0 auto", padding: "40px 24px", display: "flex", flexDirection: "column", gap: 32 }}>
        {/* Mobile step indicator — flex via Tailwind classes, not inline style,
            since an inline `display` would always beat the md:hidden class. */}
        <div className="flex md:hidden" style={{ flexDirection: "column", alignItems: "center", gap: 10 }}>
          <PaginationDots total={TOTAL_STEPS} current={step - 1} />
          <p style={{ margin: 0, fontSize: "var(--text-sm)", fontWeight: "var(--weight-semibold)", color: "var(--text-primary)" }}>{STEP_TITLES[step - 1]}</p>
        </div>

        <div style={{ display: "flex", gap: 40 }}>
          <OnboardingSteps steps={STEP_TITLES} current={step} />

          <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 24 }}>
            {loading && step === 1 ? (
              <>
                <Skeleton height={28} width={220} />
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} height={120} radius="var(--radius-card)" />
                  ))}
                </div>
              </>
            ) : step === 1 ? (
              <>
                <div>
                  <h1 style={{ margin: 0, fontSize: "var(--text-title)", fontWeight: "var(--weight-bold)", color: "var(--text-primary)" }}>Choose your skills</h1>
                  <p style={{ margin: "6px 0 0", fontSize: "var(--text-sm)", color: "var(--text-muted)" }}>Pick as many as you want to pursue — you can change this later in Settings.</p>
                </div>
                <SkillSelectGrid selected={selectedSkills} onToggle={toggleSkill} />
              </>
            ) : step === 2 ? (
              <>
                <div>
                  <h1 style={{ margin: 0, fontSize: "var(--text-title)", fontWeight: "var(--weight-bold)", color: "var(--text-primary)" }}>What&apos;s your current level?</h1>
                  <p style={{ margin: "6px 0 0", fontSize: "var(--text-sm)", color: "var(--text-muted)" }}>Used to set your starting stage in each roadmap.</p>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {chosenSkills.map((skill) => (
                    <GlassCard key={skill.slug} style={{ padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
                      <p style={{ margin: 0, fontSize: "var(--text-body)", fontWeight: "var(--weight-semibold)", color: "var(--text-primary)" }}>{skill.name}</p>
                      <LevelSelector
                        value={levels[skill.slug] ?? null}
                        onChange={(level) => setLevels((prev) => ({ ...prev, [skill.slug]: level }))}
                      />
                    </GlassCard>
                  ))}
                </div>
              </>
            ) : step === 3 ? (
              <>
                <div>
                  <h1 style={{ margin: 0, fontSize: "var(--text-title)", fontWeight: "var(--weight-bold)", color: "var(--text-primary)" }}>Stay on track</h1>
                  <p style={{ margin: "6px 0 0", fontSize: "var(--text-sm)", color: "var(--text-muted)" }}>You can change this anytime in Settings.</p>
                </div>
                <GlassCard style={{ padding: 20 }}>
                  <SettingsToggle
                    label="Daily streak reminder"
                    description="A quiet nudge if you haven't opened SkillFlow yet today."
                    checked={reminderEnabled}
                    onChange={setReminderEnabled}
                  />
                </GlassCard>
              </>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 16, padding: "24px 0" }}>
                <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 56, height: 56, borderRadius: "var(--radius-full)", backgroundImage: "var(--gradient-brand)" }}>
                  <Icon name="check" size={26} color="#fff" strokeWidth={3} />
                </span>
                <h1 style={{ margin: 0, fontSize: "var(--text-title)", fontWeight: "var(--weight-bold)", color: "var(--text-primary)" }}>You&apos;re set up.</h1>
                <p style={{ margin: 0, maxWidth: 420, fontSize: "var(--text-sm)", color: "var(--text-muted)" }}>
                  {chosenSkills.map((s) => s.name).join(", ") || "Your skills"} — ready whenever you are.
                </p>
                <GradientButton size="xl" onClick={() => router.push("/dashboard")}>Enter SkillFlow</GradientButton>
              </div>
            )}

            {step < TOTAL_STEPS ? (
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
                {step > 1 ? (
                  <Button variant="ghost" onClick={() => setStep((s) => s - 1)}>Back</Button>
                ) : <span />}
                <Button variant="gradient" disabled={!canContinue} onClick={() => setStep((s) => s + 1)}>Continue</Button>
              </div>
            ) : null}
          </div>
        </div>
      </main>
    </div>
  );
}
