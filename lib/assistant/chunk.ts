import { createHash } from "node:crypto";

/**
 * Turns SkillFlow's own knowledge into retrieval chunks. Plain code with unit tests: no database, no network.
 * Sizes are in estimated tokens (about four characters each), which is close enough for English prose and keeps
 * the chunker free of a tokenizer dependency.
 */

export type ChunkKind = "help" | "skill" | "stage" | "resource" | "transcript";

export type KnowledgeChunkInput = {
  kind: ChunkKind;
  /** The source row: a help article slug, or a Skill, RoadmapStage, or Resource id. */
  refId: string;
  chunkIndex: number;
  /** Stable across databases (help:explain-back, skill:chess, stage:chess/3, resource:chess/3/2). The eval uses it. */
  sourceKey: string;
  skillId: string | null;
  stageId: string | null;
  /** True when the niche, the stage, or the resource is monetized. Only Premium learners may retrieve it. */
  monetized: boolean;
  title: string;
  /** In-app link for help, niches, and stages; the resource's own URL for resources and transcripts. */
  url: string;
  /** The lesson that holds a resource, so the source list can link inside the app. */
  lessonUrl: string | null;
  text: string;
};

export const CHARS_PER_TOKEN = 4;
export const HELP_MAX_TOKENS = 500;
export const HELP_MIN_TOKENS = 60;
export const TRANSCRIPT_TOKENS = 400;
export const TRANSCRIPT_OVERLAP = 60;

export function estimateTokens(text: string) {
  return Math.ceil(text.length / CHARS_PER_TOKEN);
}

/** Same title and text give the same hash on every machine. The embedding model is stored beside it, not in it. */
export function textHash(title: string, text: string) {
  return createHash("sha256").update(`${title.trim()}\n${text.trim()}`).digest("hex");
}

function squash(text: string) {
  return text.replace(/\r\n/g, "\n").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}

/**
 * Splits text into windows of about `size` tokens that overlap by `overlap` tokens, cutting at a sentence or word
 * boundary when one is near. Every character of the input lands in at least one window.
 */
export function splitWithOverlap(text: string, size = TRANSCRIPT_TOKENS, overlap = TRANSCRIPT_OVERLAP): string[] {
  const clean = squash(text);
  if (!clean) return [];
  const max = size * CHARS_PER_TOKEN;
  const back = overlap * CHARS_PER_TOKEN;
  if (clean.length <= max) return [clean];
  const pieces: string[] = [];
  let start = 0;
  while (start < clean.length) {
    let end = Math.min(clean.length, start + max);
    if (end < clean.length) {
      // Prefer the last sentence end in the final fifth of the window, then the last space.
      const window = clean.slice(start, end);
      const floor = Math.floor(window.length * 0.8);
      const sentence = Math.max(window.lastIndexOf(". "), window.lastIndexOf("? "), window.lastIndexOf("! "), window.lastIndexOf("\n"));
      const space = window.lastIndexOf(" ");
      if (sentence >= floor) end = start + sentence + 1;
      else if (space >= floor) end = start + space;
    }
    pieces.push(clean.slice(start, end).trim());
    if (end >= clean.length) break;
    // Step back by the overlap, then forward to the next word so a window never starts mid-word.
    let next = Math.max(start + 1, end - back);
    const gap = clean.indexOf(" ", next);
    if (gap !== -1 && gap < end) next = gap + 1;
    start = next;
  }
  return pieces.filter(Boolean);
}

export type HelpArticle = {
  slug: string;
  title: string;
  url: string;
  body: string;
};

/** Reads the small front matter (title, url) and the body of one help article. */
export function parseHelpArticle(slug: string, source: string): HelpArticle {
  const text = source.replace(/\r\n/g, "\n");
  const match = /^---\n([\s\S]*?)\n---\n?/.exec(text);
  const meta: Record<string, string> = {};
  if (match) {
    for (const line of match[1].split("\n")) {
      const at = line.indexOf(":");
      if (at > 0) meta[line.slice(0, at).trim()] = line.slice(at + 1).trim();
    }
  }
  const body = match ? text.slice(match[0].length) : text;
  const heading = /^#\s+(.+)$/m.exec(body)?.[1]?.trim();
  return { slug, title: meta.title || heading || slug, url: meta.url || "/dashboard", body: body.trim() };
}

