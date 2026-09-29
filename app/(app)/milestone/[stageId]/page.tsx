import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getMilestone } from "@/lib/data/milestone";
import { EmptyState } from "@/components/feedback/EmptyState.jsx";
import { ExplainBackForm } from "./_components/ExplainBackForm";

type PageProps = {
  params: Promise<{ stageId: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { stageId } = await params;
  const data = await getMilestone(stageId);
  if (!data) return { title: "Page not found" };
  if (data.kind === "locked") return { title: "Explain-back" };
  if (data.kind === "quiz_required") return { title: data.stageTitle };
  return { title: data.stage.title };
}

export default async function MilestonePage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { stageId } = await params;
  const data = await getMilestone(stageId);
  if (!data) notFound();

  if (data.kind === "locked") redirect(`/roadmap/${data.skillSlug}`);

  if (data.kind === "quiz_required") {
    return (
      <div className="sf-milestone">
        <EmptyState
          icon="list-checks"
          titleAs="h1"
          title="Pass the quiz first"
          description={`${data.skillName}. ${data.stageTitle}. The explain-back check opens after the quiz. There is no timer and no score. This is a check-in.`}
          action={
            <Link className="sf-quiz-cta" href={data.quizHref}>
              Go to the quiz
            </Link>
          }
        />
      </div>
    );
  }

  if (data.kind === "passed") {
    return (
      <div className="sf-milestone">
        <p>
          <Link className="sf-roadmap-link" href={`/roadmap/${data.skill.slug}`}>
            Back to the path
          </Link>
        </p>
        <header className="sf-quiz-head">
          <p>{data.skill.name}</p>
          <h1>{data.stage.title}</h1>
        </header>
        <p className="sf-explain-checkin">There is no timer and no score. This is a check-in.</p>
        <section className="sf-explain-saved" aria-labelledby="saved-question">
          <h2 id="saved-question">{data.prompt.question}</h2>
          <p>{data.acceptedExplanation}</p>
        </section>
        <Link className="sf-quiz-cta" href={data.continueHref}>
          Continue
        </Link>
      </div>
    );
  }

  return (
    <div className="sf-milestone">
      <p>
        <Link className="sf-roadmap-link" href={`/roadmap/${data.skill.slug}`}>
          Back to the path
        </Link>
      </p>
      <ExplainBackForm
        stageId={data.stage.id}
        stageLabel={`${data.skill.name} · ${data.stage.title}`}
        question={data.prompt.question}
        continueHref={data.continueHref}
        continueLabel={data.continueLabel}
      />
    </div>
  );
}
