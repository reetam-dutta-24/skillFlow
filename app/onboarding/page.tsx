import type { Metadata } from "next";
import { OnboardingView } from "./onboarding-view";

// Transitional, gated step (only reachable right after signup) — no
// standalone SEO value, same reasoning as the app's gated screens.
export const metadata: Metadata = {
  title: "Get started",
  description: "Choose your skills and set up SkillFlow.",
  robots: { index: false, follow: false },
};

export default function OnboardingPage() {
  return <OnboardingView />;
}
