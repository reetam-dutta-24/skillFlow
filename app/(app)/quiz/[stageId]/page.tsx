import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getQuiz, QUIZ_PASS_THRESHOLD } from "@/lib/data/quiz";
import { EmptyState } from "@/components/feedback/EmptyState.jsx";
import { QuizFailure } from "./_components/QuizFailure";
import { QuizFlow } from "./_components/QuizFlow";

type PageProps = {
  params: Promise<{ stageId: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { stageId } = await params;
  const data = await getQuiz(stageId);
  if (!data) return { title: "Page not found" };
  if (data.kind === "unavailable") return { title: "Quiz" };
  if (data.kind === "locked") return { title: data.stageTitle };
  return { title: data.stage.title };
}

export default async function QuizPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { stageId } = await params;
  const data = await getQuiz(stageId);
  if (!data) notFound();

  if (data.kind === "unavailable") {
    return (
      <div className="sf-quiz">
        <QuizFailure />
      </div>
    );
  }

  if (data.kind === "locked") {
    const hint = data.previousStageTitle
      ? `Complete the explain-back check on ${data.previousStageTitle} to unlock.`
      : "This stage is not open yet.";
    return (
      <div className="sf-quiz">
        <p>
          <Link className="sf-roadmap-link" href={`/roadmap/${data.skillSlug}`}>
            Back to the path
          </Link>
        </p>
        <EmptyState icon="lock" titleAs="h1" title={data.stageTitle} description={`${data.skillName}. ${hint}`} />
      </div>
    );
  }

  return (
    <div className="sf-quiz">
      <p>
        <Link className="sf-roadmap-link" href={`/roadmap/${data.skill.slug}`}>
          Back to the path
        </Link>
      </p>
      <header className="sf-quiz-head">
        <p>{data.skill.name}</p>
        <h1>{data.stage.title}</h1>
      </header>
      <QuizFlow
        passThreshold={QUIZ_PASS_THRESHOLD}
        lessonHref={`/lesson/${data.stage.id}`}
        explainHref={`/milestone/${data.stage.id}`}
        questions={data.quiz.questions.map((question) => ({
          id: question.id,
          prompt: question.prompt,
          sourceTitle: question.sourceTitle,
          explanation: question.explanation,
          correctOptionId: question.correctOptionId,
          options: question.options.map((option) => ({ id: option.id, label: option.label })),
        }))}
      />
    </div>
  );
}
