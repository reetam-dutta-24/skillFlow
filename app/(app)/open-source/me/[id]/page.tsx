import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Chip } from "@/components/core/Chip.jsx";
import { auth } from "@/lib/auth";
import {
  contributionStatusLabel,
  contributionStatusTone,
  formatWhen,
  linkStatusLabel,
  reviewEventLabel,
  reviewReasonSentence,
} from "@/lib/community-copy";
import { loadMyContribution } from "@/lib/data/community-me";
import { ContributionBody } from "../../_components/ContributionBody";
import { DoneNote } from "../../_components/DoneNote";
import { OwnerActions } from "../../_components/OwnerActions";

export const metadata: Metadata = { title: "My contribution · Open Source" };

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function one(value: string | string[] | undefined) {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

const STATUS_NOTE: Record<string, string> = {
  OPEN: "Waiting for a reviewer. Only you and the niche's reviewers can see it.",
  CHANGES_REQUESTED: "A reviewer asked for changes. Edit it and it goes back to the queue.",
  MERGED: "Public in the niche.",
  CLOSED: "Closed. It is no longer reviewed and is not public.",
};

export default async function MyContributionPage({ params, searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;
  const row = await loadMyContribution(session.user.id, id);
  if (!row) notFound();
  const query = await searchParams;

  return (
    <div className="sf-dash">
      <header className="sf-page-head">
        <p>
          <Link className="sf-roadmap-link" href="/open-source/me">
            My contributions
          </Link>
        </p>
        <h1>{row.title}</h1>
        <p className="sf-community-chips">
          <Chip tone="accent">{row.skill.name}</Chip>
          <Chip tone={contributionStatusTone(row.status)}>{contributionStatusLabel(row.status)}</Chip>
          <Chip tone="neutral">Revision {row.revision}</Chip>
        </p>
        <p>{STATUS_NOTE[row.status]}</p>
        <OwnerActions contributionId={row.id} status={row.status} />
      </header>

      <DoneNote done={one(query.saved)} />

      <div className="sf-community-detail">
        <ContributionBody row={row} />
        <aside className="sf-community-side" aria-label="About this contribution">
          <h2>Dates</h2>
          <p>
            Shared <time dateTime={row.createdAt.toISOString()}>{formatWhen(row.createdAt.toISOString())}</time>
          </p>
          <p>
            Updated <time dateTime={row.updatedAt.toISOString()}>{formatWhen(row.updatedAt.toISOString())}</time>
          </p>
          <h2>Links</h2>
          <p>{linkStatusLabel(row.linkStatus)}</p>
          {row.gap ? (
            <>
              <h2>Gap it addresses</h2>
              <p>{row.gap.title}</p>
            </>
          ) : null}
          {row.status === "MERGED" ? (
            <Link className="sf-community-text-link" href={`/open-source/${row.skill.slug}/c/${row.id}`}>
              Open the public page
            </Link>
          ) : null}
          <Link className="sf-community-text-link" href="/open-source/me">
            My contributions
          </Link>
        </aside>
      </div>

      <section className="sf-community-reviews" aria-labelledby="my-review-history">
        <h2 id="my-review-history">Review history</h2>
        {row.reviews.length === 0 ? (
          <p>No review yet.</p>
        ) : (
          <ol className="sf-os-history">
            {row.reviews.map((review) => (
              <li key={review.id}>
                <p className="sf-community-chips">
                  <Chip tone={review.decision === "APPROVE" ? "pass" : review.decision === "REQUEST_CHANGES" ? "warn" : "fail"}>
                    {reviewEventLabel(review.decision, review.unmerge)}
                  </Chip>
                  <Chip tone="neutral">Revision {review.revision}</Chip>
                </p>
                {review.reason ? <p>{reviewReasonSentence(review.reason)}</p> : null}
                {review.feedback ? <blockquote>{review.feedback}</blockquote> : null}
                <p className="sf-os-hint">
                  {review.reviewer?.name ?? "A former reviewer"} ·{" "}
                  <time dateTime={review.createdAt.toISOString()}>{formatWhen(review.createdAt.toISOString())}</time>
                </p>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
