import { SectionHeader } from "../core/SectionHeader.jsx";

/** Why the project exists. The name and GitHub address stay as placeholders until they are filled in. */
export function AboutSection({ title, body, stack, githubLabel, githubUrl }) {
  const linked = typeof githubUrl === "string" && githubUrl.startsWith("http");

  return (
    <section id="about" className="sf-section sf-band-base" aria-labelledby="landing-about-title">
      <SectionHeader
        align="center"
        className="sf-section-head"
        title={title}
        titleId="landing-about-title"
        titleSize="var(--text-section)"
      />
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
    </section>
  );
}
