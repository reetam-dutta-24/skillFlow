import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { PersonAvatar } from "@/components/community/PersonAvatar";
import { COMMUNITY_LABEL, formatWhen, reviewEventLabel, reviewReasonLabel } from "@/lib/community-copy";
import { loadPublishedContribution, type PublishedPost } from "@/lib/data/community";
import { communityActor } from "@/lib/services/community/actor";
import { getContribution } from "@/lib/services/community/contributions";
import { canModerate, canReview } from "@/lib/services/community/permissions";
import { listPostQuestions } from "@/lib/services/community/questions";
import { ContributionBody } from "../../../_components/ContributionBody";
import { DoneNote } from "../../../_components/DoneNote";
import { PostQuestions } from "../../../_components/PostQuestions";
import { UnmergeForm } from "../../../_components/UnmergeForm";

type PageProps = {
  params: Promise<{ skillSlug: string; id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

type PostView = Omit<PublishedPost, "status"> & { status: string };

function waitingPost(row: NonNullable<Awaited<ReturnType<typeof getContribution>>>): PostView {
  return {
    id: row.id,
    type: row.type,
    status: row.status,
    title: row.title,
    summary: row.summary,
    body: row.body,
    imageUrl: row.imageUrl,
    sources: row.sources,
    steps: row.steps,
    tags: row.tags,
    disclosure: row.disclosure,
    linkStatus: row.linkStatus,
    createdAt: row.createdAt.toISOString(),
    mergedAt: row.mergedAt?.toISOString() ?? null,
    author: row.author,
    skill: { id: row.skill.id, slug: row.skill.slug, name: row.skill.name },
    stage: row.stage ? { order: row.stage.order, title: row.stage.title } : null,
    reviews: row.reviews.map((review) => ({
      id: review.id,
      decision: review.decision,
      reason: review.reason,
      feedback: review.feedback,
      unmerge: review.unmerge,
      createdAt: review.createdAt.toISOString(),
      reviewer: review.reviewer ? { name: review.reviewer.name } : null,
    })),
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const published = await loadPublishedContribution(id);
  if (published) return { title: `${published.title} · Open Source` };
  const row = await getContribution(id);
  return { title: row ? `${row.title} · Open Source` : "Open Source" };
}

export default async function ContributionPage({ params, searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { skillSlug, id } = await params;
  const published = await loadPublishedContribution(id);
  const waiting = published ? null : await getContribution(id);
  const row: PostView | null = published ?? (waiting ? waitingPost(waiting) : null);
  if (!row || row.skill.slug !== skillSlug) notFound();

  const actor = await communityActor(session.user.id);
  const isAuthor = row.author?.id === session.user.id;
  const reviewer = actor ? canReview(actor, row.skill.id) : false;
  if (row.status !== "MERGED" && !isAuthor && !reviewer) notFound();

  const questions = row.status === "MERGED" ? await listPostQuestions(row.id) : [];
  const asked = questions.some((question) => question.author.id === session.user.id);
  const showReviews = (isAuthor || reviewer) && row.reviews.length > 0;
  // Per person: only maintainers of this niche and admins see Unmerge.
  const moderator = actor ? canModerate(actor, row.skill.id) : false;
  const done = (await searchParams).done;

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

      <DoneNote done={typeof done === "string" ? done : ""} />

      <div className="sf-community-detail">
        <ContributionBody row={row} />

        <aside className="sf-community-side">
          <h2>Created by</h2>
          {row.author ? (
            <Link className="sf-os-person-link" href={`/profile/${row.author.id}`}>
              <PersonAvatar name={row.author.name} image={row.author.image} />
            </Link>
          ) : (
            <p>Former member</p>
          )}
          <p>
            <time dateTime={row.createdAt}>{formatWhen(row.createdAt)}</time>
          </p>
          {row.mergedAt ? (
            <p>
              Published <time dateTime={row.mergedAt}>{formatWhen(row.mergedAt)}</time>
            </p>
          ) : null}
          <p>{row.skill.name}</p>
          {row.status !== "MERGED" ? <p>This stays hidden until a moderator publishes it.</p> : null}
          {row.status === "OPEN" && reviewer && !isAuthor ? (
            <Link className="sf-community-text-link" href={`/open-source/review/${row.id}`}>
              Review this contribution
            </Link>
          ) : null}
          {isAuthor ? (
            <Link className="sf-community-text-link" href={`/open-source/me/${row.id}`}>
              Manage in My contributions
            </Link>
          ) : null}
        </aside>
      </div>

      {row.status === "MERGED" && moderator ? (
        <section className="sf-community-reviews" aria-labelledby="community-moderate">
          <h2 id="community-moderate">Moderation</h2>
          <p>Hiding takes this post off the public list.</p>
          <UnmergeForm contributionId={row.id} />
        </section>
      ) : null}

      {row.status === "MERGED" ? (
        <PostQuestions contributionId={row.id} isAuthor={isAuthor} canAsk={!isAuthor && !asked} questions={questions} />
      ) : null}

      {showReviews ? (
        <section className="sf-community-reviews" aria-labelledby="community-reviews">
          <h2 id="community-reviews">Reviews</h2>
          <ul>
            {row.reviews.map((review) => (
              <li key={review.id}>
                <p>
                  {review.reviewer?.name ?? "Former reviewer"} · {reviewEventLabel(review.decision, review.unmerge)}
                  {review.reason ? ` · ${reviewReasonLabel(review.reason)}` : ""}
                </p>
                {review.feedback ? <p>{review.feedback}</p> : null}
                <time dateTime={review.createdAt}>{formatWhen(review.createdAt)}</time>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
