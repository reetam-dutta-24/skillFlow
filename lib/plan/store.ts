import "server-only";
import { prisma } from "@/lib/prisma";
import { stageCountsAsOpen } from "@/lib/progress/formula";
import { buildLearningPlan, catalogStamp, type BuiltPlan, type PlanStageInput } from "@/lib/plan/build";
import { parsePreferences, type PlanPreferences } from "@/lib/plan/preferences";

export const PLAN_SHAPE = 2;

function isPlan(value: unknown): value is BuiltPlan {
  return Boolean(value && typeof value === "object" && Array.isArray((value as BuiltPlan).stages) && Array.isArray((value as BuiltPlan).schedule));
}

async function skillInputs(userId: string, skillId: string): Promise<{ slug: string; stages: PlanStageInput[] } | null> {
  const skill = await prisma.skill.findUnique({
    where: { id: skillId },
    select: {
      slug: true,
      status: true,
      offer: true,
      stages: {
        orderBy: { order: "asc" },
        select: {
          id: true,
          order: true,
          title: true,
          monetized: true,
          explainBackPrompt: { select: { id: true } },
          stageCompletions: { where: { userId, explainBackPassed: true }, select: { id: true } },
          resources: {
            orderBy: { order: "asc" },
            select: {
              id: true,
              title: true,
              type: true,
              language: true,
              durationMinutes: true,
              depth: true,
              isCore: true,
              captionLanguages: true,
              order: true,
            },
          },
        },
      },
    },
  });
  if (!skill) return null;
  const stageCount = skill.stages.length;
  const stages: PlanStageInput[] = skill.stages.map((stage) => {
    const locked = !stageCountsAsOpen({
      skillStatus: skill.status,
      skillOffer: skill.offer,
      monetized: stage.monetized,
      order: stage.order,
      stageCount,
    });
    return {
      id: stage.id,
      order: stage.order,
      title: stage.title,
      locked,
      hasExplainBack: Boolean(stage.explainBackPrompt),
      passed: stage.stageCompletions.length > 0,
      resources: locked
        ? []
        : stage.resources.map((resource) => ({
            id: resource.id,
            title: resource.title,
            type: resource.type,
            language: resource.language,
            durationMinutes: resource.durationMinutes,
            depth: resource.depth,
            isCore: resource.isCore,
            captionLanguages: resource.captionLanguages,
            order: resource.order,
          })),
    };
  });
  return { slug: skill.slug, stages };
}

export async function saveLearningPreferences(userId: string, skillId: string, input: unknown) {
  const parsed = parsePreferences(input);
  if (!parsed.ok) return parsed;
  const loaded = await skillInputs(userId, skillId);
  if (!loaded || loaded.stages.length === 0) return { ok: false as const, error: "That skill does not have a path yet." };
  const plan = buildLearningPlan(loaded.stages, parsed.preferences);
  const catalogStampValue = catalogStamp(loaded.stages);
  await prisma.learningPlan.upsert({
    where: { userId_skillId: { userId, skillId } },
    create: {
      userId,
      skillId,
      preferences: parsed.preferences,
      plan,
      catalogStamp: catalogStampValue,
      version: PLAN_SHAPE,
    },
    update: {
      preferences: parsed.preferences,
      plan,
      catalogStamp: catalogStampValue,
      version: PLAN_SHAPE,
    },
  });
  await prisma.userSkillProgress.upsert({
    where: { userId_skillId: { userId, skillId } },
    create: { userId, skillId },
    update: {},
  });
  return { ok: true as const, preferences: parsed.preferences, plan };
}

export async function readLearningPlan(userId: string, skillId: string): Promise<{ preferences: PlanPreferences; plan: BuiltPlan } | null> {
  const row = await prisma.learningPlan.findUnique({ where: { userId_skillId: { userId, skillId } } });
  if (!row) return null;
  const parsed = parsePreferences(row.preferences);
  if (!parsed.ok) return null;
  const loaded = await skillInputs(userId, skillId);
  if (!loaded) return null;
  const stamp = catalogStamp(loaded.stages);
  if (row.version === PLAN_SHAPE && row.catalogStamp === stamp && isPlan(row.plan)) {
    return { preferences: parsed.preferences, plan: row.plan };
  }
  const plan = buildLearningPlan(loaded.stages, parsed.preferences);
  await prisma.learningPlan.update({
    where: { id: row.id },
    data: { plan, catalogStamp: stamp, version: PLAN_SHAPE },
  });
  return { preferences: parsed.preferences, plan };
}
