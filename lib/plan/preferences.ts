import { z } from "zod";

export const LEVELS = ["beginner", "intermediate", "advanced", "expert"] as const;
export const RESOURCE_KINDS = ["video", "doc", "course"] as const;
export const GOALS = ["job", "project", "hobby"] as const;
export const DEADLINES = ["none", "1w", "2w", "1m", "3m", "custom"] as const;

export type LearnerLevel = (typeof LEVELS)[number];
export type ResourceKind = (typeof RESOURCE_KINDS)[number];
export type LearningGoal = (typeof GOALS)[number];
export type DeadlineChoice = (typeof DEADLINES)[number];

const languageCode = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z]{2,3}(?:-[a-z0-9]{2,8})?$/, "Use a language code like hi or en.");

export const preferenceSchema = z
  .object({
    level: z.enum(LEVELS),
    minutesPerDay: z.number().int().min(10).max(240),
    daysPerWeek: z.number().int().min(1).max(7),
    deadline: z.enum(DEADLINES),
    customWeeks: z.number().int().min(1).max(104).nullable(),
    resourceTypes: z.array(z.enum(RESOURCE_KINDS)).min(1).max(3),
    language: languageCode,
    languageLabel: z.string().trim().min(2).max(40),
    englishFallback: z.boolean(),
    goal: z.enum(GOALS),
    lowData: z.boolean(),
    captionsNeeded: z.boolean(),
    knownTopics: z.array(z.string().trim().min(1).max(80)).max(12),
    applied: z.boolean().default(true),
  })
  .superRefine((value, context) => {
    if (value.deadline === "custom" && value.customWeeks == null) {
      context.addIssue({ code: "custom", message: "Add a number of weeks.", path: ["customWeeks"] });
    }
    if (new Set(value.resourceTypes).size !== value.resourceTypes.length) {
      context.addIssue({ code: "custom", message: "List each resource type once.", path: ["resourceTypes"] });
    }
  });

export type PlanPreferences = z.infer<typeof preferenceSchema>;

export const DEFAULT_PREFERENCES: PlanPreferences = {
  level: "beginner",
  minutesPerDay: 30,
  daysPerWeek: 5,
  deadline: "none",
  customWeeks: null,
  resourceTypes: ["video", "doc", "course"],
  language: "en",
  languageLabel: "English",
  englishFallback: true,
  goal: "project",
  lowData: false,
  captionsNeeded: false,
  knownTopics: [],
  applied: true,
};

export function deadlineWeeks(preferences: PlanPreferences): number | null {
  if (preferences.deadline === "none") return null;
  if (preferences.deadline === "1w") return 1;
  if (preferences.deadline === "2w") return 2;
  if (preferences.deadline === "1m") return 4;
  if (preferences.deadline === "3m") return 13;
  return preferences.customWeeks;
}

export function parsePreferences(input: unknown): { ok: true; preferences: PlanPreferences } | { ok: false; error: string } {
  const parsed = preferenceSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Those preferences are not valid." };
  return { ok: true, preferences: parsed.data };
}

/** Pull one JSON object out of a model reply. Extra keys are ignored by the schema. */
export function preferencesFromModelText(raw: string): { ok: true; preferences: PlanPreferences } | { ok: false; error: string } {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start < 0 || end <= start) return { ok: false, error: "The description could not be read. Adjust the choices yourself." };
  try {
    return parsePreferences(JSON.parse(raw.slice(start, end + 1)));
  } catch {
    return { ok: false, error: "The description could not be read. Adjust the choices yourself." };
  }
}
