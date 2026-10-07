import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/core/Button.jsx";
import { Chip } from "@/components/core/Chip.jsx";
import { EmptyState } from "@/components/feedback/EmptyState.jsx";
import { auth } from "@/lib/auth";
import { COMMUNITY_LABEL, contributionTypeLabel, disclosureLabel, formatWhen } from "@/lib/community-copy";
import { loadCommunityNiches, loadMergedFeed, myCommunityNews, myFollowedSkillIds } from "@/lib/data/community";
import { myAttentionCount } from "@/lib/data/community-me";
import { SkillImage } from "@/components/core/SkillImage";
import { joinCommunityAction, leaveCommunityAction } from "./actions";
import { ContributeMenu } from "./_components/ContributeMenu";
import { NicheRail } from "./_components/NicheRail";

export const metadata: Metadata = { title: "Open Source" };

const TYPES = [
  { id: "", label: "All" },
  { id: "RESOURCE", label: "Resource" },
  { id: "CONCEPT_NOTE", label: "Concept note" },
  { id: "LEARNING_PATH", label: "Learning path" },
  { id: "FOLLOW", label: "Follow" },
] as const;

function one(value: string | string[] | undefined) {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

function pageHref(options: { niches: string[] | null; sort: string; type: string; cursor?: string }) {
  const params = new URLSearchParams();
  if (options.niches) params.set("niches", options.niches.join(","));
  if (options.sort === "useful") params.set("sort", "useful");
  if (options.type) params.set("type", options.type);
  if (options.cursor) params.set("cursor", options.cursor);
  const text = params.toString();
  return text ? `/open-source?${text}` : "/open-source";
}

export default async function OpenSourcePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const query = await searchParams;
  const custom = query.niches !== undefined;
  const sort = "newest";
  const type = TYPES.some((item) => item.id === one(query.type)) ? one(query.type) : "";
  const cursor = one(query.cursor);

  const [niches, followedIds, news, attention] = await Promise.all([
    loadCommunityNiches(),
    myFollowedSkillIds(session.user.id),
    myCommunityNews(session.user.id),
    myAttentionCount(session.user.id),
  ]);
  const followed = new Set(followedIds);
  const newsBySkill = new Map(news.map((row) => [row.skillId, row.count]));
  const bySlug = new Map(niches.map((niche) => [niche.slug, niche]));
  const followedSlugs = niches.filter((niche) => followed.has(niche.id)).map((niche) => niche.slug);
  const requested = custom
    ? one(query.niches)
        .split(",")
        .map((slug) => slug.trim())
        .filter((slug) => bySlug.has(slug))
    : followedSlugs;
  const selected = requested.flatMap((slug) => {
    const niche = bySlug.get(slug);
    return niche ? [niche] : [];
  });
  const skillIds = selected
    .map((niche) => niche.id)
    .sort()
    .join(",");
  const feed = await loadMergedFeed({ skillIds, sort, cursor, type });
  const stats = {
    contributions: selected.reduce((sum, niche) => sum + niche.merged, 0),
    members: selected.reduce((sum, niche) => sum + niche.members, 0),
  };
  const nicheParam = custom ? requested : null;

  return (
    <div className="sf-dash">
      <header className="sf-page-head">
        <h1>Open Source</h1>
        <p className="sf-community-label">{COMMUNITY_LABEL}</p>
        <p>Public contributions from the skills you follow. Narrow the list, or search for any other niche.</p>
        <div className="sf-community-actions">
          <ContributeMenu
            niches={selected.map((niche) => ({
              slug: niche.slug,
              name: niche.name,
              image: niche.image,
            }))}
          />
          {selected.length === 1 ? (
            <form action={newsBySkill.has(selected[0].id) ? leaveCommunityAction : joinCommunityAction}>
              <input type="hidden" name="skillId" value={selected[0].id} />
              <Button type="submit" size="sm" variant={newsBySkill.has(selected[0].id) ? "outline" : "gradient"}>
                {newsBySkill.has(selected[0].id) ? "Leave community" : "Join community"}
              </Button>
            </form>
          ) : null}
          <Link className="sf-community-text-link" href="/open-source/me">
            My contributions
            {attention > 0 ? ` · ${attention} ${attention === 1 ? "needs" : "need"} your attention` : ""}
          </Link>
        </div>
      </header>

      <div className="sf-os-split">
        <section className="sf-os-feed" aria-labelledby="open-source-feed">
          <div className="sf-os-feed-tools">
            <h2 id="open-source-feed">Contributions</h2>
            <div className="sf-community-tabs" aria-label="Contribution type">
              {TYPES.map((item) => (
                <Link key={item.id || "all"} href={pageHref({ niches: nicheParam, sort, type: item.id })} aria-current={type === item.id ? "page" : undefined}>
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          {selected.length === 0 ? (
            <EmptyState
              icon="git-pull-request"
              title={followedSlugs.length === 0 ? "Follow a skill to start" : "No niche is selected"}
              description={
                followedSlugs.length === 0
                  ? "Choose a skill from Niches, or search the panel for a community you have not followed yet."
                  : "Add a niche from the panel, or show the niches you follow."
              }
              action={
                followedSlugs.length === 0 ? (
                  <Link className="sf-community-text-link" href="/skills">
                    Browse niches
                  </Link>
                ) : (
                  <Link className="sf-community-text-link" href={pageHref({ niches: null, sort, type })}>
                    Show the niches you follow
                  </Link>
                )
              }
            />
          ) : feed.items.length === 0 ? (
            <EmptyState
              icon="git-pull-request"
              title="No public contributions yet"
              description="When a moderator publishes a contribution in these niches, it shows up here."
            />
          ) : (
            <ul className="sf-os-feed-list">
              {feed.items.map((item) => {
                const disclosure = disclosureLabel(item.disclosure);
                return (
                  <li key={item.id}>
                    <article className="sf-community-card sf-os-feed-card">
                      {item.skill.image ? (
                        <SkillImage className="sf-os-feed-photo" src={item.skill.image} alt="" width={72} height={72} />
                      ) : (
                        <span className="sf-os-thumb-fallback sf-os-feed-photo" aria-hidden="true" />
                      )}
                      <span className="sf-os-feed-copy">
                      <span className="sf-community-chips">
                        <Chip tone="accent">{item.skill.name}</Chip>
                        <Chip tone="neutral">{contributionTypeLabel(item.type)}</Chip>
                        {item.stage ? <Chip tone="neutral">Relevant to Stage {item.stage.order}</Chip> : null}
                        {disclosure ? <Chip tone={item.disclosure === "AFFILIATE_OR_SPONSORED" ? "warn" : "accent"}>{disclosure}</Chip> : null}
                      </span>
                      <h3>
                        <Link className="sf-os-card-link" href={`/open-source/${item.skill.slug}/c/${item.id}`}>
                          {item.title}
                        </Link>
                      </h3>
                      <p>{item.summary}</p>
                      <p>
                        {item.author ? (
                          <Link className="sf-os-author-link" href={`/profile/${item.author.id}`}>
                            {item.author.name ?? "Learner"}
                          </Link>
                        ) : (
                          "Former member"
                        )}
                        {item.mergedAt ? ` · ${formatWhen(item.mergedAt)}` : ""}
                      </p>
                      </span>
                    </article>
                  </li>
                );
              })}
            </ul>
          )}

          {feed.nextCursor ? (
            <p className="sf-community-next">
              <Link className="sf-community-text-link" href={pageHref({ niches: nicheParam, sort, type, cursor: feed.nextCursor })}>
                Next contributions
              </Link>
            </p>
          ) : null}
        </section>

        <aside className="sf-os-rail" aria-label="Niches in this feed">
          <dl className="sf-os-stats">
            <div>
              <dt>Contributions</dt>
              <dd>{stats.contributions}</dd>
            </div>
            <div>
              <dt>Members</dt>
              <dd>{stats.members}</dd>
            </div>
          </dl>
          <NicheRail
            custom={custom}
            sort={sort}
            type={type}
            selected={requested}
            niches={niches.map((niche) => ({
              id: niche.id,
              slug: niche.slug,
              name: niche.name,
              image: niche.image,
              status: niche.status,
              followed: followed.has(niche.id),
              joined: newsBySkill.has(niche.id),
              news: newsBySkill.get(niche.id) ?? 0,
            }))}
          />
        </aside>
      </div>
    </div>
  );
}
