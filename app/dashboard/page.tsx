import type { Metadata } from "next";
import { paceById, startingStages } from "@/lib/learner";
import { prisma } from "@/lib/prisma";
import { requireLearner } from "@/lib/require-learner";
import { DashFrame } from "@/components/dashboard/DashFrame";
import { ForYou } from "@/components/dashboard/ForYou.jsx";

export const metadata: Metadata = {
  title: "Home",
};

export default async function DashboardPage() {
  const { session, profile, choice } = await requireLearner();

  const skill = await prisma.skill.findUnique({
    where: { slug: profile.skillSlug },
    include: { stages: { orderBy: { order: "asc" } } },
  });
  const stages = startingStages(skill?.stages ?? [], paceById(profile.pace).id);

  return (
    <DashFrame accent={profile.accent}>
      <ForYou
        name={session.user.name ?? ""}
        skill={choice}
        pace={profile.pace}
        goal={profile.goal}
        stages={stages}
      />
    </DashFrame>
  );
}
