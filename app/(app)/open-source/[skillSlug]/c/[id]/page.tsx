import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { COMMUNITY_LABEL, formatWhen, reviewDecisionLabel, reviewReasonLabel } from "@/lib/community-copy";
import { myUsefulMarks } from "@/lib/data/community";
import { communityActor } from "@/lib/services/community/actor";
import { getContribution } from "@/lib/services/community/contributions";
import { canReview } from "@/lib/services/community/permissions";
import { recordContributionView } from "@/lib/services/community/views";
import { ContributionBody } from "../../../_components/ContributionBody";
import { UsefulButton } from "../../../_components/UsefulButton";

type PageProps = { params: Promise<{ skillSlug: string; id: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const row = await getContribution(id);
  return { title: row ? `${row.title} · Open Source` : "Open Source" };
}

export default async function ContributionPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { skillSlug, id } = await params;
  const row = await getContribution(id);
  if (!row || row.skill.slug !== skillSlug) notFound();

  const actor = await communityActor(session.user.id);
  const isAuthor = row.author?.id === session.user.id;
  const reviewer = actor ? canReview(actor, row.skill.id) : false;
  if (row.status !== "MERGED" && !isAuthor && !reviewer) notFound();

  const view = row.status === "MERGED" ? await recordContributionView(session.user.id, row.id) : { counted: false };
  const views = row.viewCount + (view.counted ? 1 : 0);
  const marked = row.status === "MERGED" ? await myUsefulMarks(session.user.id, [row.id]) : [];
  const showReviews = (isAuthor || reviewer) && row.reviews.length > 0;

  return (
    <div className="sf-dash">
      <header className="sf-page-head">
        <p>
          <Link className="sf-roadmap-link" href={`/open-source/${row.skill.slug}`}>
            {row.skill.name}
          </Link>
        </p>
        <h1>{row.title}</h1>
        <p className="sf-community-label">{COMMUNITY_LABEL}</p>
      </header>

      <div className="sf-community-detail">
        <ContributionBody row={row} />

        <aside className="sf-community-side">
          <h2>Created by</h2>
          <p>{row.author?.name ?? "Former member"}</p>
          {row.author?.email ? <p>{row.author.email}</p> : null}
          <p>
            <time dateTime={row.createdAt.toISOString()}>{formatWhen(row.createdAt.toISOString())}</time>
          </p>
          {row.mergedAt ? (
            <p>
              Merged <time dateTime={row.mergedAt.toISOString()}>{formatWhen(row.mergedAt.toISOString())}</time>
            </p>
          ) : null}
          <p>
            {views} {views === 1 ? "view" : "views"}
          </p>
          <p>{row.skill.name}</p>
          {row.status === "MERGED" && !isAuthor ? (
            <UsefulButton contributionId={row.id} initialCount={row.usefulCount} marked={marked.includes(row.id)} />
          ) : (
            <p>
              Found useful by {row.usefulCount} {row.usefulCount === 1 ? "learner" : "learners"}
            </p>
          )}
          {row.status !== "MERGED" ? <p>This stays hidden until it is merged.</p> : null}
          {row.status === "OPEN" && reviewer && !isAuthor ? (
            <Link className="sf-community-text-link" href={`/open-source/review/${row.id}`}>
              Review this contribution
            </Link>
          ) : null}
        </aside>
      </div>

      {showReviews ? (
        <section className="sf-community-reviews" aria-labelledby="community-reviews">
          <h2 id="community-reviews">Reviews</h2>
          <ul>
            {row.reviews.map((review) => (
              <li key={review.id}>
                <p>
                  {review.reviewer?.name ?? "Former reviewer"} · {reviewDecisionLabel(review.decision)}
                  {review.reason ? ` · ${reviewReasonLabel(review.reason)}` : ""}
                </p>
                {review.feedback ? <p>{review.feedback}</p> : null}
                <time dateTime={review.createdAt.toISOString()}>{formatWhen(review.createdAt.toISOString())}</time>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
