import { describe, expect, it } from "vitest";
import { buildLearningPlan, explainBackCanComplete, orderedStageResources, type PlanStageInput } from "@/lib/plan/build";
import { DEFAULT_PREFERENCES, type PlanPreferences } from "@/lib/plan/preferences";

function resource(id: string, overrides: Partial<PlanStageInput["resources"][number]> = {}): PlanStageInput["resources"][number] {
  return {
    id,
    title: id,
    type: "EMBEDDED_VIDEO",
    language: "en",
    durationMinutes: 60,
    depth: "STANDARD",
    isCore: false,
    captionLanguages: [],
    order: 1,
    ...overrides,
  };
}

function stage(order: number, overrides: Partial<PlanStageInput> = {}): PlanStageInput {
  return {
    id: `stage-${order}`,
    order,
    title: `Stage ${order}`,
    locked: false,
    hasExplainBack: true,
    passed: false,
    resources: [resource(`r-${order}`)],
    ...overrides,
  };
}

function prefs(overrides: Partial<PlanPreferences> = {}): PlanPreferences {
  return { ...DEFAULT_PREFERENCES, ...overrides };
}

describe("learning plan", () => {
  const stages = [stage(1), stage(2), stage(3), stage(4)];

  it("marks earlier open stages as test out from the learner's level", () => {
    expect(buildLearningPlan(stages, prefs({ level: "beginner" })).stages.every((item) => item.label === "study")).toBe(true);
    expect(buildLearningPlan(stages, prefs({ level: "intermediate" })).stages.map((item) => item.label)).toEqual(["test_out", "study", "study", "study"]);
    expect(buildLearningPlan(stages, prefs({ level: "advanced" })).stages.filter((item) => item.label === "test_out")).toHaveLength(2);
    expect(buildLearningPlan(stages, prefs({ level: "expert" })).stages.filter((item) => item.label === "test_out")).toHaveLength(3);
  });

  it("does not complete a stage that has no explain-back", () => {
    const withoutGate = [stage(1, { hasExplainBack: false }), stage(2), stage(3), stage(4)];
    const plan = buildLearningPlan(withoutGate, prefs({ level: "intermediate" }));
    expect(explainBackCanComplete(withoutGate[0])).toBe(false);
    expect(plan.stages[0].label).toBe("review");
    expect(plan.stages[0].label).not.toBe("passed");
  });

  it("keeps an English resource and says when the preferred language is missing", () => {
    const plan = buildLearningPlan(stages, prefs({ language: "hi", languageLabel: "Hindi", englishFallback: true }));
    expect(plan.stages[0].languageNote).toBe("No Hindi resource yet for this stage");
    expect(plan.stages[0].resources.map((item) => item.language)).toEqual(["en"]);
  });

  it("ranks the learner's resource types first", () => {
    const mixed = stage(1, {
      resources: [
        resource("video", { type: "EMBEDDED_VIDEO", order: 1, durationMinutes: 10 }),
        resource("course", { type: "COURSE_LINK", order: 2, durationMinutes: 10 }),
        resource("doc", { type: "DOC_LINK", order: 3, durationMinutes: 10 }),
      ],
    });
    const plan = buildLearningPlan([mixed], prefs({ resourceTypes: ["course", "doc", "video"] }));
    expect(plan.stages[0].resources.map((item) => item.kind)).toEqual(["course", "doc", "video"]);
  });

  it("marks extra resources optional when the deadline cannot hold the full path", () => {
    const heavy = [1, 2, 3, 4].map((order) =>
      stage(order, {
        resources: [
          resource(`core-${order}`, { isCore: true, durationMinutes: 60, order: 1 }),
          resource(`extra-${order}`, { durationMinutes: 60, order: 2 }),
        ],
      }),
    );
    const plan = buildLearningPlan(heavy, prefs({ minutesPerDay: 30, daysPerWeek: 5, deadline: "1w" }));
    expect(plan.stages[0].resources.find((item) => item.isCore)?.optional).toBe(false);
    expect(plan.stages[0].resources.find((item) => !item.isCore)?.optional).toBe(true);
  });

  it("says when even the core path does not fit the deadline", () => {
    const heavy = [1, 2, 3, 4].map((order) => stage(order, { resources: [resource(`core-${order}`, { isCore: true, durationMinutes: 600 })] }));
    const plan = buildLearningPlan(heavy, prefs({ minutesPerDay: 30, daysPerWeek: 5, deadline: "1w" }));
    expect(plan.warning).toMatch(/needs about 40 hours/);
    expect(plan.warning).toMatch(/about 16 weeks/);
    expect(plan.stages).toHaveLength(4);
  });

  it("uses the singular hour when the core path is about one hour", () => {
    const plan = buildLearningPlan(
      [stage(1, { resources: [resource("core", { isCore: true, durationMinutes: 70 })] })],
      prefs({ minutesPerDay: 10, daysPerWeek: 1, deadline: "1w" }),
    );
    expect(plan.warning).toMatch(/about 1 hour;/);
    expect(plan.stages).toHaveLength(1);
  });

  it("keeps the selected resources, in plan order, and marks the rest optional", () => {
    const catalog = [
      { id: "video", title: "Video" },
      { id: "doc", title: "Doc" },
      { id: "hindi", title: "Hindi" },
    ];
    const withHindi = buildLearningPlan(
      [
        stage(1, {
          resources: [
            resource("video", { type: "EMBEDDED_VIDEO", language: "en", order: 1 }),
            resource("doc", { type: "DOC_LINK", language: "en", isCore: true, order: 2 }),
            resource("hindi", { type: "DOC_LINK", language: "hi", order: 3 }),
          ],
        }),
      ],
      prefs({ language: "hi", languageLabel: "Hindi", englishFallback: true, resourceTypes: ["doc", "video"] }),
    );
    const hindiOnly = orderedStageResources(catalog, withHindi.stages[0]);
    expect(hindiOnly.resources.map((item) => item.id)).toEqual(["hindi"]);
    expect(hindiOnly.note).toBeNull();

    const englishOnly = buildLearningPlan(
      [
        stage(1, {
          resources: [
            resource("video", { type: "EMBEDDED_VIDEO", language: "en", order: 1 }),
            resource("doc", { type: "DOC_LINK", language: "en", isCore: true, order: 2 }),
          ],
        }),
      ],
      prefs({
        language: "hi",
        languageLabel: "Hindi",
        englishFallback: true,
        resourceTypes: ["doc", "video"],
        deadline: "1w",
        minutesPerDay: 10,
        daysPerWeek: 1,
      }),
    );
    const shown = orderedStageResources(catalog, englishOnly.stages[0]);
    expect(shown.resources.map((item) => item.id)).toEqual(["doc", "video"]);
    expect(shown.note).toMatch(/No Hindi resource yet/);
    expect(shown.optionalIds.has("doc")).toBe(false);
    expect(shown.optionalIds.has("video")).toBe(true);
    expect(orderedStageResources(catalog, null).resources).toHaveLength(3);
  });
});
