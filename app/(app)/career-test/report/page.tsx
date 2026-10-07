import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SkillImage } from "@/components/core/SkillImage";
import { auth } from "@/lib/auth";
import type { Area, Domain } from "@/lib/career/items";
import { AREAS, AREA_ORDER, DOMAINS, DOMAIN_ORDER, FACETS, SOURCES } from "@/lib/career/meta";
import type { Band, Scale } from "@/lib/career/score";
import { loadCareerState } from "@/lib/data/career";
import { prisma } from "@/lib/prisma";
import { ReportActions } from "./_components/ReportActions";

export const metadata: Metadata = { title: "Career-fit report", robots: { index: false, follow: false } };

const BAND_LABEL: Record<Band, string> = { low: "Low", average: "Middle", high: "High" };

export default function CareerReportPage() {
  return (
    <Suspense fallback={<p className="sf-review-live">Loading your report</p>}>
      <ReportContent />
    </Suspense>
  );
}

/** Personal: the report is read on the request and is never cached for anyone else. */
async function ReportContent() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const state = await loadCareerState(session.user.id);
  if (state.status !== "complete") redirect("/career-test");
  const { scores, report, completedAt } = state;

  const slugs = report.paths.map((path) => path.slug);
  const skills = await prisma.skill.findMany({ where: { slug: { in: slugs } }, select: { slug: true, name: true, image: true } });
  const skillBySlug = new Map(skills.map((skill) => [skill.slug, skill]));
  const fitBySlug = new Map(scores.matches.map((match) => [match.slug, match]));
  const areasByScore = [...AREA_ORDER].sort((a, b) => scores.areas[b].raw - scores.areas[a].raw);
  const date = completedAt.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="sf-rep">
      <header className="sf-rep-head">
        <p className="sf-ct-kicker">Career-fit report</p>
        <h1>Your career-fit report</h1>
        <p className="sf-rep-date">Completed {date}</p>
        <ReportActions />
      </header>

      <section className="sf-rep-hero" aria-labelledby="rep-summary">
        <div className="sf-rep-code" aria-label={`Interest code ${scores.code.join("")}`}>
          {scores.code.map((area: Area) => (
            <span key={area} title={AREAS[area].name}>
              <strong>{area}</strong>
              <small>{AREAS[area].name}</small>
            </span>
          ))}
        </div>
        <div>
          <h2 id="rep-summary">In short</h2>
          <p>{report.summary}</p>
          <p className="sf-rep-workstyle">{report.workStyle}</p>
        </div>
      </section>

      <section className="sf-rep-section" aria-labelledby="rep-paths">
        <h2 id="rep-paths">Paths that fit you best</h2>
        <p className="sf-rep-sub">Ranked by how well each path matches your interests (80%) and traits (20%). All of them are free.</p>
        <ol className="sf-rep-paths">
          {report.paths.map((path, index) => {
            const skill = skillBySlug.get(path.slug);
            const match = fitBySlug.get(path.slug);
            return (
              <li key={path.slug} className="sf-rep-path">
                <div className="sf-rep-path-media">
                  {skill?.image ? <SkillImage src={skill.image} alt="" fill sizes="(max-width: 640px) 100vw, 260px" /> : null}
                  <span className="sf-rep-rank">#{index + 1}</span>
                </div>
                <div className="sf-rep-path-body">
                  <div className="sf-rep-path-top">
                    <h3>{skill?.name ?? path.slug}</h3>
                    <span className="sf-rep-fit">{match?.fit ?? 0}% fit</span>
                  </div>
                  <p>{path.why}</p>
                  <h4>How to approach it</h4>
                  <ol className="sf-rep-steps">
                    {path.approach.map((step) => (
                      <li key={step}>{step}</li>
                    ))}
                  </ol>
                  <p className="sf-rep-week">
                    <strong>First week:</strong> {path.firstWeek}
                  </p>
                  <Link className="sf-btn sf-btn--outline sf-btn--md" href={`/roadmap/${path.slug}`}>
                    Open the path
                  </Link>
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      <section className="sf-rep-section" aria-labelledby="rep-interests">
        <h2 id="rep-interests">Your interests</h2>
        <p className="sf-rep-sub">O*NET® Interest Profiler. Each area is scored 0–40 from how much you would like ten work activities.</p>
        <ul className="sf-rep-bars">
          {areasByScore.map((area) => (
            <Bar key={area} label={AREAS[area].name} note={AREAS[area].about} scale={scores.areas[area]} value={`${scores.areas[area].raw} / 40`} />
          ))}
        </ul>
      </section>

      <section className="sf-rep-section" aria-labelledby="rep-traits">
        <h2 id="rep-traits">Your personality traits</h2>
        <p className="sf-rep-sub">
          IPIP-NEO-120. Bars show where your answers fall on each scale, from its lowest to its highest possible score. Open a trait for its six facets.
        </p>
        <div className="sf-rep-domains">
          {DOMAIN_ORDER.map((domain: Domain) => {
            const value = scores.domains[domain];
            const facets = Object.keys(FACETS).filter((facet) => facet.startsWith(domain));
            return (
              <details key={domain} className="sf-rep-domain">
                <summary>
                  <Bar
                    as="div"
                    label={DOMAINS[domain].name}
                    note={value.band === "high" ? DOMAINS[domain].high : value.band === "low" ? DOMAINS[domain].low : "Between the two ends of this trait."}
                    scale={value}
                    value={BAND_LABEL[value.band]}
                  />
                </summary>
                <ul className="sf-rep-bars sf-rep-facets">
                  {facets.map((facet) => (
                    <Bar key={facet} label={FACETS[facet].name} note={FACETS[facet].about} scale={scores.facets[facet]} value={BAND_LABEL[scores.facets[facet].band]} small />
                  ))}
                </ul>
              </details>
            );
          })}
        </div>
      </section>

      <section className="sf-rep-two">
        <div className="sf-rep-section" aria-labelledby="rep-strengths">
          <h2 id="rep-strengths">Likely strengths</h2>
          <ul className="sf-rep-cards">
            {report.strengths.map((item) => (
              <li key={item.title}>
                <strong>{item.title}</strong>
                <p>{item.detail}</p>
              </li>
            ))}
          </ul>
        </div>
        <div className="sf-rep-section" aria-labelledby="rep-watch">
          <h2 id="rep-watch">Worth watching</h2>
          <ul className="sf-rep-cards">
            {report.watchOuts.map((item) => (
              <li key={item.title}>
                <strong>{item.title}</strong>
                <p>{item.detail}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="sf-rep-section" aria-labelledby="rep-learn">
        <h2 id="rep-learn">How you learn best</h2>
        <ul className="sf-rep-list">
          {scores.studyStyle.map((tip) => (
            <li key={tip}>{tip}</li>
          ))}
        </ul>
        <h3 className="sf-rep-h3">To keep growing</h3>
        <ul className="sf-rep-list">
          {report.growth.map((tip) => (
            <li key={tip}>{tip}</li>
          ))}
        </ul>
      </section>

      <footer className="sf-rep-about">
        <h2>About this report</h2>
        <p>{SOURCES.note}</p>
        <p>{SOURCES.ipip}</p>
        <p>{SOURCES.onet}</p>
        <p>
          Path matches use SkillFlow&apos;s own map of each path to interest areas and traits.{" "}
          {report.source === "model"
            ? "The written sections were drafted by an AI model from your scores only; it never saw your answers, name, or email."
            : "The written sections come from fixed rules applied to your scores."}
        </p>
      </footer>
    </div>
  );
}

/** One labelled bar. The value and band are text, so the bar is never the only way to read the score. */
function Bar({
  label,
  note,
  scale,
  value,
  small = false,
  as = "li",
}: {
  label: string;
  note: string;
  scale: Scale;
  value: string;
  small?: boolean;
  as?: "li" | "div";
}) {
  const Tag = as;
  return (
    <Tag className={small ? "sf-rep-bar is-small" : "sf-rep-bar"}>
      <div className="sf-rep-bar-top">
        <span className="sf-rep-bar-label">{label}</span>
        <span className="sf-rep-bar-value">{value}</span>
      </div>
      <div
        className="sf-rep-track"
        role="meter"
        aria-label={label}
        aria-valuemin={scale.min}
        aria-valuemax={scale.max}
        aria-valuenow={scale.raw}
        title={`${label}: ${scale.raw} of ${scale.max} (${scale.pct}% of the scale)`}
      >
        <span style={{ width: `${Math.max(scale.pct, 2)}%` }} />
      </div>
      <p className="sf-rep-bar-note">{note}</p>
    </Tag>
  );
}
