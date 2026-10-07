import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { FocusMode } from "@/components/learning/FocusMode";
import { auth } from "@/lib/auth";
import { getMilestone } from "@/lib/data/milestone";
import { ExplainBackForm } from "./_components/ExplainBackForm";
import { ExplainWizard } from "./_components/ExplainWizard";

type PageProps = {
  params: Promise<{ stageId: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { stageId } = await params;
  const data = await getMilestone(stageId);
  if (!data) return { title: "Page not found" };
  if (data.kind === "locked") return { title: "Explain-back" };
  return { title: data.stage.title };
}

function Crumbs({ slug, name, order, stageId }: { slug: string; name: string; order: number; stageId: string }) {
  return (
    <nav className="sf-crumbs" aria-label="Breadcrumb">
      <Link href="/roadmap">Paths</Link>
      <span aria-hidden="true">/</span>
      <Link href={`/roadmap/${slug}`}>{name}</Link>
      <span aria-hidden="true">/</span>
      <Link href={`/lesson/${stageId}`}>Stage {order}</Link>
      <span aria-hidden="true">/</span>
      <span aria-current="page">Explain-back</span>
    </nav>
  );
}

export default async function MilestonePage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { stageId } = await params;
  const data = await getMilestone(stageId, session.user.id);
  if (!data) notFound();

  if (data.kind === "locked") redirect(`/roadmap/${data.skillSlug}`);

  if (data.kind === "passed") {
    return (
      <div className="sf-milestone">
        <FocusMode />
        <Crumbs slug={data.skill.slug} name={data.skill.name} order={data.stage.order} stageId={data.stage.id} />
        <header className="sf-milestone-head">
          <p>{data.skill.name}</p>
          <h1>{data.stage.title}</h1>
        </header>
        <p className="sf-explain-checkin">There is no timer and no score. This is a check-in.</p>
        <section className="sf-explain-saved" aria-labelledby="saved-question">
          <h2 id="saved-question">{data.prompt.question}</h2>
          <p>{data.acceptedExplanation}</p>
        </section>
        <Link className="sf-milestone-cta" href={data.continueHref}>
          Continue
        </Link>
        <p>
          <Link href={`/transcript/${session.user.id}/${data.skill.slug}`}>Transcript for this path</Link>
        </p>
      </div>
    );
  }

  return (
    <div className="sf-milestone">
      <FocusMode />
      <Crumbs slug={data.skill.slug} name={data.skill.name} order={data.stage.order} stageId={data.stage.id} />
      {data.concepts.length > 0 ? (
        <ExplainWizard
          stageId={data.stage.id}
          stageLabel={`${data.skill.name} · ${data.stage.title}`}
          concepts={data.concepts}
          continueHref={data.continueHref}
          continueLabel={data.continueLabel}
        />
      ) : (
        <ExplainBackForm
          stageId={data.stage.id}
          stageLabel={`${data.skill.name} · ${data.stage.title}`}
          question={data.prompt.question}
          concepts={data.concepts}
          continueHref={data.continueHref}
          continueLabel={data.continueLabel}
        />
      )}
    </div>
  );
}
