import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Button } from "@/components/core/Button.jsx";
import { Chip } from "@/components/core/Chip.jsx";
import { EmptyState } from "@/components/feedback/EmptyState.jsx";
import { auth } from "@/lib/auth";
import { CONTRIBUTION_TYPES, contributionTypeLabel, disclosureLabel, formatWhen, linkStatusLabel, linkStatusTone } from "@/lib/community-copy";
import { loadReviewQueue, reviewAccess, reviewNiches } from "@/lib/data/community-review";
import { DoneNote } from "../_components/DoneNote";

export const metadata: Metadata = { title: "Review · Open Source" };

function one(value: string | string[] | undefined) {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

function pageHref(options: { niche: string; type: string; cursor?: string }) {
  const params = new URLSearchParams();
  if (options.niche) params.set("niche", options.niche);
  if (options.type) params.set("type", options.type);
  if (options.cursor) params.set("cursor", options.cursor);
  const text = params.toString();
  return text ? `/open-source/review?${text}` : "/open-source/review";
}

export default async function ReviewQueuePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const access = await reviewAccess(session.user.id);
  if (!access) notFound();

  const query = await searchParams;
  const niches = await reviewNiches(access);
  const niche = niches.find((item) => item.slug === one(query.niche)) ?? null;
  const type = CONTRIBUTION_TYPES.some((item) => item.id === one(query.type)) ? one(query.type) : "";
  const queue = await loadReviewQueue(access, { skillId: niche?.id ?? "", type, cursor: one(query.cursor) });

  return (
    <div className="sf-dash">
      <header className="sf-page-head">
        <p>
          <Link className="sf-roadmap-link" href="/open-source">
            Open Source
          </Link>
        </p>
        <h1>Review</h1>
        <p>Open contributions in the niches you review, oldest first. Your own contributions are not listed.</p>
      </header>

      <DoneNote done={one(query.done)} />

      <form className="sf-community-filters" method="get" action="/open-source/review">
        <label>
          Niche
          <select name="niche" defaultValue={niche?.slug ?? ""}>
            <option value="">Every niche you review</option>
            {niches.map((item) => (
              <option key={item.id} value={item.slug}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Type
          <select name="type" defaultValue={type}>
            <option value="">Any</option>
            {CONTRIBUTION_TYPES.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <div>
          <Button type="submit" size="sm" variant="outline">
            Show
          </Button>
        </div>
      </form>

      {queue.items.length === 0 ? (
        <EmptyState
          icon="inbox"
          title="Nothing waiting for review."
          description={niche || type ? "Clear the filters to see every niche you review." : "New contributions in your niches land here."}
          action={
            niche || type ? (
              <Link className="sf-community-text-link" href="/open-source/review">
                Clear filters
              </Link>
            ) : undefined
          }
        />
      ) : (
        <ul className="sf-os-feed-list" aria-label="Contributions waiting for review">
          {queue.items.map((item) => {
            const disclosure = disclosureLabel(item.disclosure);
            return (
              <li key={item.id}>
                <Link className="sf-community-card sf-os-review-row" href={`/open-source/review/${item.id}`}>
                  <span className="sf-community-chips">
                    <Chip tone="accent">{item.skill.name}</Chip>
                    <Chip tone="neutral">{contributionTypeLabel(item.type)}</Chip>
                    {item.revision > 1 ? <Chip tone="warn">Resubmitted</Chip> : null}
                    <Chip tone={linkStatusTone(item.linkStatus)}>{linkStatusLabel(item.linkStatus)}</Chip>
                    {disclosure ? <Chip tone={item.disclosure === "AFFILIATE_OR_SPONSORED" ? "warn" : "accent"}>{disclosure}</Chip> : null}
                  </span>
                  <h3>{item.title}</h3>
                  <p>
                    {item.author} · Submitted <time dateTime={item.createdAt}>{formatWhen(item.createdAt)}</time>
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      {queue.nextCursor ? (
        <p className="sf-community-next">
          <Link className="sf-community-text-link" href={pageHref({ niche: niche?.slug ?? "", type, cursor: queue.nextCursor })}>
            Next contributions
          </Link>
        </p>
      ) : null}
    </div>
  );
}
