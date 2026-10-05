const STOP = new Set([
  "a", "an", "the", "and", "or", "of", "to", "in", "on", "for", "with", "from", "that", "this",
  "these", "those", "is", "are", "was", "were", "be", "as", "by", "it", "its", "into", "than",
  "then", "when", "what", "how", "why", "you", "your", "would", "does", "do", "not", "but",
  "if", "so", "at", "explains", "explain", "names", "name", "making", "make", "includes",
  "include", "using", "use", "over", "under", "between", "about", "their", "them", "they",
]);

function tokens(text: string): Set<string> {
  const raw = text.toLowerCase().match(/[a-z0-9]+(?:-[a-z0-9]+)*/g) ?? [];
  const out = new Set<string>();
  for (const token of raw) {
    if (!STOP.has(token)) out.add(token);
    if (!token.includes("-")) continue;
    for (const part of token.split("-")) {
      if (part.length >= 3 && !STOP.has(part)) out.add(part);
    }
  }
  return out;
}

function contentWords(rubricItem: string): string[] {
  return [...tokens(rubricItem)].filter((word) => word.length >= 3);
}

/** A rubric line counts when the answer uses at least two of its content words. */
export function coverRubric(answer: string, rubric: string[]): boolean[] {
  if (answer.trim().length < 24) return rubric.map(() => false);
  const seen = tokens(answer);
  return rubric.map((item) => {
    const words = contentWords(item);
    if (words.length === 0) return false;
    const hits = words.filter((word) => seen.has(word)).length;
    return hits >= Math.min(2, words.length);
  });
}

export function passesRubric(covered: boolean[]): boolean {
  if (covered.length === 0) return false;
  const hits = covered.filter(Boolean).length;
  return hits >= Math.ceil(covered.length / 2);
}

export function quoteFromAnswer(answer: string): string {
  const trimmed = answer.trim().replace(/\s+/g, " ");
  const sentence = trimmed.split(/(?<=[.!?])\s/)[0] ?? trimmed;
  if (sentence.length <= 140) return sentence;
  return `${sentence.slice(0, 137).trimEnd()}...`;
}

export function followUpFor(rubric: string[], covered: boolean[]): string {
  const index = covered.findIndex((item) => !item);
  const point = index === -1 ? null : rubric[index];
  if (!point) return "Give one short example of this from a page you would build.";
  return `One part is still thin. ${point}`;
}

export function feedbackFor(rubric: string[], covered: boolean[], passed: boolean): string {
  if (passed) {
    const hit = rubric.find((_, index) => covered[index]);
    return hit ? `That covers the check. ${clip(hit)}` : "That covers the check.";
  }
  const missing = rubric.find((_, index) => !covered[index]);
  return missing ? `Still missing: ${clip(missing)}` : "Add the idea in your own words.";
}

function clip(text: string) {
  const clean = text.trim();
  if (clean.length <= 220) return clean;
  return `${clean.slice(0, 217).trimEnd()}...`;
}
