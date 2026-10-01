import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { COMMUNITY_LABEL } from "@/lib/community-copy";
import { contributeOptions, loadMyContribution } from "@/lib/data/community-me";
import { ContributeForm, type ContributionDraft } from "../../../_components/ContributeForm";

export const metadata: Metadata = { title: "Edit contribution · Open Source" };

function draftSteps(value: unknown): ContributionDraft["steps"] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((step) => {
    if (!step || typeof step !== "object") return [];
    const row = step as { title?: unknown; url?: unknown; note?: unknown };
    return [
      {
        title: typeof row.title === "string" ? row.title : "",
        url: typeof row.url === "string" ? row.url : "",
        note: typeof row.note === "string" ? row.note : "",
      },
    ];
  });
}

export default async function EditContributionPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;
  const row = await loadMyContribution(session.user.id, id);
  // Closed is read-only. The service refuses it as well.
  if (!row || row.status === "CLOSED") notFound();

  const options = await contributeOptions({ id: row.skillId, slug: row.skill.slug, status: row.skill.status }, row.gapId);
  const draft: ContributionDraft = {
    id: row.id,
    type: row.type,
    title: row.title,
    description: row.body ?? row.summary,
    imageUrl: row.imageUrl,
    sources: row.sources,
    tags: row.tags,
    stageId: row.stageId,
    gapId: row.gapId,
    disclosure: row.disclosure,
    steps: draftSteps(row.steps),
    resubmit: row.status === "MERGED",
  };

  return (
    <div className="sf-dash">
      <header className="sf-page-head">
        <p>
          <Link className="sf-roadmap-link" href={`/open-source/me/${row.id}`}>
            Back to the contribution
          </Link>
        </p>
        <h1>{draft.resubmit ? "Resubmit a contribution" : "Edit contribution"}</h1>
        <p className="sf-community-label">{COMMUNITY_LABEL}</p>
      </header>
      <ContributeForm
        skillId={row.skillId}
        slug={row.skill.slug}
        communityName={row.skill.name}
        niches={[]}
        stages={options.stages}
        gaps={options.gaps}
        draft={draft}
      />
    </div>
  );
}
