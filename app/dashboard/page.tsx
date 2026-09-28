import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { paceById, skillBySlug, startingStages } from "@/lib/learner";
import { prisma } from "@/lib/prisma";
import { ThemeToggle } from "@/components/forms/ThemeToggle.jsx";
import { AccentSync } from "@/components/dashboard/AccentSync.jsx";
import { ForYou } from "@/components/dashboard/ForYou.jsx";
import { SignOutButton } from "@/components/dashboard/SignOutButton.jsx";

export const metadata: Metadata = {
  title: "Home",
};

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const profile = await prisma.learnerProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!profile) redirect("/onboarding");

  const choice = skillBySlug(profile.skillSlug);
  if (!choice) redirect("/onboarding?edit=1");

  const skill = await prisma.skill.findUnique({
    where: { slug: profile.skillSlug },
    include: { stages: { orderBy: { order: "asc" } } },
  });
  const stages = startingStages(skill?.stages ?? [], paceById(profile.pace).id);

  return (
    <div className="sf-dash">
      <AccentSync accent={profile.accent} />
      <header className="sf-dash-bar">
        <a className="sf-wordmark" href="/dashboard">
          SkillFlow
        </a>
        <div className="sf-dash-actions">
          <ThemeToggle quiet />
          <SignOutButton />
        </div>
      </header>
      <main className="sf-dash-main">
        <ForYou
          name={session.user.name ?? ""}
          skill={choice}
          pace={profile.pace}
          goal={profile.goal}
          stages={stages}
        />
      </main>
    </div>
  );
}
