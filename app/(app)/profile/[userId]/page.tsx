import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ContributionHeatmap } from "@/components/community/ContributionHeatmap";
import { SkillImage } from "@/components/core/SkillImage";
import { Icon } from "@/components/core/Icon.jsx";
import { EmptyState } from "@/components/feedback/EmptyState.jsx";
import { auth } from "@/lib/auth";
import { communityRoleLabel, contributionTypeLabel, formatWhen } from "@/lib/community-copy";
import { loadContributorProfile } from "@/lib/data/community";
import { loadPublicCreatorProfile } from "@/lib/data/creator";
import { loadProfileOverview } from "@/lib/data/profile";
import { ProfileWorks } from "./_components/ProfileWorks";

export const metadata: Metadata = { title: "Profile" };

/** Published contributions shown per niche before "Show more". */
const PER_NICHE = 5;

export default async function ProfilePage({ params }: { params: Promise<{ userId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const { userId } = await params;
  // Creator works (catalog tag) and Open Source work (community tag) are public and cached.
  // The overview carries progress and activity, so it is read on the request and respects the owner's setting.
  const [creator, community, overview] = await Promise.all([
    loadPublicCreatorProfile(userId),
    loadContributorProfile(userId),
    loadProfileOverview(userId, session.user.id),
  ]);
  if (!creator || !overview) notFound();
  const mine = session.user.id === overview.id;
  const published = community?.niches.reduce((sum, niche) => sum + niche.contributions.length, 0) ?? 0;
  const initial = overview.name.charAt(0).toUpperCase();

  return (
    <div className="sf-prof">
      <section className="sf-prof-hero" aria-labelledby="prof-name">
        <div className="sf-prof-cover" aria-hidden="true" />
        <div className="sf-prof-id">
          <span className="sf-prof-avatar" aria-hidden="true">
            {overview.image ? (
              // A Google avatar or an upload; the host is not known ahead of time, so the browser loads it directly.
              // eslint-disable-next-line @next/next/no-img-element
              <img src={overview.image} alt="" width={96} height={96} decoding="async" />
            ) : (
              initial
            )}
          </span>
          <div className="sf-prof-who">
            <h1 id="prof-name">{overview.name}</h1>
            {overview.headline ? <p className="sf-prof-headline">{overview.headline}</p> : null}
            <ul className="sf-prof-meta">
              <li>
                <Icon name="calendar" size={14} /> Member since {overview.memberSince}
              </li>
              <li>
                <Icon name="route" size={14} /> Following {overview.paths.length} {overview.paths.length === 1 ? "path" : "paths"}
              </li>
              {published > 0 ? (
                <li>
                  <Icon name="git-pull-request" size={14} /> {published} published {published === 1 ? "contribution" : "contributions"}
                </li>
              ) : null}
            </ul>
            <p className="sf-prof-chips">
              {overview.isAdmin ? <span className="sf-prof-chip is-accent">Admin</span> : null}
              {creator.works.length > 0 ? <span className="sf-prof-chip is-accent">Creator</span> : null}
              {community?.contributor ? <span className="sf-prof-chip is-accent">Contributor</span> : null}
              {overview.certificates > 0 ? <span className="sf-prof-chip">Certified · {overview.certificates}</span> : null}
              {community?.roles.map((role) => (
                <span key={`${role.role}-${role.slug}`} className="sf-prof-chip">
                  {communityRoleLabel(role.role)} · {role.name}
                </span>
              ))}
            </p>
          </div>
          {mine ? (
            <div className="sf-prof-actions">
              <Link className="sf-btn sf-btn--gradient sf-btn--md" href="/settings">
                Edit profile
              </Link>
              <Link className="sf-btn sf-btn--outline sf-btn--md" href="/onboarding?edit=1">
                Profile answers
              </Link>
            </div>
          ) : null}
        </div>
      </section>

      {overview.showActivity ? (
        <ul className="sf-prof-stats" aria-label="Totals">
          <Stat icon="sparkles" value={overview.activity?.heatmap.total ?? 0} label="Contributions this year" />
          <Stat icon="calendar-check" value={overview.activity?.heatmap.activeDays ?? 0} label="Active days" />
          <Stat icon="flame" value={overview.currentStreak} label="Current streak" unit="days" />
          <Stat icon="trophy" value={overview.longestStreak} label="Longest streak" unit="days" />
          <Stat icon="flag" value={overview.stagesPassed} label="Stages passed" />
          <Stat icon="award" value={overview.certificates} label="Certificates" />
        </ul>
      ) : null}

      {overview.showActivity && overview.activity ? (
        <Card id="prof-activity" title="Contribution activity" note={mine && !overview.activityPublic ? "Only you can see this. Turn on Show my activity in Settings to share it." : undefined}>
          <ContributionHeatmap heatmap={overview.activity.heatmap} headingId="prof-heatmap-total" noun="contribution" />
          {overview.activity.byKind.length ? (
            <ul className="sf-prof-kinds" aria-label="What counted">
              {overview.activity.byKind.map((kind) => (
                <li key={kind.id}>
                  <strong>{kind.count}</strong> {kind.label}
                </li>
              ))}
            </ul>
          ) : (
            <p className="sf-prof-quiet">
              {mine
                ? "Pass a stage, explain an idea, answer a recall, or share on Open Source. Every one of them counts here."
                : "Nothing counted in the last 12 months yet."}
            </p>
          )}
        </Card>
      ) : (
        <p className="sf-prof-private">
          <Icon name="lock" size={14} /> {overview.name} keeps their activity private.
        </p>
      )}

      <Card id="prof-learning" title="Learning">
        {overview.paths.length === 0 ? (
          <p className="sf-prof-quiet">{mine ? "Follow a path from Niches or Home. It shows here." : "Not following a path yet."}</p>
        ) : (
          <ul className="sf-prof-paths">
            {overview.paths.map((path) => (
              <li key={path.slug}>
                <Link className="sf-prof-path" href={`/roadmap/${path.slug}`}>
                  <span className="sf-prof-path-img">
                    <SkillImage src={path.image} alt="" fill sizes="96px" />
                  </span>
                  <span className="sf-prof-path-body">
                    <strong>{path.name}</strong>
                    {overview.showActivity ? (
                      <>
                        <span className="sf-prof-path-meta">
                          {path.passed} of {path.total} stages · {path.mastery}%
                          {path.complete ? " · certified" : ""}
                        </span>
                        <span
                          className="sf-prof-meter"
                          role="meter"
                          aria-label={`${path.name} mastery`}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-valuenow={path.mastery}
                        >
                          <span style={{ width: `${Math.max(path.mastery, 2)}%` }} />
                        </span>
                      </>
                    ) : (
                      <span className="sf-prof-path-meta">{path.total} stages</span>
                    )}
                  </span>
                </Link>
                {path.complete && overview.showActivity ? (
                  <Link className="sf-prof-cert" href={`/certificate/${overview.id}/${path.slug}`}>
                    <Icon name="award" size={14} /> Certificate
                  </Link>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card id="prof-videos" title="Videos" note="Live videos from this profile. Each one also sits in its niche on Clips.">
        {creator.works.length === 0 ? (
          <EmptyState
            compact
            icon="video"
            titleAs="h3"
            title="No published videos yet"
            description={mine ? "Send a video for review from Creator studio. It shows here after it is approved." : "This profile has no live videos."}
            action={
              mine ? (
                <Link className="sf-btn sf-btn--outline sf-btn--sm" href="/creator">
                  Open Creator studio
                </Link>
              ) : undefined
            }
          />
        ) : (
          <ProfileWorks works={creator.works} />
        )}
      </Card>

      <Card id="prof-os" title="Open Source">
        {!community || community.niches.length === 0 ? (
          <EmptyState
            compact
            icon="git-pull-request"
            titleAs="h3"
            title="No published contributions yet"
            description={mine ? "Share something in a niche you know. It shows here once a moderator publishes it." : "Published contributions will show here."}
            action={
              mine ? (
                <Link className="sf-btn sf-btn--outline sf-btn--sm" href="/open-source/me">
                  My contributions
                </Link>
              ) : undefined
            }
          />
        ) : (
          <div className="sf-prof-niches">
            {community.niches.map((niche) => {
              const first = niche.contributions.slice(0, PER_NICHE);
              const rest = niche.contributions.slice(PER_NICHE);
              return (
                <section key={niche.slug} aria-labelledby={`prof-niche-${niche.slug}`}>
                  <h3 id={`prof-niche-${niche.slug}`}>
                    <Link href={`/open-source/${niche.slug}`}>{niche.name}</Link>
                    <span>{niche.contributions.length} published</span>
                  </h3>
                  <ul className="sf-prof-list">
                    {first.map((item) => (
                      <ProfileContribution key={item.id} slug={niche.slug} item={item} />
                    ))}
                  </ul>
                  {rest.length > 0 ? (
                    <details className="sf-os-closed">
                      <summary>Show {rest.length} more</summary>
                      <ul className="sf-prof-list">
                        {rest.map((item) => (
                          <ProfileContribution key={item.id} slug={niche.slug} item={item} />
                        ))}
                      </ul>
                    </details>
                  ) : null}
                </section>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}

function Stat({ icon, value, label, unit }: { icon: string; value: number; label: string; unit?: string }) {
  return (
    <li className="sf-prof-stat">
      <span className="sf-prof-stat-icon" aria-hidden="true">
        <Icon name={icon} size={16} />
      </span>
      <strong>
        {value}
        {unit ? <small> {value === 1 ? unit.replace(/s$/, "") : unit}</small> : null}
      </strong>
      <span>{label}</span>
    </li>
  );
}

function Card({ id, title, note, children }: { id: string; title: string; note?: string; children: ReactNode }) {
  return (
    <section className="sf-prof-card" aria-labelledby={id}>
      <header>
        <h2 id={id}>{title}</h2>
        {note ? <p>{note}</p> : null}
      </header>
      {children}
    </section>
  );
}

function ProfileContribution({ slug, item }: { slug: string; item: { id: string; title: string; type: string; mergedAt: string } }) {
  return (
    <li>
      <Link href={`/open-source/${slug}/c/${item.id}`}>{item.title}</Link>
      <span>
        {contributionTypeLabel(item.type)} · published <time dateTime={item.mergedAt}>{formatWhen(item.mergedAt)}</time>
      </span>
    </li>
  );
}
