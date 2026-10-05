function learnerLine(line: string): string {
  const cleaned = line
    .trim()
    .replace(/^explains that\s+/i, "")
    .replace(/^explains\s+/i, "")
    .replace(/^names the\s+/i, "")
    .replace(/^names\s+/i, "")
    .replace(/^defines a closure as\s+/i, "a closure is ")
    .replace(/^defines\s+/i, "")
    .replace(/^gives a practical\s+/i, "a practical ")
    .trim();
  if (!cleaned) return line.trim();
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

export function stageConcepts(objectives: string[], rubric: string[]): string[] {
  const seen = new Set<string>();
  const concepts: string[] = [];
  for (const item of objectives) {
    const clean = item.trim();
    const key = clean.toLowerCase();
    if (!clean || seen.has(key)) continue;
    seen.add(key);
    concepts.push(clean);
  }
  for (const item of rubric) {
    const clean = learnerLine(item);
    const key = clean.toLowerCase();
    if (!clean || seen.has(key)) continue;
    seen.add(key);
    concepts.push(clean);
  }
  return concepts;
}

export function explainQuestion(title: string): string {
  return `Explain ${title} in your own words.`;
}

export function quoteFromAnswer(answer: string): string {
  const trimmed = answer.trim().replace(/\s+/g, " ");
  const sentence = trimmed.split(/(?<=[.!?])\s/)[0] ?? trimmed;
  if (sentence.length <= 140) return sentence;
  return `${sentence.slice(0, 137).trimEnd()}...`;
}

export function followUpForGaps(concepts: { concept: string; understood: boolean }[]): string {
  const missing = concepts.filter((item) => !item.understood).map((item) => item.concept);
  if (missing.length === 0) return "";
  if (missing.length === 1) {
    return `You have not shown ${missing[0]} yet. Explain what it is, and when you would use it, in your own words.`;
  }
  return `These ideas are still missing or too thin: ${missing.join("; ")}. Explain each one: what it is, and when you would use it.`;
}

export function feedbackForGaps(concepts: { concept: string; understood: boolean }[]): string {
  const missing = concepts.filter((item) => !item.understood).map((item) => item.concept);
  if (missing.length === 0) return "You explained each idea in this stage.";
  return `This stage stays open. Still to explain: ${missing.join("; ")}.`;
}
