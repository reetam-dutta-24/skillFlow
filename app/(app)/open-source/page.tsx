import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/core/Button.jsx";
import { EmptyState } from "@/components/feedback/EmptyState.jsx";
import { auth } from "@/lib/auth";
import { Icon } from "@/components/core/Icon.jsx";
import { COMMUNITY_LABEL } from "@/lib/community-copy";
import { loadCommunityNiches, loadMergedFeed, myCommunityNews, myFollowedSkillIds } from "@/lib/data/community";
import { myAttentionCount } from "@/lib/data/community-me";
import { joinCommunityAction, leaveCommunityAction } from "./actions";
import { ContributeMenu } from "./_components/ContributeMenu";
import { NicheRail } from "./_components/NicheRail";
import { CommunityHero } from "./_components/CommunityHero";
import { CommunityStrip } from "./_components/CommunityStrip";
import { ContributionCard, ContributionGrid } from "./_components/ContributionCard";
import { TYPE_FILTERS } from "./_components/contribution-meta";

export const metadata: Metadata = { title: "Open Source" };

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
  const type = TYPE_FILTERS.some((item) => item.id === one(query.type)) ? one(query.type) : "";
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
  // Followed communities first, then the busiest, so a learner who follows nothing still has a way in.
  const strip = [...niches]
    .filter((niche) => followed.has(niche.id) || niche.merged > 0)
    .sort((a, b) => Number(followed.has(b.id)) - Number(followed.has(a.id)) || b.merged - a.merged || b.members - a.members)
    .slice(0, 12)
    .map((niche) => ({
      slug: niche.slug,
      name: niche.name,
      image: niche.image,
      merged: niche.merged,
      members: niche.members,
      followed: followed.has(niche.id),
      news: newsBySkill.get(niche.id) ?? 0,
    }));
  const communities = niches.filter((niche) => niche.merged > 0).length;

  return (
    <div className="sf-dash sf-os-page">
      <CommunityHero
        image={null}
        title="Open Source"
        label={COMMUNITY_LABEL}
        description="Resources, concept notes, learning paths, and accounts worth following, shared by learners and published by a moderator."
        stats={[
          { icon: "git-pull-request", value: stats.contributions, label: selected.length ? "In this feed" : "Contributions" },
          { icon: "users", value: stats.members, label: "Members" },
          { icon: "library", value: communities, label: "Active communities" },
        ]}
        actions={
          <>
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
                <Button type="submit" size="md" variant="outline">
                  {newsBySkill.has(selected[0].id) ? "Leave community" : "Join community"}
                </Button>
              </form>
            ) : null}
            <Link className="sf-btn sf-btn--outline sf-btn--md" href="/open-source/me">
              <Icon name="folder-git-2" size={16} />
              My contributions
              {attention > 0 ? <span className="sf-os-attention">{attention}</span> : null}
            </Link>
          </>
        }
      />

      <CommunityStrip title={followedSlugs.length ? "Your communities" : "Popular communities"} niches={strip} />

      <div className="sf-os-split">
        <section className="sf-os-feed" aria-labelledby="open-source-feed">
          <div className="sf-os-feed-tools">
            <h2 id="open-source-feed">Latest contributions</h2>
            <nav className="sf-os-chips" aria-label="Contribution type">
              {TYPE_FILTERS.map((item) => (
                <Link key={item.id || "all"} href={pageHref({ niches: nicheParam, sort, type: item.id })} aria-current={type === item.id ? "page" : undefined}>
                  <Icon name={item.icon} size={14} />
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          {selected.length === 0 ? (
            <EmptyState
              icon="git-pull-request"
              title={followedSlugs.length === 0 ? "Pick a community to start" : "No niche is selected"}
              description={
                followedSlugs.length === 0
                  ? "Open one of the communities above, or follow a path from Niches and its community fills this feed."
                  : "Add a niche from the panel, or show the niches you follow."
              }
              action={
                followedSlugs.length === 0 ? (
                  <Link className="sf-btn sf-btn--outline sf-btn--md" href="/skills">
                    Browse niches
                  </Link>
                ) : (
                  <Link className="sf-btn sf-btn--outline sf-btn--md" href={pageHref({ niches: null, sort, type })}>
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
            <ContributionGrid>
              {feed.items.map((item) => (
                <li key={item.id}>
                  <ContributionCard item={item} slug={item.skill.slug} niche={{ name: item.skill.name, image: item.skill.image }} />
                </li>
              ))}
            </ContributionGrid>
          )}

          {feed.nextCursor ? (
            <p className="sf-community-next">
              <Link className="sf-btn sf-btn--outline sf-btn--md" href={pageHref({ niches: nicheParam, sort, type, cursor: feed.nextCursor })}>
                More contributions
              </Link>
            </p>
          ) : null}
        </section>

        <aside className="sf-os-rail" aria-label="Niches in this feed">
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
