import { GlassCard } from "../core/GlassCard.jsx";
import { SectionHeader } from "../core/SectionHeader.jsx";

/** What SkillFlow is for, and the three skills that have a finished scope. */
export function AboutSection({ title, subtitle, body, skills }) {
  return (
    <section id="about" className="sf-section sf-band-base" aria-labelledby="landing-about-title">
      <SectionHeader align="center" className="sf-section-head" title={title} subtitle={subtitle} titleId="landing-about-title" titleSize="var(--text-section)" subtitleSize="var(--text-section-sub)" />
      <p className="sf-about-body">{body}</p>
      <ul className="sf-about-skills">
        {skills.map((skill) => (
          <li key={skill.title}>
            <GlassCard tint="accent" style={{ height: "100%", padding: "var(--space-8)" }}>
              <h3 className="sf-step-title">{skill.title}</h3>
              <p className="sf-step-body">{skill.body}</p>
            </GlassCard>
          </li>
        ))}
      </ul>
    </section>
  );
}
