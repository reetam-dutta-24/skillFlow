import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { loadPublicCatalog, publicSkillName } from "@/lib/data/public-catalog";
import { getRoadmap } from "@/lib/data/roadmap";
import { readLearningPlan } from "@/lib/plan/store";
import { SEQUENCE_LOCK } from "@/lib/progress/sequence";
import type { RoadmapStageView, StageStatus } from "@/lib/types/domain";
import { EmptyState } from "@/components/feedback/EmptyState.jsx";
import { RoadmapStage } from "@/components/learning/RoadmapStage.jsx";
import { PlanBoard } from "./_components/PlanBoard";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const catalog = await loadPublicCatalog();
  return catalog.map((entry) => ({ slug: entry.skill.slug }));
}

function stageStatus(status: StageStatus) {
  if (status === "passed") return "done" as const;
  if (status === "in_progress") return "active" as const;
  if (status === "ready") return "todo" as const;
  return "locked" as const;
}

function stageMeta(stage: RoadmapStageView, planNote: string) {
  if (stage.status === "locked") return "Locked";
  const lessons =
    stage.lessonCount === 0 ? "No lessons yet" : stage.lessonCount === 1 ? "1 lesson" : `${stage.lessonCount} lessons`;
  const parts = [lessons];
  if (stage.hasExplainBack) parts.push("explain-back");
  if (planNote) parts.push(planNote);
  return parts.join(" · ");
}

function unlockHint(stage: RoadmapStageView) {
  if (stage.description === SEQUENCE_LOCK && stage.previousStageTitle) {
    return `Pass ${stage.previousStageTitle} to open this stage.`;
  }
  if (stage.previousStageTitle) return "The last part of this free path stays locked.";
  return "This stage is not open yet.";
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const name = await publicSkillName(slug);
  return { title: name ?? "Page not found" };
}

export default async function RoadmapDetailPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { slug } = await params;
  const data = await getRoadmap(slug);
  if (!data) notFound();
  const learning = data.skill.followed ? await readLearningPlan(session.user.id, data.skill.id) : null;
  const showPlan = Boolean(learning?.applied);
  const planById = new Map(showPlan ? learning?.plan.stages.map((stage) => [stage.id, stage]) ?? [] : []);

  const summary = data.stages.length
    ? [data.skill.offer === "FREE" ? "This path is free." : null, data.skill.description, `${data.currentPosition}. ${data.skill.masteryPercent}% mastery.`]
        .filter(Boolean)
        .join(" ")
    : [data.skill.offer === "FREE" ? "This path is free." : null, data.skill.description].filter(Boolean).join(" ");

  return (
    <div className="sf-dash">
      <header className="sf-page-head">
        <p>
          <Link className="sf-roadmap-link" href="/roadmap">
            All roadmaps
          </Link>
          {" · "}
          <Link className="sf-roadmap-link" href={`/open-source/${data.skill.slug}`}>
            Open Source
          </Link>
        </p>
        <h1>{data.skill.name}</h1>
        {summary ? <p>{summary}</p> : null}
        {data.skill.followed && !learning ? (
          <p className="sf-notes-actions">
            <Link href={`/roadmap/${slug}/preferences`}>Set up your plan</Link>
          </p>
        ) : null}
      </header>
      {learning ? <PlanBoard slug={slug} skillId={data.skill.id} plan={learning.plan} applied={learning.applied} /> : null}
      {data.stages.length === 0 ? (
        <EmptyState
          icon="route"
          title={data.skill.offer === "MONETIZED" ? "Premium" : "This path is not ready yet"}
          description={
            data.skill.offer === "MONETIZED"
              ? "This path is Premium."
              : "Stages for this skill are not available yet."
          }
        />
      ) : (
        <ol className="sf-roadmap">
          {data.stages.map((stage, index) => {
            const status = stageStatus(stage.status);
            const planned = planById.get(stage.id);
            const labelNote = planned?.label === "test_out"
              ? "Test out"
              : planned?.label === "review"
                ? "Recommended to review"
                : "";
            const note = [labelNote, planned?.languageNote ?? ""].filter(Boolean).join(" · ");
            return (
              <RoadmapStage
                key={stage.id}
                index={stage.order}
                title={stage.title}
                image={stage.image ?? undefined}
                description={stage.description}
                status={status}
                mastery={stage.masteryPercent > 0 ? stage.masteryPercent : undefined}
                meta={stageMeta(stage, status === "locked" ? "" : note)}
                unlockHint={status === "locked" ? unlockHint(stage) : undefined}
                last={index === data.stages.length - 1}
                href={status === "locked" ? undefined : `/lesson/${stage.id}`}
              />
            );
          })}
        </ol>
      )}
    </div>
  );
}
