import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { COMMUNITY_LABEL } from "@/lib/community-copy";
import { loadCommunityNiches } from "@/lib/data/community";
import { loadPublicCatalog } from "@/lib/data/public-catalog";
import { ContributeForm } from "../../_components/ContributeForm";

type PageProps = { params: Promise<{ skillSlug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { skillSlug } = await params;
  const niches = await loadCommunityNiches();
  const niche = niches.find((item) => item.slug === skillSlug);
  return { title: niche ? `Contribute · ${niche.name}` : "Contribute" };
}

export default async function ContributePage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { skillSlug } = await params;
  const [niches, catalog] = await Promise.all([loadCommunityNiches(), loadPublicCatalog()]);
  const niche = niches.find((item) => item.slug === skillSlug);
  if (!niche) notFound();
  const stages = catalog.find((entry) => entry.skill.slug === skillSlug)?.stages ?? [];

  return (
    <div className="sf-dash">
      <header className="sf-page-head">
        <p>
          <Link className="sf-roadmap-link" href={`/open-source/${niche.slug}`}>
            {niche.name}
          </Link>
        </p>
        <h1>Add a contribution</h1>
        <p className="sf-community-label">{COMMUNITY_LABEL}</p>
      </header>
      <ContributeForm
        skillId={niche.id}
        slug={niche.slug}
        communityName={niche.name}
        niches={niches.map((item) => ({ slug: item.slug, name: item.name }))}
        stages={niche.status === "available" ? stages.map((stage) => ({ id: stage.id, order: stage.order, title: stage.title })) : []}
      />
    </div>
  );
}
