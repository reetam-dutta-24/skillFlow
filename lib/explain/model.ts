import { passesRubric } from "@/lib/explain/rubric";

const TIMEOUT_MS = 12_000;

export type ModelGrade = {
  covered: boolean[];
  verdict: "PASSED" | "NEEDS_IMPROVEMENT";
  feedback: string;
};

/** A model reply is usable only when the coverage and the verdict agree. */
export function parseModelGrade(raw: unknown, rubricLength: number): ModelGrade | null {
  let data: unknown = raw;
  if (typeof raw === "string") {
    try {
      data = JSON.parse(raw);
    } catch {
      return null;
    }
  }
  if (!data || typeof data !== "object") return null;
  const record = data as Record<string, unknown>;
  const covered = record.covered;
  const verdict = record.verdict;
  const feedback = record.feedback;
  if (!Array.isArray(covered) || covered.length !== rubricLength) return null;
  if (!covered.every((item) => typeof item === "boolean")) return null;
  if (verdict !== "PASSED" && verdict !== "NEEDS_IMPROVEMENT") return null;
  if (typeof feedback !== "string") return null;
  const clean = feedback.trim();
  if (!clean || clean.length > 600) return null;
  const marks = covered as boolean[];
  const expectPass = passesRubric(marks);
  if ((verdict === "PASSED") !== expectPass) return null;
  return { covered: marks, verdict, feedback: clean };
}

type GradeInput = {
  question: string;
  rubric: string[];
  answer: string;
  followUp: string;
  followUpAnswer: string;
};

/**
 * Optional OpenAI-compatible chat call. Missing config, a timeout, or bad JSON
 * returns null so the rubric grade can finish the check.
 */
export async function gradeWithModel(input: GradeInput): Promise<ModelGrade | null> {
  const url = process.env.EXPLAIN_MODEL_URL;
  const key = process.env.EXPLAIN_MODEL_KEY;
  if (!url || !key) return null;
  const model = process.env.EXPLAIN_MODEL_NAME || "gpt-4o-mini";
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${key}`,
      },
      signal: AbortSignal.timeout(TIMEOUT_MS),
      body: JSON.stringify({
        model,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              'Grade an explain-back. Reply with JSON only: {"covered": boolean[], "verdict": "PASSED" or "NEEDS_IMPROVEMENT", "feedback": string}. covered has one boolean per rubric line, in the same order. PASSED only when at least half the lines are covered. feedback is one or two sentences and has no score.',
          },
          {
            role: "user",
            content: [
              `Question: ${input.question}`,
              "Rubric:",
              ...input.rubric.map((line, index) => `${index + 1}. ${line}`),
              `Answer: ${input.answer}`,
              `Follow-up: ${input.followUp}`,
              `Follow-up answer: ${input.followUpAnswer}`,
            ].join("\n"),
          },
        ],
      }),
    });
    if (!response.ok) return null;
    const body = (await response.json()) as { choices?: { message?: { content?: unknown } }[] };
    const content = body.choices?.[0]?.message?.content;
    return parseModelGrade(content, input.rubric.length);
  } catch {
    return null;
  }
}