/**
 * One chunk per `##` section, each prefixed with the article title so a section still makes sense alone. A section
 * under HELP_MIN_TOKENS joins the next one; one over HELP_MAX_TOKENS is split with overlap.
 */
export function helpSections(article: HelpArticle): { heading: string; text: string }[] {
  const lines = article.body.split("\n");
  const sections: { heading: string; lines: string[] }[] = [{ heading: "", lines: [] }];
  for (const line of lines) {
    if (/^#\s+/.test(line)) continue;
    const sub = /^##+\s+(.+)$/.exec(line);
    if (sub) sections.push({ heading: sub[1].trim(), lines: [] });
    else sections[sections.length - 1].lines.push(line);
  }
  const merged: { heading: string; text: string }[] = [];
  let carry: { heading: string; text: string } | null = null;
  for (const section of sections) {
    const body = squash(section.lines.join("\n"));
    if (!body && !section.heading) continue;
    const text = section.heading ? `${section.heading}\n${body}` : body;
    const current: { heading: string; text: string } = carry
      ? { heading: carry.heading || section.heading, text: `${carry.text}\n\n${text}` }
      : { heading: section.heading, text };
    if (estimateTokens(current.text) < HELP_MIN_TOKENS) {
      carry = current;
      continue;
    }
    carry = null;
    merged.push(current);
  }
  if (carry) {
    if (merged.length) merged[merged.length - 1].text += `\n\n${carry.text}`;
    else merged.push(carry);
  }
  return merged.flatMap((section) =>
    estimateTokens(section.text) > HELP_MAX_TOKENS
      ? splitWithOverlap(section.text, HELP_MAX_TOKENS, TRANSCRIPT_OVERLAP).map((text) => ({ heading: section.heading, text }))
      : [section],
  );
}

export function helpChunks(article: HelpArticle): KnowledgeChunkInput[] {
  return helpSections(article).map((section, index) => ({
    kind: "help",
    refId: article.slug,
    chunkIndex: index,
    sourceKey: `help:${article.slug}`,
    skillId: null,
    stageId: null,
    monetized: false,
    title: section.heading ? `${article.title}: ${section.heading}` : article.title,
    url: article.url,
    lessonUrl: null,
    text: `${article.title}\n${section.text}`,
  }));
}

export type CatalogSkill = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  nicheGroup: string;
  status: "AVAILABLE" | "COMING_SOON";
  offer: "FREE" | "MONETIZED";
  free: boolean;
  stageCount: number;
};

export type CatalogStage = {
  id: string;
  order: number;
  title: string;
  description: string | null;
  level: string;
  learningObjectives: string[];
  monetized: boolean;
};

export type CatalogResource = {
  id: string;
  order: number;
  type: string;
  url: string;
  title: string;
  description: string | null;
  keyPoints: string[];
  provider: string;
  depth: string | null;
  durationMinutes: number | null;
  transcript: string | null;
  monetized: boolean;
};

const GROUP_LABEL: Record<string, string> = {
  CARE: "Care",
  MONEY: "Money",
  HOME: "Home",
  LANGUAGE: "Language",
  GAMES: "Games",
  CRAFT: "Craft",
  FUTURE: "Future",
  MIND: "Mind",
};

const RESOURCE_LABEL: Record<string, string> = {
  HOOK_CLIP: "Clip",
  EMBEDDED_VIDEO: "Video",
  DOC_LINK: "Article or doc",
  COURSE_LINK: "Course",
};

/** A skill monetized for retrieval: a Premium niche's stages and resources. Its listing is public (see skillChunk). */
export function skillMonetized(skill: Pick<CatalogSkill, "offer" | "free">) {
  return skill.offer === "MONETIZED" && !skill.free;
}

