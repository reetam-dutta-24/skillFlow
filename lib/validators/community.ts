import { z } from "zod";
import { normalizeCommunityUrl } from "@/lib/links/normalize-url";

const id = z.string().trim().min(1, "Choose a record that exists.");

export const contributionTypeSchema = z.enum(["RESOURCE", "CONCEPT_NOTE", "LEARNING_PATH", "FOLLOW"], "Choose a contribution type.");
export const disclosureSchema = z.enum(["NONE", "I_MADE_THIS", "AFFILIATE_OR_SPONSORED"], "Say whether you made this or were paid to share it.");
export const reviewDecisionSchema = z.enum(["APPROVE", "REQUEST_CHANGES", "CLOSE"]);
export const reviewReasonSchema = z.enum([
  "OFF_TOPIC",
  "LOW_QUALITY",
  "DUPLICATE",
  "BROKEN_LINK",
  "UNDISCLOSED_PROMOTION",
  "INACCURATE",
  "OTHER",
]);

const tagSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, "A tag needs text.")
  .max(24, "Keep each tag to 24 characters.");

const stepSchema = z.object({
  title: z.string().trim().min(1, "Name this step.").max(120, "Keep the step title to 120 characters."),
  url: z.string().trim().max(2000).optional(),
  note: z.string().trim().max(280, "Keep the step note to 280 characters.").optional(),
});

function imageOk(value: string): boolean {
  if (value.startsWith("/uploads/")) return !value.includes("..") && value.length < 500;
  return normalizeCommunityUrl(value) !== null;
}

export const contributionSchema = z
  .object({
    skillId: id,
    type: contributionTypeSchema,
    title: z.string().trim().min(1, "Add a title.").max(120, "Keep the title to 120 characters."),
    description: z.string().trim().min(1, "Add a description.").max(5000, "Keep the description to 5,000 characters."),
    imageUrl: z.string().trim().max(500).optional(),
    sources: z.array(z.string().trim().min(1).max(2000)).max(10, "Add at most 10 links."),
    tags: z.array(tagSchema).max(5, "Add at most 5 tags.").optional(),
    stageId: id.optional(),
    gapId: id.optional(),
    disclosure: disclosureSchema,
    steps: z.array(stepSchema).min(2, "A learning path needs at least 2 steps.").max(15, "A learning path can have 15 steps.").optional(),
  })
  .superRefine((value, ctx) => {
    if (value.imageUrl && !imageOk(value.imageUrl)) {
      ctx.addIssue({ code: "custom", path: ["imageUrl"], message: "Use an uploaded image or an https link." });
    }
    const tags = value.tags ?? [];
    if (new Set(tags).size !== tags.length) {
      ctx.addIssue({ code: "custom", path: ["tags"], message: "Each tag should be different." });
    }
    if ((value.type === "RESOURCE" || value.type === "FOLLOW") && value.sources.length === 0) {
      ctx.addIssue({ code: "custom", path: ["sources"], message: "Add at least one https link." });
    }
    if (value.type === "LEARNING_PATH" && !value.steps) {
      ctx.addIssue({ code: "custom", path: ["steps"], message: "Add the steps of the path." });
    }
  });

export const reviewSchema = z
  .object({
    contributionId: id,
    decision: reviewDecisionSchema,
    reason: reviewReasonSchema.optional(),
    feedback: z.string().trim().max(500, "Keep the note to 500 characters.").optional(),
  })
  .superRefine((value, ctx) => {
    if (value.decision !== "APPROVE" && !value.reason) {
      ctx.addIssue({ code: "custom", path: ["reason"], message: "Choose a reason." });
    }
  });

export const gapSchema = z.object({
  skillId: id,
  title: z.string().trim().min(1, "Add a title.").max(120, "Keep the title to 120 characters."),
  description: z.string().trim().min(1, "Describe the gap.").max(1000, "Keep the description to 1,000 characters."),
  stageId: id.optional(),
});

export const roleSchema = z.object({
  userId: id,
  skillId: id,
  role: z.enum(["REVIEWER", "MAINTAINER"]),
});

export type ContributionInput = z.infer<typeof contributionSchema>;
export type ReviewInput = z.infer<typeof reviewSchema>;
export type GapInput = z.infer<typeof gapSchema>;

export function issueOf(error: z.ZodError): { error: string; field?: string } {
  const issue = error.issues[0];
  const field = issue?.path[0];
  return { error: issue?.message ?? "Check the form.", field: field === undefined ? undefined : String(field) };
}
