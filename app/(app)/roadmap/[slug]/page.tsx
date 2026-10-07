import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { viewerHasPremium } from "@/lib/billing/access";
import { loadPublicCatalog, publicSkillName } from "@/lib/data/public-catalog";
import { getRoadmap } from "@/lib/data/roadmap";
import { readLearningPlan } from "@/lib/plan/store";
import type { RoadmapStageView, StageStatus } from "@/lib/types/domain";
import { SkillImage } from "@/components/core/SkillImage";
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
  if (stage.status === "locked" && !stage.personalLock) return "";
  const lessons =
    stage.lessonCount === 0 ? "No lessons yet" : stage.lessonCount === 1 ? "1 lesson" : `${stage.lessonCount} lessons`;
  const parts = [lessons];
  if (stage.hasExplainBack) parts.push("explain-back");
  if (planNote) parts.push(planNote);
  return parts.join(" · ");
}

function unlockHint(stage: RoadmapStageView) {
  if (stage.personalLock && stage.previousStageTitle) {
    return `Pass ${stage.previousStageTitle} to open this stage.`;
  }
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
  if (data.skill.offer === "MONETIZED" && !(await viewerHasPremium())) redirect("/upgrade");
  const learning = data.stages.length > 0 ? await readLearningPlan(session.user.id, data.skill.id) : null;
  const showPlan = Boolean(learning?.applied);
  const planById = new Map(showPlan ? learning?.plan.stages.map((stage) => [stage.id, stage]) ?? [] : []);

  const continueStage =
    data.stages.find((stage) => stage.status === "in_progress") ?? data.stages.find((stage) => stage.status === "ready");
  const passed = data.stages.filter((stage) => stage.status === "passed").length;

  return (
    <div className="sf-dash sf-path">
      <header className="sf-path-hero">
        <div>
          <p className="sf-path-crumb">
            <Link href="/roadmap">All roadmaps</Link>
            <span aria-hidden="true">/</span>
            <Link href={`/open-source/${data.skill.slug}`}>Open Source</Link>
          </p>
          <h1>{data.skill.name}</h1>
          {data.skill.description ? <p>{data.skill.description}</p> : null}
          {data.stages.length > 0 ? (
            <div className="sf-path-progress">
              <p>
                <span>{data.currentPosition}</span>
                <span>{data.skill.masteryPercent}% mastery</span>
                <span>
                  {passed} of {data.stages.length} passed
                </span>
              </p>
              <div className="sf-path-meter" role="img" aria-label={`${data.skill.masteryPercent}% mastery`}>
                <span style={{ width: `${Math.min(100, Math.max(0, data.skill.masteryPercent))}%` }} />
              </div>
            </div>
          ) : null}
          <div className="sf-path-actions">
            {data.skill.offer === "FREE" ? <span className="sf-path-pill">Free path</span> : <span className="sf-path-pill">Premium</span>}
            {continueStage ? (
              <Link className="sf-path-cta" href={`/lesson/${continueStage.id}`}>
                Continue
              </Link>
            ) : null}
          </div>
        </div>
        {data.skill.image ? (
          <SkillImage className="sf-path-cover" src={data.skill.image} alt="" width={640} height={360} sizes="(max-width: 640px) 100vw, 240px" />
        ) : null}
      </header>
      {data.stages.length > 0 && !learning ? (
        <section className="sf-plan-invite" aria-label="Set up your plan">
          <div>
            <p className="sf-path-kicker">Your plan</p>
            <h2>Shape this path around your time</h2>
            <p>Pick a pace, a language, and a deadline. The stages stay the same. The schedule fits the week you have.</p>
          </div>
          <Link className="sf-path-cta" href={`/roadmap/${slug}/preferences`}>
            Set up your plan
          </Link>
        </section>
      ) : null}
      {learning ? (
        <PlanBoard
          slug={slug}
          skillId={data.skill.id}
          plan={learning.plan}
          applied={learning.applied}
          closedIds={new Set(data.stages.filter((stage) => stageStatus(stage.status) === "locked").map((stage) => stage.id))}
        />
      ) : null}
      {data.stages.length === 0 ? (
        <EmptyState
          icon="route"
          title={data.skill.offer === "MONETIZED" ? "Premium path" : "This path is not ready yet"}
          description={
            data.skill.offer === "MONETIZED"
              ? "This path is on your account. Stages are not in the catalog yet."
              : "Stages for this skill are not available yet."
          }
        />
      ) : (
        <section className="sf-path-stages" aria-labelledby="path-stages">
          <h2 id="path-stages">Stages</h2>
        <ol className="sf-roadmap">
          {data.stages.map((stage, index) => {
            const status = stageStatus(stage.status);
            const planned = planById.get(stage.id);
            const labelNote = planned?.label === "test_out"
              ? "Test out"
              : planned?.label === "review"
                ? "Worth a review"
                : "";
            const note = [planned?.week ? `Week ${planned.week}` : "", labelNote].filter(Boolean).join(" · ");
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
        </section>
      )}
    </div>
  );
}
