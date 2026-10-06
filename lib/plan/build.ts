import { deadlineWeeks, type PlanPreferences, type ResourceKind } from "@/lib/plan/preferences";

export type PlanResourceInput = {
  id: string;
  title: string;
  type: "HOOK_CLIP" | "EMBEDDED_VIDEO" | "DOC_LINK" | "COURSE_LINK";
  language: string;
  durationMinutes: number | null;
  depth: "INTRO" | "STANDARD" | "DEEP" | null;
  isCore: boolean;
  captionLanguages: string[];
  order: number;
};

export type PlanStageInput = {
  id: string;
  order: number;
  title: string;
  locked: boolean;
  hasExplainBack: boolean;
  passed: boolean;
  resources: PlanResourceInput[];
};

export type BuiltResource = {
  id: string;
  title: string;
  kind: ResourceKind;
  language: string;
  minutes: number;
  assumed: boolean;
  optional: boolean;
  isCore: boolean;
};

export type StageLabel = "study" | "test_out" | "review" | "passed" | "locked";

export type BuiltStage = {
  id: string;
  order: number;
  title: string;
  locked: boolean;
  label: StageLabel;
  languageNote: string | null;
  minutes: number;
  week: number | null;
  resources: BuiltResource[];
};

export type BuiltPlan = {
  stages: BuiltStage[];
  schedule: { week: number; stageIds: string[] }[];
  totalMinutes: number;
  weeklyMinutes: number;
  assumed: boolean;
  warning: string | null;
};

const TEST_OUT_SHARE = { beginner: 0, intermediate: 0.25, advanced: 0.5, expert: 0.75 } as const;
const TEST_OUT_MINUTES = 15;
const FALLBACK_MINUTES: Record<ResourceKind, number> = { video: 12, doc: 20, course: 90 };

export function resourceKind(type: PlanResourceInput["type"]): ResourceKind {
  if (type === "DOC_LINK") return "doc";
  if (type === "COURSE_LINK") return "course";
  return "video";
}

function primaryLanguage(value: string) {
  return value.trim().toLowerCase().split("-")[0] ?? "";
}

/** A stage can be completed from the explain-back gate when that stage has one. */
export function explainBackCanComplete(stage: { hasExplainBack: boolean }) {
  return stage.hasExplainBack;
}

function knownStage(title: string, topics: string[]) {
  const haystack = title.toLowerCase();
  return topics.some((topic) => {
    const needle = topic.trim().toLowerCase();
    return needle.length >= 3 && haystack.includes(needle);
  });
}

function belowLevel(stage: PlanStageInput, openStages: PlanStageInput[], preferences: PlanPreferences) {
  if (knownStage(stage.title, preferences.knownTopics)) return true;
  const count = Math.floor(openStages.length * TEST_OUT_SHARE[preferences.level]);
  const index = openStages.findIndex((item) => item.id === stage.id);
  return index >= 0 && index < count;
}

function stageLabel(stage: PlanStageInput, openStages: PlanStageInput[], preferences: PlanPreferences): StageLabel {
  if (stage.locked) return "locked";
  if (stage.passed) return "passed";
  if (!belowLevel(stage, openStages, preferences)) return "study";
  return explainBackCanComplete(stage) ? "test_out" : "review";
}

function minutesOf(resource: PlanResourceInput) {
  if (resource.durationMinutes != null && resource.durationMinutes > 0) {
    return { minutes: resource.durationMinutes, assumed: false };
  }
  return { minutes: FALLBACK_MINUTES[resourceKind(resource.type)], assumed: true };
}

function selectResources(resources: PlanResourceInput[], preferences: PlanPreferences) {
  const preferredCode = primaryLanguage(preferences.language);
  const preferred = resources.filter((resource) => primaryLanguage(resource.language) === preferredCode);
  let pool = preferred;
  let note: string | null = null;
  if (pool.length === 0 && preferences.englishFallback) {
    pool = resources.filter((resource) => primaryLanguage(resource.language) === "en");
    note = `No ${preferences.languageLabel} resource yet for this stage`;
  }
  if (pool.length === 0 && resources.length > 0) {
    pool = [resources.slice().sort((a, b) => a.order - b.order)[0]];
    note = `No ${preferences.languageLabel} resource yet for this stage`;
  }
  const typeRank = new Map(preferences.resourceTypes.map((kind, index) => [kind, index]));
  const ranked = pool.slice().sort((a, b) => {
    const typeDelta = (typeRank.get(resourceKind(a.type)) ?? 99) - (typeRank.get(resourceKind(b.type)) ?? 99);
    if (typeDelta !== 0) return typeDelta;
    if (a.isCore !== b.isCore) return a.isCore ? -1 : 1;
    if (preferences.captionsNeeded) {
      const caption = (resource: PlanResourceInput) =>
        resource.captionLanguages.some((language) => {
          const code = primaryLanguage(language);
          return code === preferredCode || code === "en";
        });
      const captionDelta = Number(!caption(a)) - Number(!caption(b));
      if (captionDelta !== 0) return captionDelta;
    }
    if (preferences.lowData) {
      const weight = (resource: PlanResourceInput) => (resourceKind(resource.type) === "doc" ? 0 : resourceKind(resource.type) === "video" ? 1 : 2);
      const weightDelta = weight(a) - weight(b);
      if (weightDelta !== 0) return weightDelta;
      return minutesOf(a).minutes - minutesOf(b).minutes;
    }
    return a.order - b.order;
  });
  return { ranked, note };
}

