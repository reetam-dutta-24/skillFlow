import { z } from "zod";
import { storedSource } from "@/lib/stored-source";

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const skillStatusSchema = z.enum(["AVAILABLE", "COMING_SOON"]);
export const stageLevelSchema = z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]);
export const resourceTypeSchema = z.enum(["HOOK_CLIP", "EMBEDDED_VIDEO", "DOC_LINK", "COURSE_LINK"], "Choose a resource type.");
export const sourceStatusSchema = z.enum(["ACTIVE", "UNAVAILABLE"]);

const optionalText = z
  .string()
  .trim()
  .optional()
  .transform((value) => {
    if (value === undefined) return undefined;
    return value.length > 0 ? value : null;
  });

function lineList(message: string) {
  return z.array(z.string().trim().min(1, message));
}

export const skillSchema = z.object({
  name: z.string().trim().min(1, "Add a name."),
  slug: z.string().trim().toLowerCase().regex(SLUG, "Use a slug like travel-vlogging."),
  description: optionalText,
  image: z.string().trim().min(1, "Add an image.").optional(),
  status: skillStatusSchema.optional(),
  isFlagship: z.boolean().optional(),
  order: z.number().int().min(0).optional(),
});

export const setSkillStatusSchema = z.object({
  skillId: z.string().trim().min(1, "Choose a skill that exists."),
  status: skillStatusSchema,
});

export const stageSchema = z.object({
  skillId: z.string().trim().min(1, "Choose a skill that exists."),
  order: z.number().int().min(1, "Choose a position."),
  title: z.string().trim().min(1, "Add a title."),
  description: optionalText,
  level: stageLevelSchema.optional(),
  learningObjectives: lineList("Add an objective.").optional(),
});

export const resourceSchema = z.object({
  id: z.string().trim().min(1).optional(),
  stageId: z.string().trim().min(1, "Choose a stage that exists."),
  type: resourceTypeSchema,
  url: z
    .string()
    .trim()
    .min(1, "Upload a file, or use an https link.")
    .refine((value) => storedSource(value) !== null, "Upload a file, or use an https link.")
    .transform((value) => storedSource(value) as string),
  title: z.string().trim().min(1, "Add a title."),
  description: optionalText,
  keyPoints: lineList("Add a key point.").optional(),
  transcript: optionalText,
  provider: z.string().trim().optional(),
  author: optionalText,
  videoId: optionalText,
  isFree: z.boolean().optional(),
  language: z.string().trim().min(1).optional(),
  sourceStatus: sourceStatusSchema.optional(),
  needsReview: z.boolean().optional(),
  order: z.number().int().min(1).optional(),
});

export const explainBackPromptSchema = z.object({
  stageId: z.string().trim().min(1, "Choose a stage that exists."),
  question: z.string().trim().min(1, "Add a question."),
  rubric: z.array(z.string().trim().min(1, "Add a rubric line.")).min(1, "Add at least one rubric line."),
});

export const deleteByIdSchema = z.object({
  id: z.string().trim().min(1, "Choose an item that exists."),
});

export const reorderStagesSchema = z.object({
  skillId: z.string().trim().min(1, "Choose a skill that exists."),
  stageIds: z.array(z.string().trim().min(1)).min(1, "Choose the stages to reorder."),
});

export const reorderResourcesSchema = z.object({
  stageId: z.string().trim().min(1, "Choose a stage that exists."),
  resourceIds: z.array(z.string().trim().min(1)).min(1, "Choose the resources to reorder."),
});

export function firstIssue(error: z.ZodError) {
  return error.issues[0]?.message ?? "Check the form and try again.";
}