/**
 * One chunk per niche. The listing itself (name, description, Free or Premium) is what the Niches page shows every
 * visitor, so it stays retrievable for everyone with the same "Premium niche" framing the app uses. What sits inside
 * a monetized niche (its stages and resources) is filtered in SQL.
 */
export function skillChunk(skill: CatalogSkill): KnowledgeChunkInput {
  const premium = skillMonetized(skill);
  const status = skill.status !== "AVAILABLE"
    ? "Coming soon."
    : premium
      ? "Premium niche: opening its path needs Premium (see /upgrade)."
      : `Free path with ${skill.stageCount} stages, every stage included.`;
  return {
    kind: "skill",
    refId: skill.id,
    chunkIndex: 0,
    sourceKey: `skill:${skill.slug}`,
    skillId: skill.id,
    stageId: null,
    monetized: false,
    title: `${skill.name} (niche)`,
    url: `/roadmap/${skill.slug}`,
    lessonUrl: null,
    text: [`Niche: ${skill.name}`, `Group: ${GROUP_LABEL[skill.nicheGroup] ?? skill.nicheGroup}`, status, skill.description ?? ""].filter(Boolean).join("\n"),
  };
}

export function stageChunk(skill: CatalogSkill, stage: CatalogStage): KnowledgeChunkInput {
  return {
    kind: "stage",
    refId: stage.id,
    chunkIndex: 0,
    sourceKey: `stage:${skill.slug}/${stage.order}`,
    skillId: skill.id,
    stageId: stage.id,
    monetized: skillMonetized(skill) || stage.monetized,
    title: `${skill.name}, stage ${stage.order}: ${stage.title}`,
    url: `/lesson/${stage.id}`,
    lessonUrl: `/lesson/${stage.id}`,
    text: [
      `Stage ${stage.order} of the ${skill.name} path: ${stage.title}`,
      `Level: ${stage.level.toLowerCase()}`,
      stage.description ?? "",
      stage.learningObjectives.length ? `What this stage covers:\n${stage.learningObjectives.map((item) => `- ${item}`).join("\n")}` : "",
    ].filter(Boolean).join("\n"),
  };
}

export function resourceChunks(skill: CatalogSkill, stage: CatalogStage, resource: CatalogResource): KnowledgeChunkInput[] {
  const monetized = skillMonetized(skill) || stage.monetized || resource.monetized;
  const base = {
    refId: resource.id,
    sourceKey: `resource:${skill.slug}/${stage.order}/${resource.order}`,
    skillId: skill.id,
    stageId: stage.id,
    monetized,
    url: resource.url,
    lessonUrl: `/lesson/${stage.id}`,
  };
  const facts = [
    RESOURCE_LABEL[resource.type] ?? "Resource",
    resource.provider ? `from ${resource.provider}` : "",
    resource.durationMinutes ? `${resource.durationMinutes} min` : "",
    resource.depth ? `depth ${resource.depth.toLowerCase()}` : "",
  ].filter(Boolean).join(", ");
  const main: KnowledgeChunkInput = {
    ...base,
    kind: "resource",
    chunkIndex: 0,
    title: resource.title,
    text: [
      `${resource.title} (${facts})`,
      `In ${skill.name}, stage ${stage.order}: ${stage.title}`,
      resource.description ?? "",
      resource.keyPoints.length ? `Key points:\n${resource.keyPoints.map((point) => `- ${point}`).join("\n")}` : "",
    ].filter(Boolean).join("\n"),
  };
  const transcript = (resource.transcript ?? "").trim();
  const parts = transcript ? splitWithOverlap(transcript) : [];
  return [
    main,
    ...parts.map((text, index) => ({
      ...base,
      kind: "transcript" as const,
      chunkIndex: index,
      title: `${resource.title} (transcript, part ${index + 1})`,
      text: `Transcript of ${resource.title}, part ${index + 1}:\n${text}`,
    })),
  ];
}

/** The identity of a chunk row. */
export function chunkKey(chunk: { kind: string; refId: string; chunkIndex: number }) {
  return `${chunk.kind}|${chunk.refId}|${chunk.chunkIndex}`;
}
