import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/feedback/AuthShell.jsx";
import { AuthInput } from "@/components/forms/AuthInput.jsx";
import { Icon } from "@/components/core/Icon.jsx";
import { LinkButton } from "@/components/marketing/LinkButton";

export const metadata: Metadata = {
  title: "Sign up",
  description: "Create a SkillFlow account and start a roadmap.",
};

export default function SignupPage() {
  return (
    <main style={{ minHeight: "100dvh" }}>
      <AuthShell headline="Start learning something properly." sub="Pick a skill, follow a real roadmap, and prove you understood each stage.">
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Placeholder — no real auth wired up yet, this is a UI shell.
              Routes straight to onboarding, matching the intended v1 flow. */}
          <LinkButton href="/onboarding" variant="gradient" size="lg" full>
            <Icon name="github" size={17} color="#fff" />
            Continue with GitHub
          </LinkButton>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ flex: 1, height: 1, background: "var(--border-subtle)" }} />
            <span style={{ fontSize: "var(--text-xs)", color: "var(--text-faint)" }}>or</span>
            <span style={{ flex: 1, height: 1, background: "var(--border-subtle)" }} />
          </div>

          <form style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <AuthInput icon="user" type="text" name="name" placeholder="Name" autoComplete="name" />
            <AuthInput icon="mail" type="email" name="email" placeholder="Email" autoComplete="email" />
            <AuthInput icon="lock" type="password" name="password" placeholder="Password" autoComplete="new-password" />
            <LinkButton href="/onboarding" variant="outline" size="lg" full>Create account</LinkButton>
          </form>

          <p style={{ margin: 0, fontSize: "var(--text-2xs)", lineHeight: 1.5, color: "var(--text-faint)", textWrap: "pretty" }}>
            By continuing, you agree to SkillFlow&apos;s terms and privacy policy.
          </p>

          <p style={{ margin: 0, textAlign: "center", fontSize: "var(--text-sm)", color: "var(--text-muted)" }}>
            Already have an account?{" "}
            <Link href="/login" style={{ color: "var(--text-link)", fontWeight: "var(--weight-semibold)" }}>Log in</Link>
          </p>
        </div>
      </AuthShell>
    </main>
  );
}
