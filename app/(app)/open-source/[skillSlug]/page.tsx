import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Button } from "@/components/core/Button.jsx";
import { Chip } from "@/components/core/Chip.jsx";
import { EmptyState } from "@/components/feedback/EmptyState.jsx";
import { PersonAvatar } from "@/components/community/PersonAvatar";
import { auth } from "@/lib/auth";
import { COMMUNITY_LABEL, communityRoleLabel, contributionTypeLabel, disclosureLabel, formatWhen } from "@/lib/community-copy";
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

      <DoneNote done={one(query.done)} />

      <nav className="sf-community-tabs" aria-label="Community sections">
        {TABS.filter((item) => item.id !== "maintainers" || moderator).map((item) => (
          <Link key={item.id} href={hrefFor(niche.slug, { tab: item.id === "contributions" ? "" : item.id })} aria-current={tab === item.id ? "page" : undefined}>
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
        <Button type="submit" size="sm" variant="outline">
          Apply
        </Button>
      </form>

      {page.items.length === 0 ? (
        <EmptyState icon="git-pull-request" title="No contributions yet" description="A published post from this niche will show up here." />
      ) : (
        <ul className="sf-community-feed">
          {page.items.map((item) => {
            const disclosure = disclosureLabel(item.disclosure);
            return (
              <li key={item.id}>
                <article className="sf-community-card">
                  <span className="sf-community-chips">
                    <Chip tone="neutral">{contributionTypeLabel(item.type)}</Chip>
                    {item.stage ? <Chip tone="neutral">Relevant to Stage {item.stage.order}</Chip> : null}
                    {disclosure ? <Chip tone={item.disclosure === "AFFILIATE_OR_SPONSORED" ? "warn" : "accent"}>{disclosure}</Chip> : null}
                  </span>
                  <h3>
                    <Link className="sf-os-card-link" href={`/open-source/${slug}/c/${item.id}`}>
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
                </article>
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
