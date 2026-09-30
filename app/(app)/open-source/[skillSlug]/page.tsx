import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Button } from "@/components/core/Button.jsx";
import { Chip } from "@/components/core/Chip.jsx";
import { EmptyState } from "@/components/feedback/EmptyState.jsx";
import { auth } from "@/lib/auth";
import { COMMUNITY_LABEL, contributionTypeLabel, disclosureLabel, formatWhen } from "@/lib/community-copy";
import {
  loadCommunityChangelog,
  loadCommunityContributors,
  loadCommunityGaps,
  loadCommunityNiches,
  loadMergedPage,
  myUsefulMarks,
} from "@/lib/data/community";
import { loadPublicCatalog } from "@/lib/data/public-catalog";
import { communityNews, markCommunitySeen } from "@/lib/services/community/memberships";
import { joinCommunityAction, leaveCommunityAction } from "../actions";

type PageProps = {
  params: Promise<{ skillSlug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const TABS = [
  { id: "contributions", label: "Contributions" },
  { id: "gaps", label: "Gaps" },
  { id: "changelog", label: "Changelog" },
  { id: "contributors", label: "Contributors" },
] as const;

type TabId = (typeof TABS)[number]["id"];

function one(value: string | string[] | undefined) {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

function tabId(value: string): TabId {
  return TABS.some((tab) => tab.id === value) ? (value as TabId) : "contributions";
}

function hrefFor(slug: string, query: Record<string, string>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value) search.set(key, value);
  }
  const text = search.toString();
  return text ? `/open-source/${slug}?${text}` : `/open-source/${slug}`;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { skillSlug } = await params;
  const niches = await loadCommunityNiches();
  const niche = niches.find((item) => item.slug === skillSlug);
  return { title: niche ? `${niche.name} · Open Source` : "Open Source" };
}

export default async function CommunityNichePage({ params, searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { skillSlug } = await params;
  const query = await searchParams;
  const niches = await loadCommunityNiches();
  const niche = niches.find((item) => item.slug === skillSlug);
  if (!niche) notFound();

  const visit = await communityNews(session.user.id, niche.id);
  if (visit.joined) await markCommunitySeen(session.user.id, niche.id);

  const tab = tabId(one(query.tab));
  const type = one(query.type);
  const stageId = one(query.stage);
  const tag = one(query.tag);
  const sort = one(query.sort) === "useful" ? "useful" : "newest";
  const cursor = one(query.cursor);
  const catalog = await loadPublicCatalog();
  const stages = catalog.find((entry) => entry.skill.slug === skillSlug)?.stages ?? [];

  return (
    <div className="sf-dash">
      <header className="sf-page-head">
        <p>
          <Link className="sf-roadmap-link" href="/open-source">
            All communities
          </Link>
        </p>
        <h1>{niche.name}</h1>
        <p className="sf-community-label">{COMMUNITY_LABEL}</p>
        <p>
          {niche.status === "available" ? "Available" : "Coming soon"} · {niche.members}{" "}
          {niche.members === 1 ? "member" : "members"}
          {visit.joined && visit.count > 0 ? ` · ${visit.count} new since your last visit` : ""}
        </p>
        <div className="sf-community-actions">
          <form action={visit.joined ? leaveCommunityAction : joinCommunityAction}>
            <input type="hidden" name="skillId" value={niche.id} />
            <Button type="submit" size="sm" variant={visit.joined ? "outline" : "gradient"}>
              {visit.joined ? "Leave" : "Join"}
            </Button>
          </form>
          <Link className="sf-community-text-link" href={`/open-source/${niche.slug}/contribute`}>
            Contribute
          </Link>
        </div>
      </header>

      <nav className="sf-community-tabs" aria-label="Community sections">
        {TABS.map((item) => (
          <Link key={item.id} href={hrefFor(niche.slug, { tab: item.id === "contributions" ? "" : item.id })} aria-current={tab === item.id ? "page" : undefined}>
            {item.label}
          </Link>
        ))}
      </nav>

      {tab === "contributions" ? (
        <Contributions
          slug={niche.slug}
          skillId={niche.id}
          userId={session.user.id}
          stages={niche.status === "available" ? stages.map((stage) => ({ id: stage.id, order: stage.order, title: stage.title })) : []}
          type={type}
          stageId={stageId}
          tag={tag}
          sort={sort}
          cursor={cursor}
        />
      ) : null}
      {tab === "gaps" ? <Gaps skillId={niche.id} /> : null}
      {tab === "changelog" ? <Changelog slug={niche.slug} skillId={niche.id} /> : null}
      {tab === "contributors" ? <Contributors skillId={niche.id} /> : null}
    </div>
  );
}

async function Contributions({
  slug,
  skillId,
  userId,
  stages,
  type,
  stageId,
  tag,
  sort,
  cursor,
}: {
  slug: string;
  skillId: string;
  userId: string;
  stages: { id: string; order: number; title: string }[];
  type: string;
  stageId: string;
  tag: string;
  sort: string;
  cursor: string;
}) {
  const page = await loadMergedPage({ skillId, type, stageId, tag, sort, cursor });
  const marked = new Set(await myUsefulMarks(userId, page.items.map((item) => item.id)));
  const kept = { type, stage: stageId, tag, sort };

  return (
    <section className="sf-community-panel" aria-labelledby="community-contributions">
      <h2 id="community-contributions" className="sf-sr">
        Contributions
      </h2>
      <form className="sf-community-filters" method="get" action={`/open-source/${slug}`}>
        <input type="hidden" name="tab" value="contributions" />
        <label>
          Type
          <select name="type" defaultValue={type}>
            <option value="">Any</option>
            <option value="RESOURCE">Resource</option>
            <option value="CONCEPT_NOTE">Concept note</option>
            <option value="LEARNING_PATH">Learning path</option>
            <option value="FOLLOW">Follow</option>
          </select>
        </label>
        {stages.length > 0 ? (
          <label>
            Stage
            <select name="stage" defaultValue={stageId}>
              <option value="">Any</option>
              {stages.map((stage) => (
                <option key={stage.id} value={stage.id}>
                  Stage {stage.order}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <label>
          Tag
          <input name="tag" defaultValue={tag} maxLength={24} placeholder="A tag" />
        </label>
        <label>
          Sort
          <select name="sort" defaultValue={sort}>
            <option value="newest">Newest</option>
            <option value="useful">Most useful</option>
          </select>
        </label>
        <Button type="submit" size="sm" variant="outline">
          Apply
        </Button>
      </form>

      {page.items.length === 0 ? (
        <EmptyState
          icon="git-pull-request"
          title="No contributions yet"
          description="Be the first — or pick a good first gap."
          action={
            <Link className="sf-community-text-link" href={hrefFor(slug, { tab: "gaps" })}>
              See gaps
            </Link>
          }
        />
      ) : (
        <ul className="sf-community-feed">
          {page.items.map((item) => {
            const disclosure = disclosureLabel(item.disclosure);
            return (
              <li key={item.id}>
                <Link className="sf-community-card" href={`/open-source/${slug}/c/${item.id}`}>
                  <span className="sf-community-chips">
                    <Chip tone="neutral">{contributionTypeLabel(item.type)}</Chip>
                    {item.stage ? <Chip tone="neutral">Relevant to Stage {item.stage.order}</Chip> : null}
                    {disclosure ? <Chip tone={item.disclosure === "AFFILIATE_OR_SPONSORED" ? "warn" : "accent"}>{disclosure}</Chip> : null}
                  </span>
                  <h3>{item.title}</h3>
                  <p>{item.summary}</p>
                  <p>
                    {item.author?.name ?? "Former member"}
                    {item.mergedAt ? ` · ${formatWhen(item.mergedAt)}` : ""}
                  </p>
                  <p>
                    Found useful by {item.usefulCount} {item.usefulCount === 1 ? "learner" : "learners"}
                    {marked.has(item.id) ? " · You found this useful" : ""}
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      {page.nextCursor ? (
        <p className="sf-community-next">
          <Link className="sf-community-text-link" href={hrefFor(slug, { ...kept, tab: "contributions", cursor: page.nextCursor })}>
            Next contributions
          </Link>
        </p>
      ) : null}
    </section>
  );
}

async function Gaps({ skillId }: { skillId: string }) {
  const gaps = await loadCommunityGaps(skillId);
  return (
    <section className="sf-community-panel" aria-labelledby="community-gaps">
      <h2 id="community-gaps" className="sf-sr">
        Gaps
      </h2>
      {gaps.length === 0 ? (
        <EmptyState icon="search" title="No open gaps" description="When someone reports a gap, it will show up here." />
      ) : (
        <ul className="sf-community-feed">
          {gaps.map((gap) => (
            <li key={gap.id}>
              <article className={gap.goodFirst ? "sf-community-card is-good-first" : "sf-community-card"}>
                <span className="sf-community-chips">
                  {gap.goodFirst ? <Chip tone="accent">Good first</Chip> : null}
                  <Chip tone="neutral">{gap.status === "OPEN" ? "Open" : "Resolved"}</Chip>
                  {gap.stage ? <Chip tone="neutral">Relevant to Stage {gap.stage.order}</Chip> : null}
                </span>
                <h3>{gap.title}</h3>
                <p>{gap.description}</p>
              </article>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

async function Changelog({ slug, skillId }: { slug: string; skillId: string }) {
  const weeks = await loadCommunityChangelog(skillId);
  return (
    <section className="sf-community-panel" aria-labelledby="community-changelog">
      <h2 id="community-changelog" className="sf-sr">
        Changelog
      </h2>
      {weeks.length === 0 ? (
        <EmptyState icon="route" title="Nothing in the last 12 weeks" description="Merged contributions and resolved gaps will be listed here." />
      ) : (
        <div className="sf-community-weeks">
          {weeks.map((week) => (
            <section key={week.weekStart}>
              <h3>Week of {week.weekStart}</h3>
              <ul>
                {week.items.map((item) => (
                  <li key={`${item.kind}-${item.id}`}>
                    {item.kind === "contribution" ? (
                      <Link href={`/open-source/${slug}/c/${item.id}`}>{item.title}</Link>
                    ) : (
                      <span>{item.title}</span>
                    )}
                    <time dateTime={item.at}>{formatWhen(item.at)}</time>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </section>
  );
}

async function Contributors({ skillId }: { skillId: string }) {
  const people = await loadCommunityContributors(skillId);
  const empty = people.top.length === 0 && people.roles.length === 0;
  return (
    <section className="sf-community-panel" aria-labelledby="community-contributors">
      <h2 id="community-contributors" className="sf-sr">
        Contributors
      </h2>
      {empty ? (
        <EmptyState icon="users" title="No contributors yet" description="A merged contribution puts someone on this list." />
      ) : (
        <div className="sf-community-people">
          {people.top.length > 0 ? (
            <section>
              <h3>Most merged</h3>
              <ul>
                {people.top.map((person) => (
                  <li key={person.id}>
                    <span>{person.name ?? "Learner"}</span>
                    <span>
                      {person.merged} merged
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
          {people.roles.length > 0 ? (
            <section>
              <h3>Reviewers and maintainers</h3>
              <ul>
                {people.roles.map((person) => (
                  <li key={`${person.role}-${person.id}`}>
                    <span>{person.name ?? "Learner"}</span>
                    <Chip tone="neutral">{person.role === "MAINTAINER" ? "Maintainer" : "Reviewer"}</Chip>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      )}
    </section>
  );
}
