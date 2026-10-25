/**
 * Global search ranking, in plain code with unit tests. Every word of the query must match something in the entry
 * (its title, its keywords, or its description); a match at the start of a word beats one in the middle, the title
 * beats keywords, and keywords beat the description. Words of four letters or more forgive one typo (a letter added,
 * missing, changed, or two swapped).
 */

export type SearchKind = "page" | "feature" | "setting" | "action" | "help" | "niche" | "stage" | "resource" | "post";

export type SearchEntry = {
  id: string;
  kind: SearchKind;
  title: string;
  /** One short line under the title: what it is, or where it lives. */
  description?: string;
  keywords?: readonly string[];
  /** Where it goes. Actions without an href run in the browser (for example, switching the theme). */
  href?: string;
  action?: "theme" | "tour" | "assistant";
  icon?: string;
  badge?: string;
  /** Breaks near ties in a natural order, such as a path's stages from first to last. */
  order?: number;
};

export type SearchHit = SearchEntry & { score: number };

/** Lower case, accents removed, anything that is not a letter or a digit becomes a space. */
export function normalize(text: string) {
  return text
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function words(text: string) {
  const clean = normalize(text);
  return clean ? clean.split(" ") : [];
}

/** True when `a` can become `b` with at most one edit: a letter added, removed, changed, or two neighbours swapped. */
function withinOneEdit(a: string, b: string) {
  if (Math.abs(a.length - b.length) > 1) return false;
  if (a === b) return true;
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i += 1;
  if (a.length === b.length) {
    // One change, or one swap of neighbours.
    if (a.slice(i + 1) === b.slice(i + 1)) return true;
    return a[i] === b[i + 1] && a[i + 1] === b[i] && a.slice(i + 2) === b.slice(i + 2);
  }
  return a.length > b.length ? a.slice(i + 1) === b.slice(i) : a.slice(i) === b.slice(i + 1);
}

/** A typo: the query word is one edit away from the start of a word in the field. */
function nearMiss(token: string, fieldWords: readonly string[]) {
  return fieldWords.some((word) =>
    [token.length - 1, token.length, token.length + 1].some((length) => length >= 3 && word.length >= length && withinOneEdit(token, word.slice(0, length))),
  );
}

/** How well one query word matches one field: 3 at a word start, 2 inside a word, 1 for a near miss, else 0. */
function matchField(token: string, fieldWords: readonly string[], joined: string) {
  if (fieldWords.some((word) => word.startsWith(token))) return 3;
  if (token.length >= 3 && joined.includes(token)) return 2;
  if (token.length >= 4 && nearMiss(token, fieldWords)) return 1;
  return 0;
}

const FIELD_WEIGHT = { title: 6, keywords: 4, description: 2 } as const;
const KIND_BOOST: Partial<Record<SearchKind, number>> = { page: 3, feature: 2, setting: 1, action: 1, niche: 2 };

/** The score for one entry, or 0 when any query word is missing from it. */
export function scoreEntry(entry: SearchEntry, query: string) {
  const tokens = words(query);
  if (tokens.length === 0) return 0;
  const fields = {
    title: words(entry.title),
    keywords: (entry.keywords ?? []).flatMap((keyword) => words(keyword)),
    description: words(entry.description ?? ""),
  };
  const joined = {
    title: fields.title.join(" "),
    keywords: fields.keywords.join(" "),
    description: fields.description.join(" "),
  };
  let total = 0;
  for (const token of tokens) {
    let best = 0;
    for (const field of ["title", "keywords", "description"] as const) {
      best = Math.max(best, matchField(token, fields[field], joined[field]) * FIELD_WEIGHT[field]);
    }
    if (best === 0) return 0;
    total += best;
  }
  const whole = normalize(query);
  if (joined.title === whole) total += 40;
  else if (joined.title.startsWith(whole)) total += 20;
  total += KIND_BOOST[entry.kind] ?? 0;
  // Shorter titles win ties: "Notes" before "Notes by path".
  return total - Math.min(fields.title.length, 12) * 0.1;
}

/** The best matches, highest score first; near ties keep their natural order, then go alphabetical. */
export function searchEntries(entries: readonly SearchEntry[], query: string, limit = 20): SearchHit[] {
  return entries
    .map((entry) => ({ ...entry, score: scoreEntry(entry, query) }))
    .filter((hit) => hit.score > 0)
    .sort(
      (a, b) =>
        Math.round(b.score) - Math.round(a.score) ||
        (a.order ?? Number.MAX_SAFE_INTEGER) - (b.order ?? Number.MAX_SAFE_INTEGER) ||
        b.score - a.score ||
        a.title.localeCompare(b.title),
    )
    .slice(0, limit);
}

export const KIND_LABEL: Record<SearchKind, string> = {
  page: "Pages",
  feature: "Features",
  setting: "Settings",
  action: "Quick actions",
  help: "Help",
  niche: "Niches",
  stage: "Stages",
  resource: "Resources",
  post: "Open Source",
};

/** Results grouped for display, in a fixed section order, each group keeping its ranking. */
export function groupHits(hits: readonly SearchHit[]) {
  const order: SearchKind[] = ["action", "page", "feature", "setting", "niche", "stage", "resource", "post", "help"];
  return order
    .map((kind) => ({ kind, label: KIND_LABEL[kind], hits: hits.filter((hit) => hit.kind === kind) }))
    .filter((group) => group.hits.length > 0);
}
