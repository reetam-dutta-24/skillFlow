import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/core/Icon.jsx";
import { GlassCard } from "@/components/core/GlassCard.jsx";
import { LinkButton } from "@/components/marketing/LinkButton";

// The actual public entry point — real, indexed metadata (contrast this
// with every gated app route, which sets robots: { index: false }).
export const metadata: Metadata = {
  title: { absolute: "SkillFlow — Learn a Skill, Prove You Understood It" },
  description:
    "A mastery-focused learning platform for Full-Stack Web Development, Art & Painting, and Content Creation — structured roadmaps, grounded quizzes, and an explain-back check that verifies real understanding.",
  openGraph: {
    title: "SkillFlow — Learn a Skill, Prove You Understood It",
    description:
      "Structured roadmaps, grounded quizzes, and an explain-back check that verifies real understanding — not passive completion.",
    type: "website",
  },
};

const FEATURES = [
  {
    icon: "route",
    title: "Structured Roadmaps",
    description: "Every skill breaks into ordered stages, each with a clear reason to exist and a clear thing that unlocks the next one.",
  },
  {
    icon: "help-circle",
    title: "Grounded AI Quizzes",
    description: "Questions and explanations are grounded in the exact lesson you just finished — not generic trivia pulled from nowhere.",
  },
  {
    icon: "message-square-quote",
    title: "The Explain-Back Gate",
    description: "Before a stage counts as done, you explain the concept in your own words and answer a targeted follow-up. No shortcuts to a passed stage.",
    emphasis: true,
  },
  {
    icon: "columns-3",
    title: "Segmented, Distraction-Free Feeds",
    description: "Each skill gets its own row and its own pace. Skills are never blended into one mixed feed competing for your attention.",
  },
  {
    icon: "shield-check",
    title: "No Comments, No Dark Patterns",
    description: "No infinite scroll, no engagement bait, no comment section to get lost in. Just the material and your actual progress.",
  },
  {
    icon: "chart-line",
    title: "Mastery Tracking",
    description: "Real mastery percentages per skill, growth over time, and the specific topics worth reviewing next.",
  },
];

const STEPS = [
  { title: "Pick a skill", description: "Full-Stack Web Development, Art & Painting, or Content Creation." },
  { title: "Follow a real roadmap", description: "Ordered stages, each building on the last — no skipping ahead." },
  { title: "Prove you understood it", description: "A grounded quiz, then the explain-back check, before a stage counts." },
  { title: "Track real mastery", description: "Per-skill mastery, growth over time, and weak topics worth revisiting." },
];

