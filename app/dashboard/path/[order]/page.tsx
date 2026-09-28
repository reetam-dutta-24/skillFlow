import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { openThrough } from "@/lib/learner";
import { prisma } from "@/lib/prisma";
import { requireLearner } from "@/lib/require-learner";
import { DashFrame } from "@/components/dashboard/DashFrame";
import { EmptyState } from "@/components/feedback/EmptyState.jsx";

type StagePageProps = {
  params: Promise<{ order: string }>;
};

export async function generateMetadata({ params }: StagePageProps): Promise<Metadata> {
  const { order } = await params;
  return { title: `Stage ${order}` };
}

export default async function StagePage({ params }: StagePageProps) {
  const { order } = await params;
  const stageOrder = Number(order);
  if (!Number.isInteger(stageOrder) || stageOrder < 1) notFound();

  const { profile, progress } = await requireLearner();
  const skill = await prisma.skill.findUnique({
    where: { slug: profile.skillSlug },
    include: {
      stages: {
        where: { order: stageOrder },
        include: { resources: { orderBy: { order: "asc" } } },
      },
    },
  });
  const stage = skill?.stages[0];
  if (!stage) notFound();

  const through = openThrough(profile.pace, progress?.currentStageOrder ?? 1);
  if (stage.order > through) redirect("/dashboard/path");

  return (
    <DashFrame accent={profile.accent}>
      <p className="sf-path-back">
        <Link href="/dashboard/path">Path</Link>
      </p>
      <p className="sf-stage-kicker">Stage {String(stage.order).padStart(2, "0")}</p>
      <h1 className="sf-path-heading">{stage.title}</h1>
      {stage.description ? <p className="sf-stage-lead">{stage.description}</p> : null}
      {stage.resources.length ? (
        <ul className="sf-stage-resources">
          {stage.resources.map((resource) => (
            <li key={resource.id}>
              <h2>{resource.title}</h2>
              {resource.description ? <p>{resource.description}</p> : null}
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          icon="book-open"
          title="This lesson is not ready yet."
          description="The stage is open. The lesson will show up here when it is written."
        />
      )}
    </DashFrame>
  );
}
