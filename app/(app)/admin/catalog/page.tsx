import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { SkillImage } from "@/components/core/SkillImage";
import { Icon } from "@/components/core/Icon.jsx";
import { requireAdmin } from "@/lib/require-admin";
import { getCmsNiche, listCmsNiches } from "@/lib/data/catalog-admin";
import { AdminSectionNav } from "../_components/AdminSectionNav";
import { cmsHref } from "./_components/cms/href";
import { NicheForm } from "./_components/cms/NicheForm";
import { NicheList } from "./_components/cms/NicheList";
import { ResourceForm } from "./_components/cms/ResourceForm";
import { ResourceTable } from "./_components/cms/ResourceTable";
import { StageForm } from "./_components/cms/StageForm";
import { StageTable } from "./_components/cms/StageTable";

export const metadata: Metadata = { title: "Catalog CMS" };

type Search = { niche?: string; tab?: string; stage?: string; resource?: string; create?: string };

export default function AdminCatalogPage({ searchParams }: { searchParams: Promise<Search> }) {
  return (
    <div className="sf-admin-page sf-cms">
      <header className="sf-page-head">
        <AdminSectionNav current="catalog" />
        <h1>Catalog CMS</h1>
        <p>Create, edit, reorder, and delete niches, stages, and resources. Changes reach learners right away.</p>
      </header>
      <Suspense fallback={<p className="sf-review-live">Loading the catalog</p>}>
        <CmsBody searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

/** Admin only, and everything here changes with each edit, so it is read on the request. */
async function CmsBody({ searchParams }: { searchParams: Promise<Search> }) {
  await requireAdmin();
  const query = await searchParams;
  const [niches, niche] = await Promise.all([listCmsNiches(), query.niche ? getCmsNiche(query.niche) : Promise.resolve(null)]);
  const stage = niche && query.stage && query.stage !== "new" ? niche.stages.find((item) => item.id === query.stage) ?? null : null;
  const resource = stage && query.resource && query.resource !== "new" ? stage.resources.find((item) => item.id === query.resource) ?? null : null;
  const creatingNiche = query.create === "niche";
  const creatingStage = Boolean(niche) && query.stage === "new";
  const creatingResource = Boolean(stage) && query.resource === "new";
  const tab = query.tab === "details" ? "details" : "stages";

  const crumbs: { label: string; href?: string }[] = [{ label: "Catalog", href: cmsHref({}) }];
  if (creatingNiche) crumbs.push({ label: "New niche" });
  if (niche) crumbs.push({ label: niche.name, href: cmsHref({ niche: niche.slug }) });
  if (creatingStage) crumbs.push({ label: "New stage" });
  if (stage) crumbs.push({ label: `Stage ${stage.order}`, href: cmsHref({ niche: niche!.slug, stage: stage.id }) });
  if (creatingResource) crumbs.push({ label: "New resource" });
  if (resource) crumbs.push({ label: resource.title });

  const totals = niches.reduce(
    (sum, row) => ({ stages: sum.stages + row.stages, resources: sum.resources + row.resources, review: sum.review + row.needsReview }),
    { stages: 0, resources: 0, review: 0 },
  );

  return (
    <div className="sf-cms-layout">
      <NicheList niches={niches} current={niche?.slug ?? null} />
      <main className="sf-cms-main" aria-label="Editor">
        <nav className="sf-cms-crumbs" aria-label="Breadcrumb">
          <ol>
            {crumbs.map((crumb, index) => (
              <li key={`${crumb.label}-${index}`}>
                {crumb.href && index < crumbs.length - 1 ? <Link href={crumb.href}>{crumb.label}</Link> : <span aria-current="page">{crumb.label}</span>}
              </li>
            ))}
          </ol>
        </nav>

        {creatingNiche ? (
          <>
            <h2 className="sf-cms-title">New niche</h2>
            <NicheForm niche={null} />
          </>
        ) : !niche ? (
          query.niche ? (
            <p className="sf-cms-empty">That niche does not exist. Pick one from the list.</p>
          ) : (
            <section className="sf-cms-overview" aria-labelledby="cms-overview">
              <h2 id="cms-overview" className="sf-cms-title">
                Overview
              </h2>
              <ul className="sf-cms-totals">
                <li>
                  <strong>{niches.length}</strong> niches
                </li>
                <li>
                  <strong>{niches.filter((row) => row.free).length}</strong> free paths
                </li>
                <li>
                  <strong>{totals.stages}</strong> stages
                </li>
                <li>
                  <strong>{totals.resources}</strong> resources
                </li>
                <li className={totals.review ? "is-warn" : undefined}>
                  <strong>{totals.review}</strong> need review
                </li>
              </ul>
              <p className="sf-cms-section-note">Pick a niche on the left to edit its details, stages, and resources, or create a new one.</p>
            </section>
          )
        ) : creatingResource || resource ? (
          <>
            <h2 className="sf-cms-title">{resource ? `Edit resource` : `New resource on stage ${stage!.order}`}</h2>
            <ResourceForm niche={niche} stage={stage!} resource={resource} />
          </>
        ) : creatingStage || stage ? (
          <>
            <h2 className="sf-cms-title">{stage ? `Stage ${stage.order}: ${stage.title}` : `New stage ${niche.stages.length + 1}`}</h2>
            {stage && stage.learners > 0 ? (
              <p className="sf-cms-note">
                <Icon name="users" size={14} /> {stage.learners} learner records point at this stage. Edits are safe; deleting is not available.
              </p>
            ) : null}
            <StageForm key={stage?.id ?? "new"} niche={niche} stage={stage} />
            {stage ? <ResourceTable niche={niche} stage={stage} /> : null}
          </>
        ) : (
          <>
            <header className="sf-cms-niche-head">
              <span className="sf-cms-niche-photo">{niche.image ? <SkillImage src={niche.image} alt="" fill sizes="120px" /> : null}</span>
              <div>
                <h2 className="sf-cms-title">{niche.name}</h2>
                <p className="sf-cms-niche-chips">
                  <span className={niche.free ? "sf-cms-tag is-free" : "sf-cms-tag"}>{niche.free ? "Free path" : "Premium"}</span>
                  <span className="sf-cms-tag">{niche.status === "AVAILABLE" ? "Available" : "Coming soon"}</span>
                  {niche.flagship ? <span className="sf-cms-tag">Flagship</span> : null}
                  <span>/{niche.slug}</span>
                  <span>{niche.followers} followers</span>
                </p>
              </div>
              {niche.stages.length ? (
                <Link className="sf-btn sf-btn--outline sf-btn--sm" href={`/roadmap/${niche.slug}`}>
                  View path <Icon name="arrow-up-right" size={14} />
                </Link>
              ) : null}
            </header>
            <nav className="sf-cms-tabs" aria-label="Niche sections">
              <Link href={cmsHref({ niche: niche.slug })} aria-current={tab === "stages" ? "page" : undefined}>
                Stages · {niche.stages.length}
              </Link>
              <Link href={cmsHref({ niche: niche.slug, tab: "details" })} aria-current={tab === "details" ? "page" : undefined}>
                Details
              </Link>
            </nav>
            {tab === "details" ? <NicheForm key={niche.id} niche={niche} /> : <StageTable niche={niche} />}
          </>
        )}
      </main>
    </div>
  );
}