export default function LandingPage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100dvh", background: "var(--bg-app)" }}>
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 30,
          display: "flex",
          alignItems: "center",
          gap: 16,
          height: "var(--topbar-h)",
          padding: "0 24px",
          background: "var(--bg-app)",
          borderBottom: "1px solid var(--border-subtle)",
        }}
      >
        <span style={{ fontSize: "var(--text-subtitle)", fontWeight: "var(--weight-bold)", letterSpacing: "var(--tracking-tight)", color: "var(--text-primary)" }}>
          SkillFlow
        </span>
        <nav className="hidden sm:flex" style={{ alignItems: "center", gap: 24, marginLeft: 32 }}>
          <a href="#features" style={{ fontSize: "var(--text-sm)", color: "var(--text-secondary)" }}>Features</a>
          <a href="#how-it-works" style={{ fontSize: "var(--text-sm)", color: "var(--text-secondary)" }}>How it works</a>
        </nav>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12 }}>
          <LinkButton href="/login" variant="outline" size="sm">Log in</LinkButton>
          <LinkButton href="/signup" variant="gradient" size="sm">Get Started</LinkButton>
        </div>
      </header>

      <main style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {/* Hero */}
        <section
          aria-labelledby="hero-heading"
          style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24, padding: "88px 24px 72px", textAlign: "center" }}
        >
          <h1
            id="hero-heading"
            style={{
              margin: 0,
              maxWidth: 780,
              fontSize: "var(--text-display)",
              lineHeight: "var(--text-display-lh)",
              fontWeight: "var(--weight-bold)",
              letterSpacing: "var(--tracking-tight)",
              color: "var(--text-primary)",
              textWrap: "balance",
            }}
          >
            Learn it well enough to explain it.
          </h1>
          <p style={{ margin: 0, maxWidth: 620, fontSize: "var(--text-subtitle)", lineHeight: "var(--text-subtitle-lh)", color: "var(--text-muted)", textWrap: "pretty" }}>
            SkillFlow is a mastery platform for three skills — Full-Stack Web Development, Art &amp; Painting, and Content Creation —
            built around structured roadmaps, grounded quizzes, and an explain-back check that verifies real understanding before you move on.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 12, marginTop: 8 }}>
            <LinkButton href="/signup" variant="gradient" size="xl">Get Started</LinkButton>
            <LinkButton href="#how-it-works" variant="outline" size="xl">See how it works</LinkButton>
          </div>
        </section>

        {/* Feature grid */}
        <section aria-labelledby="features-heading" id="features" style={{ padding: "48px 24px 88px" }}>
          <div style={{ maxWidth: "var(--content-max)", margin: "0 auto" }}>
            <h2 id="features-heading" style={{ margin: "0 0 32px", fontSize: "var(--text-title)", lineHeight: "var(--text-title-lh)", fontWeight: "var(--weight-bold)", color: "var(--text-primary)", textAlign: "center" }}>
              What makes it different
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 20 }}>
              {FEATURES.map((f) => (
                <GlassCard
                  key={f.title}
                  tint={f.emphasis ? "accent" : "neutral"}
                  style={{
                    padding: 28,
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                    gridColumn: f.emphasis ? "span 2" : undefined,
                    border: f.emphasis ? "1px solid var(--border-accent)" : undefined,
                  }}
                >
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: 40,
                      height: 40,
                      borderRadius: "var(--radius-btn)",
                      background: f.emphasis ? "var(--gradient-brand)" : "var(--accent-quiet)",
                    }}
                  >
                    <Icon name={f.icon} size={19} color={f.emphasis ? "#fff" : "var(--accent)"} />
                  </span>
                  <h3 style={{ margin: 0, fontSize: "var(--text-subtitle)", fontWeight: "var(--weight-bold)", color: "var(--text-primary)" }}>{f.title}</h3>
                  <p style={{ margin: 0, fontSize: "var(--text-sm)", lineHeight: 1.6, color: "var(--text-muted)", textWrap: "pretty" }}>{f.description}</p>
                </GlassCard>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section aria-labelledby="how-it-works-heading" id="how-it-works" style={{ padding: "48px 24px 88px", background: "var(--bg-sunken)" }}>
          <div style={{ maxWidth: "var(--content-max)", margin: "0 auto" }}>
            <h2 id="how-it-works-heading" style={{ margin: "0 0 32px", fontSize: "var(--text-title)", lineHeight: "var(--text-title-lh)", fontWeight: "var(--weight-bold)", color: "var(--text-primary)", textAlign: "center" }}>
              How it works
            </h2>
            <ol style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 24 }}>
              {STEPS.map((step, i) => (
                <li key={step.title} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: 36,
                      height: 36,
                      borderRadius: "var(--radius-full)",
                      background: "var(--surface-card)",
                      border: "1px solid var(--border-accent)",
                      fontSize: "var(--text-sm)",
                      fontWeight: "var(--weight-bold)",
                      color: "var(--text-accent)",
                    }}
                  >
                    {i + 1}
                  </span>
                  <h3 style={{ margin: 0, fontSize: "var(--text-subtitle)", fontWeight: "var(--weight-semibold)", color: "var(--text-primary)" }}>{step.title}</h3>
                  <p style={{ margin: 0, fontSize: "var(--text-sm)", lineHeight: 1.6, color: "var(--text-muted)", textWrap: "pretty" }}>{step.description}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Final CTA */}
        <section aria-labelledby="cta-heading" style={{ padding: "72px 24px" }}>
          <div
            style={{
              maxWidth: "var(--content-max)",
              margin: "0 auto",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 20,
              padding: "56px 24px",
              borderRadius: "var(--radius-card-xl)",
              textAlign: "center",
              backgroundImage: "var(--gradient-brand)",
            }}
          >
            <h2 id="cta-heading" style={{ margin: 0, maxWidth: 560, fontSize: "var(--text-title)", lineHeight: "var(--text-title-lh)", fontWeight: "var(--weight-bold)", color: "#fff", textWrap: "balance" }}>
              Start with one skill. Prove you understood the first stage.
            </h2>
            <LinkButton href="/signup" variant="outline" size="xl" className="sf-cta-on-gradient">Get Started</LinkButton>
          </div>
        </section>
      </main>

      <footer style={{ padding: "24px", textAlign: "center", borderTop: "1px solid var(--border-subtle)" }}>
        <p style={{ margin: 0, fontSize: "var(--text-xs)", color: "var(--text-faint)" }}>© {new Date().getFullYear()} SkillFlow</p>
      </footer>
    </div>
  );
}
