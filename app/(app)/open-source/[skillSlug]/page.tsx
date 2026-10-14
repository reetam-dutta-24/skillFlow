import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Button } from "@/components/core/Button.jsx";
import { Chip } from "@/components/core/Chip.jsx";
import { EmptyState } from "@/components/feedback/EmptyState.jsx";
import { PersonAvatar } from "@/components/community/PersonAvatar";
import { auth } from "@/lib/auth";
import { Icon } from "@/components/core/Icon.jsx";
import { COMMUNITY_LABEL, communityRoleLabel, formatWhen } from "@/lib/community-copy";
import { loadCommunityContributors, loadCommunityNiches, loadMergedPage } from "@/lib/data/community";
import { loadNicheTeam } from "@/lib/data/community-admin";
import { loadPublicCatalog } from "@/lib/data/public-catalog";
import { communityActor } from "@/lib/services/community/actor";
import { communityNews, markCommunitySeen } from "@/lib/services/community/memberships";
import { canModerate, isAdmin, type CommunityActor } from "@/lib/services/community/permissions";
import { suggestedReviewers, type SuggestedPerson } from "@/lib/services/community/roles";
import { joinCommunityAction, leaveCommunityAction } from "../actions";
import { DoneNote } from "../_components/DoneNote";
import { RoleButton } from "../_components/RoleButton";
import { CommunityHero } from "../_components/CommunityHero";
import { ContributionCard, ContributionGrid } from "../_components/ContributionCard";
import { TYPE_FILTERS } from "../_components/contribution-meta";

