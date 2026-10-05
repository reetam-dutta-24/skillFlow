import { feedbackForGaps, followUpForGaps } from "@/lib/explain/concepts";

const TIMEOUT_MS = 25_000;

export type ConceptMark = {
  concept: string;
  understood: boolean;
};

export type JudgeReply = {
  marks: ConceptMark[];
  followUp: string;
  feedback: string;
};

export type ExplainDecision =
  | { kind: "pass"; feedback: string }
  | { kind: "follow-up"; question: string }
  | { kind: "needs-improvement"; feedback: string };

type ModelConfig = {
  url: string;
  key: string;
  model: string;
};

export function explainModelConfig(env: Record<string, string | undefined> = process.env): ModelConfig | null {
  const key = env.EXPLAIN_MODEL_KEY || env.OPENAI_API_KEY;
  if (!key) return null;
  return {
    key,
    url: env.EXPLAIN_MODEL_URL || "https://api.openai.com/v1/chat/completions",
    model: env.EXPLAIN_MODEL_NAME || "gpt-4o-mini",
  };
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

/** Align the model's marks to the stage concepts. A missing mark is not understood. */
export function parseJudgeReply(raw: unknown, concepts: string[]): JudgeReply | null {
  if (concepts.length === 0) return null;
  let data: unknown = raw;
  if (typeof raw === "string") {
    try {
      data = JSON.parse(raw);
    } catch {
      return null;
    }
  }
  const record = asRecord(data);
  if (!record || !Array.isArray(record.concepts)) return null;
  const rows = record.concepts.map(asRecord).filter((row): row is Record<string, unknown> => row !== null);
  if (rows.length === 0) return null;

  const marks = concepts.map((concept, index) => {
    const row = rows.length === concepts.length ? rows[index] : rows.find((item) => String(item.name ?? "") === concept);
    return { concept, understood: row?.understood === true };
  });
  const followUp = typeof record.followUp === "string" ? record.followUp.trim().slice(0, 600) : "";
  const feedback = typeof record.feedback === "string" ? record.feedback.trim().slice(0, 800) : "";
  return { marks, followUp, feedback };
}

/**
 * A pass requires every concept. The first reply asks about whatever is missing.
 * The reply after that follow-up fails the stage if anything is still missing.
 */
export function decideExplainBack(reply: JudgeReply, turn: "first" | "final"): ExplainDecision {
  const allUnderstood = reply.marks.length > 0 && reply.marks.every((mark) => mark.understood);
  if (allUnderstood) {
    return { kind: "pass", feedback: reply.feedback || "You explained each idea in this stage." };
  }
  if (turn === "first") {
    const question = reply.followUp.length >= 20 ? reply.followUp : followUpForGaps(reply.marks);
    return { kind: "follow-up", question };
  }
  return { kind: "needs-improvement", feedback: feedbackForGaps(reply.marks) };
}

const SYSTEM = [
  "You are the explain-back examiner for one stage of a learning path.",
  "Judge whether the learner understands the stage, the way a teacher would. Do not count keywords.",
  "The concepts are the whole stage. Every concept must be understood or the learner does not pass.",
  "Understood means they explain the idea in their own words: what it is, and why it matters or when they would use it.",
  "Naming a concept, or giving it a single clause, is not understood. A wrong or confused explanation is not understood.",
  "Use the rubric and the reference notes as the picture of a sound explanation. Do not demand jargon those notes do not require.",
  "Do not teach the missing idea in the follow-up. Ask them to explain it.",
  'Reply with JSON only: {"concepts":[{"name":string,"understood":boolean}],"followUp":string,"feedback":string}.',
  "concepts has one entry per concept, in the same order. followUp is one question covering every concept that is not understood, or an empty string when all are understood.",
  "feedback is two or three sentences about what they showed and what is still missing. No score and no pass or fail label.",
].join(" ");

export type JudgeInput = {
  title: string;
  description: string | null;
  concepts: string[];
  rubric: string[];
  notes: string[];
  stageQuestion: string;
  answer: string;
  followUp?: string;
  followUpAnswer?: string;
};

export async function judgeExplanation(input: JudgeInput): Promise<JudgeReply | null> {
  const config = explainModelConfig();
  if (!config) return null;
  const lines = [
    `Stage: ${input.title}`,
    input.description ? `What this stage is about: ${input.description}` : "",
    "Concepts the learner must explain:",
    ...input.concepts.map((concept, index) => `${index + 1}. ${concept}`),
    input.stageQuestion ? `A question this stage also cares about: ${input.stageQuestion}` : "",
    input.rubric.length ? `Rubric:\n${input.rubric.map((line) => `- ${line}`).join("\n")}` : "",
    input.notes.length ? `Reference notes from the lesson:\n${input.notes.map((line) => `- ${line}`).join("\n")}` : "",
    `Learner's explanation:\n${input.answer}`,
    input.followUp ? `Follow-up they were asked:\n${input.followUp}` : "",
    input.followUpAnswer ? `Their follow-up answer:\n${input.followUpAnswer}` : "",
  ].filter(Boolean);

  try {
    const response = await fetch(config.url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${config.key}`,
      },
      signal: AbortSignal.timeout(TIMEOUT_MS),
      body: JSON.stringify({
        model: config.model,
        response_format: { type: "json_object" },
        temperature: 0.2,
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: lines.join("\n\n") },
        ],
      }),
    });
    if (!response.ok) return null;
    const body = (await response.json()) as { choices?: { message?: { content?: unknown } }[] };
    return parseJudgeReply(body.choices?.[0]?.message?.content, input.concepts);
  } catch {
    return null;
  }
}
