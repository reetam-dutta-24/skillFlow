import type { Metadata } from "next";
import Link from "next/link";
import { openThrough } from "@/lib/learner";
import { prisma } from "@/lib/prisma";
import { requireLearner } from "@/lib/require-learner";
import { DashFrame } from "@/components/dashboard/DashFrame";
import { PathList } from "@/components/dashboard/PathList.jsx";
import { EmptyState } from "@/components/feedback/EmptyState.jsx";

export const metadata: Metadata = {
  title: "Path",
};

export default async function PathPage() {
  const { profile, choice, progress } = await requireLearner();
  const skill = await prisma.skill.findUnique({
    where: { slug: profile.skillSlug },
    include: { stages: { orderBy: { order: "asc" } } },
  });
  const through = openThrough(profile.pace, progress?.currentStageOrder ?? 1);
  const stages = (skill?.stages ?? []).map((stage) => ({
    order: stage.order,
    title: stage.title,
    description: stage.description,
    open: stage.order <= through,
  }));

  return (
    <DashFrame accent={profile.accent}>
      <p className="sf-path-back">
        <Link href="/dashboard">Home</Link>
      </p>
      <h1 className="sf-path-heading">{choice.title}</h1>
      {stages.length ? (
        <PathList stages={stages} />
      ) : (
        <EmptyState
          icon="route"
          title="This path is not ready yet."
          description="Your preference is saved. Stages will show up here when the roadmap is ready."
        />
      )}
    </DashFrame>
  );
}