type PageProps = {
  params: Promise<{ skillSlug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const TABS = [
  { id: "contributions", label: "Contributions" },
  { id: "contributors", label: "Contributors" },
  { id: "maintainers", label: "Maintainers" },
] as const;

type TabId = (typeof TABS)[number]["id"];

type Stage = { id: string; order: number; title: string };

function one(value: string | string[] | undefined) {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

/** Maintainers is only a tab for people who moderate this niche. */
function tabId(value: string, moderator: boolean): TabId {
  if (value === "maintainers" && !moderator) return "contributions";
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

  // Per person, on the request. The public lists stay cached; this only decides which controls render.
  const actor = await communityActor(session.user.id);
  const moderator = actor ? canModerate(actor, niche.id) : false;
  const tab = tabId(one(query.tab), moderator);
  const type = one(query.type);
  const stageId = one(query.stage);
  const tag = one(query.tag);
  const cursor = one(query.cursor);
  const catalog = await loadPublicCatalog();
  const allStages = catalog.find((entry) => entry.skill.slug === skillSlug)?.stages ?? [];
  const stages: Stage[] =
    niche.status === "available" ? allStages.map((stage) => ({ id: stage.id, order: stage.order, title: stage.title })) : [];

  return (
    <div className="sf-dash sf-os-page">
      <CommunityHero
        image={niche.image}
        crumb={
          <>
            <Link href="/open-source">Open Source</Link>
            <span aria-hidden="true">/</span>
            <span>{niche.status === "available" ? "Community" : "Coming soon"}</span>
          </>
        }
        title={niche.name}
        label={COMMUNITY_LABEL}
        description={visit.joined && visit.count > 0 ? `${visit.count} new since your last visit.` : niche.description || undefined}
        stats={[
          { icon: "git-pull-request", value: niche.merged, label: niche.merged === 1 ? "Contribution" : "Contributions" },
          { icon: "users", value: niche.members, label: niche.members === 1 ? "Member" : "Members" },
          { icon: "circle-dot", value: niche.openGaps, label: niche.openGaps === 1 ? "Open request" : "Open requests" },
        ]}
        actions={
          <>
            <Link className="sf-btn sf-btn--gradient sf-btn--md" href={`/open-source/${niche.slug}/contribute`}>
              <Icon name="plus" size={16} />
              Contribute
            </Link>
            <form action={visit.joined ? leaveCommunityAction : joinCommunityAction}>
              <input type="hidden" name="skillId" value={niche.id} />
              <Button type="submit" size="md" variant="outline">
                {visit.joined ? "Leave community" : "Join community"}
              </Button>
            </form>
          </>
        }
      />

      <DoneNote done={one(query.done)} />

      <nav className="sf-os-tabs" aria-label="Community sections">
        {TABS.filter((item) => item.id !== "maintainers" || moderator).map((item) => (
          <Link key={item.id} href={hrefFor(niche.slug, { tab: item.id === "contributions" ? "" : item.id })} aria-current={tab === item.id ? "page" : undefined}>
            <Icon name={item.id === "contributions" ? "git-pull-request" : item.id === "contributors" ? "users" : "shield-check"} size={15} />
            {item.label}
          </Link>
        ))}
      </nav>

      {tab === "contributions" ? (
        <Contributions
          slug={niche.slug}
          skillId={niche.id}
          stages={stages}
          type={type}
          stageId={stageId}
          tag={tag}
          cursor={cursor}
        />
      ) : null}
      {tab === "contributors" ? <Contributors skillId={niche.id} /> : null}
      {tab === "maintainers" && actor && moderator ? <Maintainers skillId={niche.id} slug={niche.slug} actor={actor} /> : null}
    </div>
  );
}

async function Contributions({
  slug,
  skillId,
  stages,
  type,
  stageId,
  tag,
  cursor,
}: {
  slug: string;
  skillId: string;
  stages: { id: string; order: number; title: string }[];
  type: string;
  stageId: string;
  tag: string;
  cursor: string;
}) {
  const page = await loadMergedPage({ skillId, type, stageId, tag, sort: "newest", cursor });
  const kept = { type, stage: stageId, tag };

  return (
    <section className="sf-community-panel" aria-labelledby="community-contributions">
      <h2 id="community-contributions" className="sf-sr">
        Contributions
      </h2>
      <div className="sf-os-filterbar">
        <nav className="sf-os-chips" aria-label="Contribution type">
          {TYPE_FILTERS.map((item) => (
            <Link
              key={item.id || "all"}
              href={hrefFor(slug, { type: item.id, stage: stageId, tag })}
              aria-current={type === item.id ? "page" : undefined}
            >
              <Icon name={item.icon} size={14} />
              {item.label}
            </Link>
          ))}
        </nav>
        <form className="sf-os-refine" method="get" action={`/open-source/${slug}`}>
          {type ? <input type="hidden" name="type" value={type} /> : null}
          {stages.length > 0 ? (
            <label>
              <span className="sf-sr">Stage</span>
              <select name="stage" defaultValue={stageId}>
                <option value="">Every stage</option>
                {stages.map((stage) => (
                  <option key={stage.id} value={stage.id}>
                    Stage {stage.order}: {stage.title}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <label>
            <span className="sf-sr">Tag</span>
            <input name="tag" defaultValue={tag} maxLength={24} placeholder="Filter by tag" />
          </label>
          <Button type="submit" size="md" variant="outline">
            <Icon name="search" size={15} />
            Filter
          </Button>
        </form>
      </div>

      {page.items.length === 0 ? (
        <EmptyState icon="git-pull-request" title="No contributions yet" description="A published contribution from this niche will show up here." />
      ) : (
        <ContributionGrid>
          {page.items.map((item) => (
            <li key={item.id}>
              <ContributionCard item={item} slug={slug} />
            </li>
          ))}
        </ContributionGrid>
      )}

      {page.nextCursor ? (
        <p className="sf-community-next">
          <Link className="sf-btn sf-btn--outline sf-btn--md" href={hrefFor(slug, { ...kept, tab: "contributions", cursor: page.nextCursor })}>
            More contributions
          </Link>
        </p>
      ) : null}
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
                    <Link className="sf-os-person-link" href={`/profile/${person.id}`}>
                      <PersonAvatar name={person.name} image={person.image} />
                    </Link>
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
                    <Link className="sf-os-person-link" href={`/profile/${person.id}`}>
                      <PersonAvatar name={person.name} image={person.image} />
                    </Link>
                    <Chip tone="neutral">{communityRoleLabel(person.role)}</Chip>
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

/** Per request, maintainers and admins only. Nothing here is cached. */
async function Maintainers({ skillId, slug, actor }: { skillId: string; slug: string; actor: CommunityActor }) {
  const [team, suggestions] = await Promise.all([loadNicheTeam(skillId), suggestedReviewers(actor.id, skillId)]);
  const admin = isAdmin(actor);

  function suggestionList(title: string, people: SuggestedPerson[], label: string | null) {
    return (
      <section>
        <h3>{title}</h3>
        {people.length === 0 ? (
          <p className="sf-os-hint">Nobody yet.</p>
        ) : (
          <ul className="sf-os-team">
            {people.map((person) => (
              <li key={person.id}>
                <Link className="sf-os-person-link" href={`/profile/${person.id}`}>
                  <PersonAvatar name={person.name} image={person.image} />
                </Link>
                <span className="sf-os-hint">{person.merged} merged</span>
                {label ? <Chip tone="warn">{label}</Chip> : null}
                <RoleButton op="grant" userId={person.id} skillId={skillId} role="REVIEWER" label="Make reviewer" />
              </li>
            ))}
          </ul>
        )}
      </section>
    );
  }

  return (
    <section className="sf-community-panel" aria-labelledby="community-maintainers">
      <h2 id="community-maintainers" className="sf-sr">
        Maintainers
      </h2>
      <p className="sf-os-queue-line">
        {team.open} {team.open === 1 ? "contribution waits" : "contributions wait"} for review here.{" "}
        <Link className="sf-community-text-link" href={`/open-source/review?niche=${slug}`}>
          Open the review queue
        </Link>
      </p>

      <div className="sf-community-people">
        <section>
          <h3>Maintainers and reviewers</h3>
          {team.members.length === 0 ? (
            <p className="sf-os-hint">No one holds a role in this niche yet.</p>
          ) : (
            <ul className="sf-os-team">
              {team.members.map((member) => {
                const mayRevoke = member.userId !== actor.id && (admin || member.role === "REVIEWER");
                return (
                  <li key={member.roleId}>
                    <Link className="sf-os-person-link" href={`/profile/${member.userId}`}>
                      <PersonAvatar name={member.name} image={member.image} />
                    </Link>
                    <Chip tone={member.role === "MAINTAINER" ? "accent" : "neutral"}>{communityRoleLabel(member.role)}</Chip>
                    <span className="sf-os-hint">
                      Since <time dateTime={member.grantedAt}>{formatWhen(member.grantedAt)}</time>
                      {member.grantedBy ? ` · granted by ${member.grantedBy}` : ""}
                    </span>
                    {mayRevoke ? <RoleButton op="revoke" userId={member.userId} skillId={skillId} role={member.role} label="Revoke" /> : null}
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {suggestions.ok ? (
          <>
            <p className="sf-os-hint">{suggestions.note}</p>
            {suggestionList("Eligible reviewers", suggestions.eligible, null)}
            {suggestionList("Strong contributors", suggestions.strong, "Path not completed")}
          </>
        ) : (
          <p className="sf-auth-error">{suggestions.error}</p>
        )}
      </div>
    </section>
  );
}
