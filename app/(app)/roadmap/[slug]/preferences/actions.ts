"use server";

import { auth } from "@/lib/auth";
import { explainModelConfig } from "@/lib/explain/judge";
import { interpretLearningDescription } from "@/lib/plan/parse";
import { saveLearningPreferences } from "@/lib/plan/store";
import { prisma } from "@/lib/prisma";

export async function readDescription(description: string) {
  const session = await auth();
  if (!session?.user?.id) return { ok: false as const, error: "Sign in again before saving." };
  if (!explainModelConfig()) return { ok: false as const, error: "A model key is needed to read that description." };
  return interpretLearningDescription(description);
}

export async function savePlan(skillId: string, input: unknown) {
  const session = await auth();
  if (!session?.user?.id) return { ok: false as const, error: "Sign in again before saving." };
  const skill = await prisma.skill.findFirst({
    where: { id: skillId, status: "AVAILABLE" },
    select: { id: true, slug: true },
  });
  if (!skill) return { ok: false as const, error: "That skill is not open yet." };
  const saved = await saveLearningPreferences(session.user.id, skill.id, input);
  if (!saved.ok) return saved;
  return { ok: true as const, slug: skill.slug };
}
