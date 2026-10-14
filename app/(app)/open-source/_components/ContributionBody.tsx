import { Chip } from "@/components/core/Chip.jsx";
import { contributionStatusLabel, contributionTypeLabel, disclosureLabel } from "@/lib/community-copy";
import { CommunityMarkdown } from "./CommunityMarkdown";
import { Icon } from "@/components/core/Icon.jsx";

function hostOf(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "Link";
  }
}

export type ContributionBodyData = {
  type: string;
  status: string;
  summary: string;
  body: string | null;
  imageUrl: string | null;
  sources: string[];
  steps: unknown;
  tags: string[];
  disclosure: string;
  linkStatus: string;
  stage: { order: number } | null;
};

function learningSteps(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.flatMap((step) => {
    if (!step || typeof step !== "object") return [];
    const row = step as { title?: unknown; url?: unknown; note?: unknown };
    if (typeof row.title !== "string" || !row.title.trim()) return [];
    return [
      {
        title: row.title,
        url: typeof row.url === "string" && row.url ? row.url : null,
        note: typeof row.note === "string" && row.note ? row.note : null,
      },
    ];
  });
}

/** The contribution itself: chips, image, text, steps, and sources. The detail page and the review page share it. */
export function ContributionBody({ row }: { row: ContributionBodyData }) {
  const disclosure = disclosureLabel(row.disclosure);
  const steps = learningSteps(row.steps);

  return (
    <article className="sf-community-body">
      <span className="sf-community-chips">
        <Chip tone="neutral">{contributionTypeLabel(row.type)}</Chip>
        <Chip tone="neutral">{contributionStatusLabel(row.status)}</Chip>
        {row.stage ? <Chip tone="neutral">Relevant to Stage {row.stage.order}</Chip> : null}
        {disclosure ? <Chip tone={row.disclosure === "AFFILIATE_OR_SPONSORED" ? "warn" : "accent"}>{disclosure}</Chip> : null}
        {row.tags.map((tag) => (
          <Chip key={tag} tone="neutral">
            {tag}
          </Chip>
        ))}
      </span>
      {/* A contribution image can be an upload or any https link, so the browser loads it directly. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {row.imageUrl ? <img className="sf-community-photo" src={row.imageUrl} alt="" decoding="async" /> : null}
      {row.body ? <CommunityMarkdown text={row.body} /> : <p>{row.summary}</p>}
      {steps.length > 0 ? (
        <ol className="sf-community-steps">
          {steps.map((step) => (
            <li key={step.title}>
              <strong>{step.title}</strong>
              {step.note ? <p>{step.note}</p> : null}
              {step.url ? (
                <a href={step.url} rel="nofollow ugc noopener noreferrer" target="_blank">
                  {step.url}
                </a>
              ) : null}
            </li>
          ))}
        </ol>
      ) : null}
      {row.sources.length > 0 ? (
        <section className="sf-ossources">
          <h2>Sources</h2>
          <ul>
            {row.sources.map((source) => (
              <li key={source}>
                <a href={source} rel="nofollow ugc noopener noreferrer" target="_blank">
                  <span className="sf-ossources-icon" aria-hidden="true">
                    <Icon name="link" size={15} />
                  </span>
                  <span className="sf-ossources-copy">
                    <strong>{hostOf(source)}</strong>
                    <span>{source}</span>
                  </span>
                  <Icon name="external-link" size={14} />
                  <span className="sf-sr"> (opens in a new tab)</span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {row.linkStatus === "UNREACHABLE" ? <p>A source could not be reached when this was saved.</p> : null}
    </article>
  );
}
