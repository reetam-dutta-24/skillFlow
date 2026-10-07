"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { explainModelConfig } from "@/lib/explain/judge";
import { interpretLearningDescription } from "@/lib/plan/parse";
import { followSkillRecord } from "@/lib/data/settings";
import { saveLearningPreferences, setLearningPlanApplied } from "@/lib/plan/store";
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
  const followed = await followSkillRecord(session.user.id, skill.id);
  if (!followed.ok) return followed;
  revalidatePath(`/roadmap/${skill.slug}`);
  revalidatePath("/roadmap");
  revalidatePath("/dashboard");
  revalidatePath("/settings");
  return { ok: true as const, slug: skill.slug };
}

async function setApplied(skillId: string, applied: boolean) {
  const session = await auth();
  if (!session?.user?.id) return;
  const skill = await prisma.skill.findFirst({ where: { id: skillId }, select: { id: true, slug: true } });
  if (!skill) return;
  await setLearningPlanApplied(session.user.id, skill.id, applied);
  revalidatePath(`/roadmap/${skill.slug}`);
}

export async function undoPlan(formData: FormData) {
  await setApplied(String(formData.get("skillId") ?? ""), false);
}

export async function usePlan(formData: FormData) {
  await setApplied(String(formData.get("skillId") ?? ""), true);
}
