import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/feedback/AuthShell.jsx";
import { AuthInput } from "@/components/forms/AuthInput.jsx";
import { Icon } from "@/components/core/Icon.jsx";
import { LinkButton } from "@/components/marketing/LinkButton";

// Public conversion page — indexed, same as the landing page. Only the
// gated app screens (and the post-signup onboarding step) are noindex.
export const metadata: Metadata = {
  title: "Log in",
  description: "Log in to SkillFlow to continue your roadmaps.",
};

export default function LoginPage() {
  return (
    <main style={{ minHeight: "100dvh" }}>
      <AuthShell headline="Welcome back." sub="Pick up your roadmap where you left off.">
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Placeholder — no real auth wired up yet, this is a UI shell. */}
          <LinkButton href="/dashboard" variant="gradient" size="lg" full>
            <Icon name="github" size={17} color="#fff" />
            Continue with GitHub
          </LinkButton>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ flex: 1, height: 1, background: "var(--border-subtle)" }} />
            <span style={{ fontSize: "var(--text-xs)", color: "var(--text-faint)" }}>or</span>
            <span style={{ flex: 1, height: 1, background: "var(--border-subtle)" }} />
          </div>

          <form style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <AuthInput icon="mail" type="email" name="email" placeholder="Email" autoComplete="email" />
            <AuthInput icon="lock" type="password" name="password" placeholder="Password" autoComplete="current-password" />
            <LinkButton href="/dashboard" variant="outline" size="lg" full>Log in</LinkButton>
          </form>

          <p style={{ margin: 0, textAlign: "center", fontSize: "var(--text-sm)", color: "var(--text-muted)" }}>
            Don&apos;t have an account?{" "}
            <Link href="/signup" style={{ color: "var(--text-link)", fontWeight: "var(--weight-semibold)" }}>Sign up</Link>
          </p>
        </div>
      </AuthShell>
    </main>
  );
}