function countPhrase(count: number, one: string, many: string) {
  return `${count} ${count === 1 ? one : many}`;
}

function deadlineWarning(coreMinutes: number, minutesPerDay: number, weeklyMinutes: number) {
  const hours = Math.max(1, Math.round(coreMinutes / 60));
  const weeks = Math.max(1, Math.ceil(coreMinutes / weeklyMinutes));
  return `This path needs about ${countPhrase(hours, "hour", "hours")}; at ${minutesPerDay} min/day, that's about ${countPhrase(weeks, "week", "weeks")}.`;
}

function packWeeks(stages: { id: string; minutes: number }[], weeklyMinutes: number) {
  const schedule: { week: number; stageIds: string[] }[] = [];
  let week = 1;
  let used = 0;
  let bucket: string[] = [];
  const push = () => {
    if (bucket.length === 0) return;
    schedule.push({ week, stageIds: bucket });
    week += 1;
    used = 0;
    bucket = [];
  };
  for (const stage of stages) {
    if (stage.minutes <= 0) continue;
    if (bucket.length > 0 && used + stage.minutes > weeklyMinutes) push();
    bucket.push(stage.id);
    used += stage.minutes;
    if (used >= weeklyMinutes) push();
  }
  push();
  return schedule;
}

/** Same preferences and the same catalog always build the same plan. Stages are never removed. */
export function buildLearningPlan(stages: PlanStageInput[], preferences: PlanPreferences): BuiltPlan {
  const openStages = stages.filter((stage) => !stage.locked).slice().sort((a, b) => a.order - b.order);
  const weeklyMinutes = preferences.minutesPerDay * preferences.daysPerWeek;
  const weeks = deadlineWeeks(preferences);
  const drafted = stages
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((stage) => {
      const label = stageLabel(stage, openStages, preferences);
      const selected = selectResources(stage.resources, preferences);
      const requiredId =
        selected.ranked.find((resource) => resource.isCore)?.id ?? selected.ranked[0]?.id ?? null;
      return { stage, label, selected, requiredId };
    });

  const counted = (mode: "full" | "core") =>
    drafted.reduce((sum, item) => {
      if (item.stage.locked || item.label === "passed") return sum;
      if (item.label === "test_out") return sum + TEST_OUT_MINUTES;
      const resources = mode === "core" ? item.selected.ranked.filter((resource) => resource.id === item.requiredId) : item.selected.ranked;
      return sum + resources.reduce((inner, resource) => inner + minutesOf(resource).minutes, 0);
    }, 0);

  const fullMinutes = counted("full");
  const coreMinutes = counted("core");
  const available = weeks == null ? Number.POSITIVE_INFINITY : weeklyMinutes * weeks;
  const timeShort = weeks != null && fullMinutes > available;
  const unrealistic = weeks != null && coreMinutes > available;

  let assumed = false;
  const builtStages: BuiltStage[] = drafted.map((item) => {
    const optionalMode = timeShort && item.label !== "test_out" && item.label !== "locked" && item.label !== "passed";
    const resources = item.selected.ranked.map((resource) => {
      const duration = minutesOf(resource);
      if (duration.assumed) assumed = true;
      return {
        id: resource.id,
        title: resource.title,
        kind: resourceKind(resource.type),
        language: resource.language,
        minutes: duration.minutes,
        assumed: duration.assumed,
        optional: optionalMode && resource.id !== item.requiredId,
        isCore: resource.isCore,
      };
    });
    const minutes = item.stage.locked || item.label === "passed"
      ? 0
      : item.label === "test_out"
        ? TEST_OUT_MINUTES
        : resources.filter((resource) => !resource.optional).reduce((sum, resource) => sum + resource.minutes, 0);
    return {
      id: item.stage.id,
      order: item.stage.order,
      title: item.stage.title,
      locked: item.stage.locked,
      label: item.label,
      languageNote: item.stage.locked ? null : item.selected.note,
      minutes,
      week: null,
      resources: item.stage.locked ? [] : resources,
    };
  });

  const schedule = packWeeks(
    builtStages.filter((stage) => !stage.locked && stage.label !== "passed"),
    weeklyMinutes,
  );
  const weekOf = new Map(schedule.flatMap((entry) => entry.stageIds.map((id) => [id, entry.week])));
  for (const stage of builtStages) stage.week = weekOf.get(stage.id) ?? null;

  const warning = unrealistic ? deadlineWarning(coreMinutes, preferences.minutesPerDay, weeklyMinutes) : null;

  return {
    stages: builtStages,
    schedule,
    totalMinutes: timeShort ? coreMinutes : fullMinutes,
    weeklyMinutes,
    assumed,
    warning,
  };
}

export function catalogStamp(stages: PlanStageInput[]) {
  return stages
    .map((stage) =>
      [
        stage.id,
        stage.order,
        stage.locked ? "1" : "0",
        stage.hasExplainBack ? "1" : "0",
        stage.resources
          .map((resource) =>
            [resource.id, resource.type, resource.language, resource.durationMinutes ?? "", resource.depth ?? "", resource.isCore ? "1" : "0", resource.captionLanguages.join(".")].join(":"),
          )
          .join("|"),
      ].join(","),
    )
    .join(";");
}
