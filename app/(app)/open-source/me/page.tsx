import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Chip } from "@/components/core/Chip.jsx";
import { EmptyState } from "@/components/feedback/EmptyState.jsx";
import { auth } from "@/lib/auth";
import { CONTRIBUTION_STATUSES, contributionStatusLabel, contributionStatusTone, contributionTypeLabel, formatWhen } from "@/lib/community-copy";
import { loadMyContributions, myAttentionCount } from "@/lib/data/community-me";

export const metadata: Metadata = { title: "My contributions · Open Source" };

const FILTERS = [{ id: "", label: "All" }, ...CONTRIBUTION_STATUSES];

function one(value: string | string[] | undefined) {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

function pageHref(status: string, cursor?: string) {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  if (cursor) params.set("cursor", cursor);
  const text = params.toString();
  return text ? `/open-source/me?${text}` : "/open-source/me";
}

export default async function MyContributionsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const query = await searchParams;
  const status = FILTERS.some((item) => item.id === one(query.status)) ? one(query.status) : "";
  const [attention, page] = await Promise.all([
    myAttentionCount(session.user.id),
    loadMyContributions(session.user.id, { status, cursor: one(query.cursor) }),
  ]);

  return (
    <div className="sf-dash">
      <header className="sf-page-head">
        <p>
          <Link className="sf-roadmap-link" href="/open-source">
            Open Source
          </Link>
        </p>
        <h1>My contributions</h1>
        <p>
          Everything you have shared, public or not.
          {attention > 0 ? (
            <>
              {" "}
              <Link className="sf-community-text-link" href={pageHref("CHANGES_REQUESTED")}>
                {attention} {attention === 1 ? "needs" : "need"} your attention
              </Link>
            </>
          ) : null}
        </p>
      </header>

      <nav className="sf-community-tabs" aria-label="Filter by status">
        {FILTERS.map((item) => (
          <Link key={item.id || "all"} href={pageHref(item.id)} aria-current={status === item.id ? "page" : undefined}>
            {item.label}
            {item.id === "CHANGES_REQUESTED" && attention > 0 ? ` (${attention})` : ""}
          </Link>
        ))}
      </nav>

      {page.items.length === 0 ? (
        <EmptyState
          icon="git-pull-request"
          title={status ? `Nothing ${contributionStatusLabel(status).toLowerCase()}` : "You have not contributed yet"}
          description="Share a resource, a concept note, a learning path, or someone to follow in a niche you know."
          action={
            <Link className="sf-community-text-link" href="/open-source">
              Go to Open Source
            </Link>
          }
        />
      ) : (
        <ul className="sf-os-feed-list" aria-label="Your contributions">
          {page.items.map((item) => (
            <li key={item.id}>
              <article className="sf-community-card sf-os-mine-row">
                <span className="sf-community-chips">
                  <Chip tone="accent">{item.skill.name}</Chip>
                  <Chip tone="neutral">{contributionTypeLabel(item.type)}</Chip>
                  <Chip tone={contributionStatusTone(item.status)}>{contributionStatusLabel(item.status)}</Chip>
                  {item.revision > 1 ? <Chip tone="neutral">Revision {item.revision}</Chip> : null}
                </span>
                <h3>
                  <Link href={`/open-source/me/${item.id}`}>{item.title}</Link>
                </h3>
                <p>
                  Updated <time dateTime={item.updatedAt}>{formatWhen(item.updatedAt)}</time>
                  {item.status === "MERGED" ? (
                    <>
                      {" · "}
                      <Link className="sf-community-text-link" href={`/open-source/${item.skill.slug}/c/${item.id}`}>
                        Public page
                      </Link>
                    </>
                  ) : null}
                </p>
              </article>
            </li>
          ))}
        </ul>
      )}

      {page.nextCursor ? (
        <p className="sf-community-next">
          <Link className="sf-community-text-link" href={pageHref(status, page.nextCursor)}>
            Next contributions
          </Link>
        </p>
      ) : null}
    </div>
  );
}
