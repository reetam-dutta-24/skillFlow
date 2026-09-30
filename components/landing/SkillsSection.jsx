import { SkillImage } from "@/components/core/SkillImage";
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
    <GlassCard className={muted ? "sf-skill-card is-soon" : "sf-skill-card"} style={{ height: "100%", padding: 0 }}>
      <div className="sf-skill-media" aria-hidden="true">
        <SkillImage src={skill.image} alt="" fill sizes="(min-width: 960px) 30vw, 100vw" />
      </div>
      <div className="sf-skill-vignette" aria-hidden="true" />
      <div className="sf-skill-copy">
        <div className="sf-skill-head">
          <h3 className="sf-step-title">{skill.title}</h3>
          <Chip tone={skill.available ? "pass" : "lock"}>{skill.available ? "Available" : "Coming soon"}</Chip>
        </div>
        {skill.body ? <p className="sf-step-body">{skill.body}</p> : null}
      </div>
    </GlassCard>
  );
}
