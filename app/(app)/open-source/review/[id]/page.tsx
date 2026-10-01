import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Chip } from "@/components/core/Chip.jsx";
import { auth } from "@/lib/auth";
import {
  contributionStatusLabel,
  formatWhen,
  linkStatusLabel,
  linkStatusTone,
  reviewEventLabel,
  reviewReasonLabel,
} from "@/lib/community-copy";
import { loadReviewItem, reviewAccess } from "@/lib/data/community-review";
import { ContributionBody } from "../../_components/ContributionBody";
import { ReviewForm, type Decision } from "../../_components/ReviewForm";
import { UnmergeForm } from "../../_components/UnmergeForm";
import { DoneNote } from "../../_components/DoneNote";

export const metadata: Metadata = { title: "Review · Open Source" };

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const ALLOWED: Record<string, Decision[]> = {
  OPEN: ["APPROVE", "REQUEST_CHANGES", "CLOSE"],
  CHANGES_REQUESTED: ["CLOSE"],
};

function one(value: string | string[] | undefined) {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

export default async function ReviewItemPage({ params, searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const access = await reviewAccess(session.user.id);
  if (!access) notFound();

  const { id } = await params;
  const row = await loadReviewItem(access, id);
  if (!row) notFound();

  const query = await searchParams;
  const allowed = ALLOWED[row.status] ?? [];
  const contributionHref = `/open-source/${row.skill.slug}/c/${row.id}`;
  const { links, titles, official } = row.duplicates;
  const hasDuplicates = links.length + titles.length + official.length > 0;

  return (
    <div className="sf-dash">
      <header className="sf-page-head">
        <p>
          <Link className="sf-roadmap-link" href="/open-source/review">
            Review queue
          </Link>
        </p>
        <h1>{row.title}</h1>
        <p>
          {row.skill.name} · Submitted <time dateTime={row.createdAt.toISOString()}>{formatWhen(row.createdAt.toISOString())}</time>
        </p>
      </header>

      <DoneNote done={one(query.done)} next />

      <div className="sf-community-detail">
        <ContributionBody row={row} />

        <aside className="sf-community-side" aria-label="About this contribution">
          <h2>Author</h2>
          <p>{row.author?.name ?? "Former member"}</p>
          {row.record ? (
            <p>
              {row.record.merged} merged · {row.record.closed} closed in {row.skill.name}
            </p>
          ) : null}

          <h2>Revision</h2>
          <p className="sf-community-chips">
            <Chip tone="neutral">Revision {row.revision}</Chip>
            {row.revision > 1 ? <Chip tone="warn">Resubmitted</Chip> : null}
          </p>

          <h2>Link check</h2>
          <p className="sf-community-chips">
            <Chip tone={linkStatusTone(row.linkStatus)}>{linkStatusLabel(row.linkStatus)}</Chip>
          </p>
          {row.linkCheckedAt ? (
            <p>
              Checked <time dateTime={row.linkCheckedAt.toISOString()}>{formatWhen(row.linkCheckedAt.toISOString())}</time>
            </p>
          ) : null}

          {row.gap ? (
            <>
              <h2>Gap it addresses</h2>
              <p>
                {row.gap.title} · {row.gap.status === "OPEN" ? "Open" : row.gap.status === "RESOLVED" ? "Resolved" : "Closed"}
              </p>
            </>
          ) : null}

          <Link className="sf-community-text-link" href={contributionHref}>
            Open the contribution page
          </Link>
        </aside>
      </div>

      <section className="sf-community-reviews" aria-labelledby="review-duplicates">
        <h2 id="review-duplicates">Possible duplicates</h2>
        {hasDuplicates ? (
          <ul>
            {official.map((resource) => (
              <li key={`official-${resource.id}`}>
                <Chip tone="warn">Already in the official roadmap</Chip>
                <span>
                  Stage {resource.stage.order}: {resource.stage.title} · {resource.title}
                </span>
              </li>
            ))}
            {links.map((item) => (
              <li key={`link-${item.id}`}>
                <Chip tone="neutral">Same link</Chip>
                <Link className="sf-community-text-link" href={`/open-source/${row.skill.slug}/c/${item.id}`}>
                  {item.title}
                </Link>
                <span>
                  {contributionStatusLabel(item.status)} · {item.author?.name ?? "Former member"}
                </span>
              </li>
            ))}
            {titles.map((item) => (
              <li key={`title-${item.id}`}>
                <Chip tone="neutral">Same title</Chip>
                <Link className="sf-community-text-link" href={`/open-source/${row.skill.slug}/c/${item.id}`}>
                  {item.title}
                </Link>
                <span>
                  {contributionStatusLabel(item.status)} · {item.author?.name ?? "Former member"}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p>No other contribution or official resource in this niche shares its link or title.</p>
        )}
      </section>

      <section className="sf-community-reviews" aria-labelledby="review-history">
        <h2 id="review-history">Earlier reviews</h2>
        {row.reviews.length > 0 ? (
          <ul>
            {row.reviews.map((review) => (
              <li key={review.id}>
                <p>
                  {reviewEventLabel(review.decision, review.unmerge)}
                  {review.reason ? ` · ${reviewReasonLabel(review.reason)}` : ""} · Revision {review.revision} ·{" "}
                  {review.reviewer?.name ?? "Former reviewer"}
                </p>
                {review.feedback ? <p>{review.feedback}</p> : null}
                <time dateTime={review.createdAt.toISOString()}>{formatWhen(review.createdAt.toISOString())}</time>
              </li>
            ))}
          </ul>
        ) : (
          <p>This is the first review.</p>
        )}
      </section>

      <section className="sf-community-reviews" aria-labelledby="review-decision">
        <h2 id="review-decision">Your decision</h2>
        {row.isOwn ? (
          <p>You can&apos;t review your own contribution.</p>
        ) : row.status === "MERGED" && row.canModerate ? (
          <>
            <p>This contribution is merged. As a maintainer you can unmerge it.</p>
            <UnmergeForm contributionId={row.id} />
          </>
        ) : allowed.length === 0 ? (
          <p>This contribution is {contributionStatusLabel(row.status).toLowerCase()}. There is nothing to decide.</p>
        ) : (
          <ReviewForm key={`${row.id}-${row.revision}`} contributionId={row.id} revision={row.revision} allowed={allowed} />
        )}
      </section>
    </div>
  );
}
