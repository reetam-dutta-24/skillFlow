import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { parsePreferences } from "@/lib/plan/preferences";
import { prisma } from "@/lib/prisma";
import { PlanForm } from "./_components/PlanForm";

type PageProps = { params: Promise<{ slug: string }> };

export const metadata: Metadata = { title: "Learning plan" };

export default async function PreferencesPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const { slug } = await params;
  const skill = await prisma.skill.findUnique({
    where: { slug },
    select: { id: true, name: true, status: true, _count: { select: { stages: true } } },
  });
  if (!skill) notFound();

  const existing = await prisma.learningPlan.findUnique({
    where: { userId_skillId: { userId: session.user.id, skillId: skill.id } },
    select: { preferences: true },
  });
  const parsed = existing ? parsePreferences(existing.preferences) : null;

  return (
    <div className="sf-notes-page">
      <header className="sf-page-head">
        <h1>{skill.name}</h1>
        <p>These choices build your version of the same path. Stages stay shared. A description is read as your words, then you can change what it understood.</p>
        <p className="sf-notes-actions">
          <Link href={`/roadmap/${slug}`}>Back to the roadmap</Link>
        </p>
      </header>
      {skill.status !== "AVAILABLE" || skill._count.stages === 0 ? (
        <p className="sf-note-summary">This path is not open yet, so a plan cannot be saved.</p>
      ) : (
        <PlanForm skillId={skill.id} initial={parsed?.ok ? parsed.preferences : null} />
      )}
    </div>
  );
}
