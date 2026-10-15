import "server-only";
import { askModelJson } from "@/lib/explain/judge";
import { guidanceSchema, type DetoxGuidance } from "./guidance-schema";
import { PLAYBOOK, settlePicks } from "./playbook";
import { rulesGuidance, type GuidanceInput } from "./rules-guidance";
import { DETOX_QUESTIONS, SECTION_LABELS, type DetoxSection } from "./questions";
import { bandFor } from "./score";

export type { GuidanceInput };

const SYSTEM = [
  "You write two or three warm, plain sentences of encouragement for a learner using the Dopamine Detox page of SkillFlow, a learning app.",
  "You receive only numbers and answer categories: a Detox Score from -100 to +100 worked out by the app, its band, section scores from 0 to 100, the ids of the answer options they chose, and counts of verified learning this week.",
  "The Detox Score is computed by the app. Never state a different number, never predict a future number, and never describe brain chemistry: do not say 'your dopamine level'. This is a self-improvement score, not a medical test; never diagnose, never mention disorders, and give no medical or health advice of your own.",
  "Write in second person, encouraging, never shaming, no exclamation marks, no emoji.",
  "Then choose exactly three step ids from the playbook list you are given, the three most useful next steps for these answers. Use only ids from the list, exactly as written.",
  'Return one JSON object: {"narrative": string, "steps": [id, id, id]}.',
].join("\n");

function describe(input: GuidanceInput) {
  const band = bandFor(input.score);
  const chosen = DETOX_QUESTIONS.filter((question) => question.id !== "mood" && question.id !== "overwhelm").map((question) => {
    const answer = input.answers[question.id];
    return `${question.id}: ${Array.isArray(answer) ? answer.join(", ") : answer ?? "unanswered"}`;
  });
  const sections = (Object.entries(input.sections) as [DetoxSection, number][])
    .filter(([section]) => section !== "mood")
    .map(([section, value]) => `${SECTION_LABELS[section]}: ${value}/100`);
  const week = input.week;
  return [
    `Detox Score: ${input.score} (band: ${band.label}). Starting score: ${input.baseline}.`,
    "Section scores (100 is the healthiest answer):",
    ...sections,
    "Answer option ids:",
    ...chosen,
    week
      ? `This week: ${week.ideas} ideas passed, ${week.stages} stages passed, ${week.recalls} recalls answered, ${week.focusMinutes} focused minutes on ${week.focusedDays} days, ${week.activeDays} active days.`
      : "This week: no activity yet.",
    "Playbook (id: title):",
    ...PLAYBOOK.map((step) => `${step.id}: ${step.title}`),
  ].join("\n");
}

/**
 * The model shapes words and picks steps; the number and the step texts stay in code. Any failure, an empty reply, or a
 * reply without a usable narrative falls back to the rules. Callers check aiAllowed() first and skip this when it says no.
 */
export async function writeDetoxGuidance(input: GuidanceInput): Promise<DetoxGuidance> {
  const fallback = rulesGuidance(input);
  const raw = await askModelJson(SYSTEM, describe(input));
  const parsed = raw ? guidanceSchema.safeParse(raw) : null;
  if (!parsed?.success) return fallback;
  // The page promises never to talk about brain chemistry or diagnoses; a reply that does is thrown away.
  if (/dopamine\s+levels?|brain\s+chemistry|diagnos|disorder|addict/i.test(parsed.data.narrative)) return fallback;
  return { narrative: parsed.data.narrative, steps: settlePicks(parsed.data.steps, fallback.steps), source: "model" };
}
