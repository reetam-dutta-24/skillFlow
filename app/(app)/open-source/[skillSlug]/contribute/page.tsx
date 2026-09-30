import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { EmptyState } from "@/components/feedback/EmptyState.jsx";
import { auth } from "@/lib/auth";
import { COMMUNITY_LABEL } from "@/lib/community-copy";
import { loadCommunityNiches } from "@/lib/data/community";

type PageProps = { params: Promise<{ skillSlug: string }> };

export const metadata: Metadata = { title: "Contribute" };

export default async function ContributePage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { skillSlug } = await params;
  const niches = await loadCommunityNiches();
  const niche = niches.find((item) => item.slug === skillSlug);
  if (!niche) notFound();

  return (
    <div className="sf-dash">
      <header className="sf-page-head">
        <p>
          <Link className="sf-roadmap-link" href={`/open-source/${niche.slug}`}>
            {niche.name}
          </Link>
        </p>
        <h1>Contribute</h1>
        <p className="sf-community-label">{COMMUNITY_LABEL}</p>
      </header>
      <EmptyState
        icon="file-plus"
        title="The form is next"
        description="Title, an optional image, sources, the description, this niche, and the community name will be the fields."
      />
    </div>
  );
}
