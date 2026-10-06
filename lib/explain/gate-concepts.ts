import { createHash } from "node:crypto";
import { stageConcepts } from "@/lib/explain/concepts";

export type GateResourceSource = {
  order: number;
  title: string;
  description: string | null;
  keyPoints: string[];
  transcript: string | null;
};

export type GateConcept = {
  concept: string;
  rubric: string;
};

const MAX_MODEL = 36;
const MAX_CONCEPT = 160;
const MAX_RUBRIC = 320;

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
}

function clean(value: string, max: number) {
  return value.replace(/\s+/g, " ").trim().slice(0, max);
}

/** Same resources in any order hash the same. Page text is not part of the hash. */
export function gateSourceHash(
  stage: { title: string; description: string | null },
  resources: GateResourceSource[],
): string {
  const body = JSON.stringify({
    title: stage.title.trim(),
    description: (stage.description ?? "").trim(),
    resources: [...resources]
      .sort((left, right) => left.order - right.order)
      .map((resource) => ({
        title: resource.title.trim(),
        description: (resource.description ?? "").trim(),
        keyPoints: resource.keyPoints.map((point) => point.trim()).filter(Boolean),
        transcript: (resource.transcript ?? "").trim().slice(0, 2000),
      })),
  });
  return createHash("sha256").update(body).digest("hex");
}

export function gateStillCurrent(
  storedHash: string | null | undefined,
  stage: { title: string; description: string | null },
  resources: GateResourceSource[],
): boolean {
  return Boolean(storedHash) && storedHash === gateSourceHash(stage, resources);
}

/** Key points first, article text last, so a length cap cannot drop a key point. */
export function gateSourceBrief(input: {
  title: string;
  description: string | null;
  resources: GateResourceSource[];
  pages: { title: string; text: string }[];
}): string {
  const lines: string[] = [`Stage: ${input.title.trim()}`];
  if (input.description?.trim()) lines.push(`About: ${input.description.trim()}`);
  const resources = [...input.resources].sort((left, right) => left.order - right.order);
  resources.forEach((resource, index) => {
    lines.push(`Resource ${index + 1}: ${resource.title.trim()}`);
    if (resource.description?.trim()) lines.push(`Description: ${resource.description.trim()}`);
    const points = resource.keyPoints.map((point) => point.trim()).filter(Boolean);
    if (points.length > 0) lines.push(`Key points:\n${points.map((point) => `- ${point}`).join("\n")}`);
    if (resource.transcript?.trim()) lines.push(`Transcript:\n${resource.transcript.trim().slice(0, 2000)}`);
  });
  for (const page of input.pages) {
    if (!page.text.trim()) continue;
    lines.push(`Article text from ${page.title.trim()}:\n${page.text.trim().slice(0, 3500)}`);
  }
  return lines.join("\n\n").slice(0, 28_000);
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function fallbackRubric(concept: string) {
  return clean(`Explains ${concept} in their own words: what it is, and why it matters.`, MAX_RUBRIC);
}

/** Concepts the model listed. Null when the reply is not that list. */
export function parseGateConcepts(raw: unknown): GateConcept[] | null {
  let data: unknown = raw;
  if (typeof raw === "string") {
    const trimmed = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
    try {
      data = JSON.parse(trimmed);
    } catch {
      return null;
    }
  }
  const record = asRecord(data);
  const list = Array.isArray(record?.concepts) ? record.concepts : Array.isArray(data) ? data : null;
  if (!list) return null;

  const concepts: GateConcept[] = [];
  const seen = new Set<string>();
  for (const item of list) {
    if (concepts.length >= MAX_MODEL) break;
    const row = asRecord(item);
    if (!row) continue;
    const concept = clean(String(row.concept ?? row.name ?? ""), MAX_CONCEPT);
    const key = normalize(concept);
    if (concept.length < 3 || seen.has(key)) continue;
    seen.add(key);
    const rubric = clean(String(row.rubric ?? ""), MAX_RUBRIC);
    concepts.push({ concept, rubric: rubric.length >= 12 ? rubric : fallbackRubric(concept) });
  }
  return concepts.length > 0 ? concepts : null;
}

function covers(point: string, concepts: GateConcept[]) {
  const norm = normalize(point);
  if (!norm) return true;
  const words = norm.split(" ").filter((word) => word.length > 3);
  return concepts.some((item) => {
    const concept = normalize(item.concept);
    const hay = `${concept} ${normalize(item.rubric)}`;
    if (hay.includes(norm)) return true;
    if (concept.length > 12 && norm.includes(concept)) return true;
    if (words.length === 0) return hay.includes(norm);
    const hit = words.filter((word) => hay.includes(word)).length;
    return hit / words.length >= 0.6;
  });
}

/** Append every resource key point the model left out. */
export function withEveryKeyPoint(concepts: GateConcept[], keyPoints: string[]): GateConcept[] {
  const next = [...concepts];
  const seen = new Set(next.map((item) => normalize(item.concept)));
  for (const raw of keyPoints) {
    const concept = clean(raw, MAX_CONCEPT);
    const key = normalize(concept);
    if (concept.length < 3 || seen.has(key) || covers(concept, next)) continue;
    seen.add(key);
    next.push({
      concept,
      rubric: clean(`Explains this in their own words: what it is, and why it matters. The resource states: ${concept}`, MAX_RUBRIC),
    });
  }
  return next;
}

/** A generated gate asks the stored ideas. An older gate still asks the rubric lines too. */
export function conceptsForGate(objectives: string[], rubric: string[], generated: boolean): string[] {
  if (generated && objectives.some((item) => item.trim())) return stageConcepts(objectives, []);
  return stageConcepts(objectives, rubric);
}
