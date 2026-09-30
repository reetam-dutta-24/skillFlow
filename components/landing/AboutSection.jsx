import { SkillImage } from "@/components/core/SkillImage";

/** Why the project exists. Copy sits on the left; skill photos sit on the right. */
export function AboutSection({ title, body, stack, githubLabel, githubUrl, visuals }) {
  const linked = typeof githubUrl === "string" && githubUrl.startsWith("http");

  return (
    <section id="about" className="sf-section sf-band-base" aria-labelledby="landing-about-title">
      <div className="sf-about">
        <div className="sf-about-copy">
          <h2 id="landing-about-title">{title}</h2>
          <p className="sf-about-body">{body}</p>
          <p className="sf-about-stack">{stack}</p>
          {linked ? (
            <p className="sf-about-link">
              <a href={githubUrl}>{githubLabel}</a>
            </p>
          ) : (
            <p className="sf-about-link">
              {githubLabel} · {githubUrl}
            </p>
          )}
        </div>
        <ul className="sf-about-visual">
          {visuals.map((item) => (
            <li key={item.title}>
              <SkillImage src={item.image} alt="" fill sizes="(min-width: 960px) 24vw, 50vw" />
              <span className="sf-about-veil" aria-hidden="true" />
              <span className="sf-about-caption">{item.title}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
