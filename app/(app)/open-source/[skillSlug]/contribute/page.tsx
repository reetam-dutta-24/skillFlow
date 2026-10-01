import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { COMMUNITY_LABEL } from "@/lib/community-copy";
import { loadCommunityNiches } from "@/lib/data/community";
import { contributeOptions } from "@/lib/data/community-me";
import { ContributeForm } from "../../_components/ContributeForm";

type PageProps = {
  params: Promise<{ skillSlug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { skillSlug } = await params;
  const niches = await loadCommunityNiches();
  const niche = niches.find((item) => item.slug === skillSlug);
  return { title: niche ? `Contribute · ${niche.name}` : "Contribute" };
}

export default async function ContributePage({ params, searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { skillSlug } = await params;
  const query = await searchParams;
  const niches = await loadCommunityNiches();
  const niche = niches.find((item) => item.slug === skillSlug);
  if (!niche) notFound();
  const options = await contributeOptions({ id: niche.id, slug: niche.slug, status: niche.status });
  const gap = Array.isArray(query.gap) ? query.gap[0] : query.gap;

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
        <p>
          <Link className="sf-community-text-link" href="/open-source/me">
            My contributions
          </Link>
        </p>
      </header>
      <ContributeForm
        skillId={niche.id}
        slug={niche.slug}
        communityName={niche.name}
        niches={niches.map((item) => ({ slug: item.slug, name: item.name }))}
        stages={options.stages}
        gaps={options.gaps}
        gapId={gap}
      />
    </div>
  );
}
