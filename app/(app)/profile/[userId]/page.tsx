import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ContributionHeatmap } from "@/components/community/ContributionHeatmap";
import { Chip } from "@/components/core/Chip.jsx";
import { EmptyState } from "@/components/feedback/EmptyState.jsx";
import { auth } from "@/lib/auth";
import { communityRoleLabel, contributionTypeLabel, formatWhen } from "@/lib/community-copy";
import { loadContributorProfile } from "@/lib/data/community";
import { loadPublicCreatorProfile } from "@/lib/data/creator";
import { ProfileWorks } from "./_components/ProfileWorks";

export const metadata: Metadata = { title: "Profile" };

/** Merged contributions shown per niche before "Show more". */
const PER_NICHE = 5;

export default async function ProfilePage({ params }: { params: Promise<{ userId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const { userId } = await params;
  // Both are public and cached: creator works under the catalog tag, Open Source work under the community tag.
  const [profile, community] = await Promise.all([loadPublicCreatorProfile(userId), loadContributorProfile(userId)]);
  if (!profile) notFound();
  const mine = session.user.id === profile.id;

  return (
    <div className="sf-creator-page">
      <header className="sf-page-head">
        <h1>{profile.name}</h1>
        <p className="sf-community-chips">
          {profile.works.length > 0 ? <Chip tone="accent">Creator</Chip> : null}
          {community?.contributor ? <Chip tone="accent">Contributor</Chip> : null}
          {community?.roles.map((role) => (
            <Chip key={`${role.role}-${role.slug}`} tone="neutral">
              {communityRoleLabel(role.role)} · {role.name}
            </Chip>
          ))}
        </p>
        {mine ? (
          <p className="sf-community-actions">
            <Link className="sf-community-text-link" href="/creator">
              Open creator studio
            </Link>
            <Link className="sf-community-text-link" href="/open-source/me">
              My contributions
            </Link>
          </p>
        ) : null}
      </header>

      <section className="sf-profile-section" aria-labelledby="profile-videos">
        <h2 id="profile-videos">Videos</h2>
        <p className="sf-os-hint">Live videos from this profile. Each one also sits in its niche on Clips.</p>
        {profile.works.length === 0 ? (
          <EmptyState
            compact
            icon="video"
            title="No published videos yet"
            description={mine ? "Send a video for review from Creator studio. It shows here after it is approved." : "This profile has no live videos."}
          />
        ) : (
          <ProfileWorks works={profile.works} />
        )}
      </section>

      <section className="sf-profile-section" aria-labelledby="profile-open-source">
        <h2 id="profile-open-source">Open Source</h2>
        {community ? <ContributionHeatmap heatmap={community.heatmap} headingId="profile-heatmap-total" /> : null}
        {!community || community.niches.length === 0 ? (
          <EmptyState
            compact
            icon="git-pull-request"
            title="No merged contributions yet"
            description={mine ? "Share something in a niche you know. It shows here once a reviewer merges it." : "Merged contributions will show here."}
          />
        ) : (
          <div className="sf-profile-niches">
            {community.niches.map((niche) => {
              const first = niche.contributions.slice(0, PER_NICHE);
              const rest = niche.contributions.slice(PER_NICHE);
              return (
                <section key={niche.slug} aria-labelledby={`profile-niche-${niche.slug}`}>
                  <h3 id={`profile-niche-${niche.slug}`}>
                    <Link href={`/open-source/${niche.slug}`}>{niche.name}</Link>{" "}
                    <span className="sf-os-hint">· {niche.contributions.length} merged</span>
                  </h3>
                  <ul className="sf-profile-contributions">
                    {first.map((item) => (
                      <ProfileContribution key={item.id} slug={niche.slug} item={item} />
                    ))}
                  </ul>
                  {rest.length > 0 ? (
                    <details className="sf-os-closed">
                      <summary>Show {rest.length} more</summary>
                      <ul className="sf-profile-contributions">
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
      </section>
    </div>
  );
}

function ProfileContribution({ slug, item }: { slug: string; item: { id: string; title: string; type: string; mergedAt: string } }) {
  return (
    <li>
      <Link href={`/open-source/${slug}/c/${item.id}`}>{item.title}</Link>
      <span className="sf-os-hint">
        {contributionTypeLabel(item.type)} · merged <time dateTime={item.mergedAt}>{formatWhen(item.mergedAt)}</time>
      </span>
    </li>
  );
}
