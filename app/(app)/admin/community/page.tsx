import type { Metadata } from "next";
import Link from "next/link";
import { PersonAvatar } from "@/components/community/PersonAvatar";
import { Button } from "@/components/core/Button.jsx";
import { Chip } from "@/components/core/Chip.jsx";
import { EmptyState } from "@/components/feedback/EmptyState.jsx";
import { communityRoleLabel, formatWhen, reviewReasonLabel } from "@/lib/community-copy";
import { listNicheOptions, loadAdminCommunity } from "@/lib/data/community-admin";
import { requireAdmin } from "@/lib/require-admin";
import { RoleButton } from "../../open-source/_components/RoleButton";
import { AdminSectionNav } from "../_components/AdminSectionNav";
import { GrantRole } from "./_components/GrantRole";

export const metadata: Metadata = { title: "Community" };

const DAY_MS = 24 * 60 * 60 * 1000;

function ageOf(iso: string | null, now: number) {
  if (!iso) return "—";
  const days = Math.floor((now - new Date(iso).getTime()) / DAY_MS);
  if (days <= 0) return "Today";
  return days === 1 ? "1 day" : `${days} days`;
}

export default async function AdminCommunityPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await requireAdmin();
  const query = await searchParams;
  const q = typeof query.q === "string" ? query.q : "";
  const [data, niches] = await Promise.all([loadAdminCommunity(q), listNicheOptions()]);
  const now = Date.now();

  return (
    <div className="sf-admin-page">
      <header className="sf-page-head">
        <AdminSectionNav current="community" />
        <h1>Community</h1>
        <p>Open Source review load, roles, and posts taken off the public list.</p>
      </header>

      <section aria-labelledby="admin-community-niches" className="sf-os-admin-section">
        <h2 id="admin-community-niches">Niches</h2>
        <form className="sf-community-filters" method="get" action="/admin/community">
          <label>
            Find a niche
            <input type="search" name="q" defaultValue={q} maxLength={80} placeholder="Niche name" />
          </label>
          <div>
            <Button type="submit" size="sm" variant="outline">
              Search
            </Button>
          </div>
        </form>
        {data.niches.length === 0 ? (
          <EmptyState compact icon="search" title={q ? "No niche matches that name" : "No community activity yet"} description="Niches appear here once someone contributes or holds a role." />
        ) : (
          <table className="sf-admin-table sf-os-table">
            <caption className="sf-sr">{q ? `Niches matching ${q}` : "Niches with community activity or roles"}</caption>
            <thead>
              <tr>
                <th scope="col">Niche</th>
                <th scope="col">Open</th>
                <th scope="col">Oldest open</th>
                <th scope="col">Reviewers</th>
                <th scope="col">Maintainers</th>
                <th scope="col">Merged</th>
              </tr>
            </thead>
            <tbody>
              {data.niches.map((niche) => (
                <tr key={niche.id}>
                  <th scope="row" data-label="Niche">
                    <Link href={`/open-source/${niche.slug}?tab=maintainers`}>{niche.name}</Link>
                  </th>
                  <td data-label="Open">
                    {niche.open > 0 ? <Link href={`/open-source/review?niche=${niche.slug}`}>{niche.open}</Link> : 0}
                  </td>
                  <td data-label="Oldest open">{ageOf(niche.oldestOpen, now)}</td>
                  <td data-label="Reviewers">{niche.reviewers}</td>
                  <td data-label="Maintainers">{niche.maintainers}</td>
                  <td data-label="Merged">{niche.merged}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section aria-labelledby="admin-community-grant" className="sf-os-admin-section">
        <h2 id="admin-community-grant">Grant a role</h2>
        <p className="sf-os-hint">Look someone up by their exact email address. Only their name and avatar are shown back.</p>
        <GrantRole niches={niches} />
      </section>

      <section aria-labelledby="admin-community-roles" className="sf-os-admin-section">
        <h2 id="admin-community-roles">Roles{q ? ` in niches matching “${q}”` : ""}</h2>
        {data.roles.length === 0 ? (
          <p className="sf-os-hint">Nobody holds a reviewer or maintainer role{q ? " in these niches" : ""}.</p>
        ) : (
          <table className="sf-admin-table sf-os-table">
            <caption className="sf-sr">Reviewers and maintainers</caption>
            <thead>
              <tr>
                <th scope="col">Person</th>
                <th scope="col">Niche</th>
                <th scope="col">Role</th>
                <th scope="col">Granted</th>
                <th scope="col">Revoke</th>
              </tr>
            </thead>
            <tbody>
              {data.roles.map((member) => (
                <tr key={member.roleId}>
                  <th scope="row" data-label="Person">
                    <Link className="sf-os-person-link" href={`/profile/${member.userId}`}>
                      <PersonAvatar name={member.name} image={member.image} />
                    </Link>
                  </th>
                  <td data-label="Niche">{member.skill.name}</td>
                  <td data-label="Role">
                    <Chip tone={member.role === "MAINTAINER" ? "accent" : "neutral"}>{communityRoleLabel(member.role)}</Chip>
                  </td>
                  <td data-label="Granted">
                    <time dateTime={member.grantedAt}>{formatWhen(member.grantedAt)}</time>
                    {member.grantedBy ? ` · by ${member.grantedBy}` : ""}
                  </td>
                  <td data-label="Revoke">
                    {member.userId === session.user.id ? (
                      <span className="sf-os-hint">Your own role</span>
                    ) : (
                      <RoleButton op="revoke" userId={member.userId} skillId={member.skill.id} role={member.role} label="Revoke" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section aria-labelledby="admin-community-unmerges" className="sf-os-admin-section">
        <h2 id="admin-community-unmerges">Recently hidden</h2>
        {data.unmerges.length === 0 ? (
          <p className="sf-os-hint">No published post has been hidden.</p>
        ) : (
          <table className="sf-admin-table sf-os-table">
            <caption className="sf-sr">The last 20 hidden posts</caption>
            <thead>
              <tr>
                <th scope="col">Contribution</th>
                <th scope="col">Niche</th>
                <th scope="col">By</th>
                <th scope="col">Reason</th>
                <th scope="col">Date</th>
              </tr>
            </thead>
            <tbody>
              {data.unmerges.map((row) => (
                <tr key={row.id}>
                  <th scope="row" data-label="Contribution">
                    <Link href={`/open-source/${row.contribution.skill.slug}/c/${row.contribution.id}`}>{row.contribution.title}</Link>
                  </th>
                  <td data-label="Niche">{row.contribution.skill.name}</td>
                  <td data-label="By">{row.by}</td>
                  <td data-label="Reason">
                    {row.reason ? reviewReasonLabel(row.reason) : "—"}
                    {row.feedback ? <span className="sf-os-hint"> · {row.feedback}</span> : null}
                  </td>
                  <td data-label="Date">
                    <time dateTime={row.at}>{formatWhen(row.at)}</time>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
