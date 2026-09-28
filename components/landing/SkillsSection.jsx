import { Chip } from "../core/Chip.jsx";
import { GlassCard } from "../core/GlassCard.jsx";
import { SectionHeader } from "../core/SectionHeader.jsx";

/** Flagship skills, plus later niches. Available means a roadmap is seeded. */
export function SkillsSection({ title, skills, upcoming }) {
  return (
    <section id="skills" className="sf-section sf-band-raise" aria-labelledby="landing-skills-title">
      <SectionHeader
        align="center"
        className="sf-section-head"
        title={title}
        titleId="landing-skills-title"
        titleSize="var(--text-section)"
      />
      <ul className="sf-skill-cards">
        {skills.map((skill) => (
          <li key={skill.title}>
            <SkillCard skill={skill} />
          </li>
        ))}
      </ul>
      <ul className="sf-skill-cards sf-skill-soon">
        {upcoming.map((skill) => (
          <li key={skill.title}>
            <SkillCard skill={skill} muted />
          </li>
        ))}
      </ul>
    </section>
  );
}

function SkillCard({ skill, muted = false }) {
  return (
    <GlassCard style={{ height: "100%", padding: "var(--space-8)", opacity: muted ? 0.55 : 1 }}>
      <div className="sf-skill-head">
        <h3 className="sf-step-title">{skill.title}</h3>
        <Chip tone={skill.available ? "pass" : "lock"}>{skill.available ? "Available" : "Coming soon"}</Chip>
      </div>
      {skill.body ? <p className="sf-step-body">{skill.body}</p> : null}
    </GlassCard>
  );
}
