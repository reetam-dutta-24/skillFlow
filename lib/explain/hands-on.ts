/**
 * Hands-on proof for practical paths, in plain code with unit tests. Explaining an idea and doing it are different
 * things, so on a path where the skill is something you make or perform, a stage is recorded only after every idea
 * holds AND one small piece of real work is shown: a link, a photo or screenshot, a short video, or a PDF, with a
 * write-up of what was done.
 *
 * The review model cannot watch a video or look at a photo, so it judges the write-up (and the text of a linked page
 * when one can be read). The file or link is the evidence that stays with the proof. The write-up goes through the
 * same own-words check as every explain-back answer.
 */

export type ProofKind = "link" | "image" | "video" | "doc";

export type HandsOnSpec = {
  /** What counts as proof on this path, in the order the form offers them. */
  kinds: ProofKind[];
  /** One sentence: what to do for a stage. */
  doIt: string;
  /** A few concrete examples, so the task never feels vague. */
  examples: string[];
};

const CODE: HandsOnSpec = {
  kinds: ["link", "image", "video"],
  doIt: "Build or change a small piece of code that uses this stage.",
  examples: ["a repository or a commit", "a live page or a CodePen", "a screenshot of it running", "a short screen recording"],
};

/**
 * Paths where the skill is made or performed. Paths about knowledge, habits, or personal life (psychology, nutrition,
 * personal finance, relationships, self grooming, and the like) stay explain-back only: asking for photos of
 * someone's body, money, or home is not proof of learning.
 */
export const HANDS_ON_PATHS: Record<string, HandsOnSpec> = {
  "full-stack-web-dev": CODE,
  "iot-robot-automation": {
    kinds: ["video", "image", "link"],
    doIt: "Wire, flash, or simulate something small that uses this stage.",
    examples: ["a short video of the circuit working", "a photo of the wiring", "a Wokwi or Tinkercad simulation link"],
  },
  "music-production": {
    kinds: ["link", "video", "image"],
    doIt: "Make a short loop, beat, or mix that uses this stage.",
    examples: ["a SoundCloud, Drive, or YouTube link", "a screen recording of the session", "a screenshot of the arrangement"],
  },
  animation: {
    kinds: ["video", "link", "image"],
    doIt: "Animate a short shot or effect that uses this stage.",
    examples: ["a few seconds of rendered animation", "a link to the clip", "a frame or a screenshot of the timeline"],
  },
  "graphic-design": {
    kinds: ["image", "link", "doc"],
    doIt: "Design one small piece that uses this stage.",
    examples: ["an exported image", "a Figma, Canva, or Behance link", "a PDF of the layout"],
  },
  photography: {
    kinds: ["image", "link"],
    doIt: "Take a photo, or a small set, that uses this stage on purpose.",
    examples: ["the photo itself", "a link to the set", "a note of the settings you chose"],
  },
  "art-painting": {
    kinds: ["image", "video", "link"],
    doIt: "Make a study, sketch, or painting that uses this stage.",
    examples: ["a photo of the piece", "a short time-lapse", "a link to the post"],
  },
  guitar: {
    kinds: ["video", "link"],
    doIt: "Play something short that uses this stage.",
    examples: ["a short video of your hands playing", "a link to a recording"],
  },
  badminton: {
    kinds: ["video", "link"],
    doIt: "Drill or play something that uses this stage.",
    examples: ["a short video of the drill or a rally", "a link to the clip"],
  },
  "sound-design": {
    kinds: ["video", "link"],
    doIt: "Design a short sound or sequence that uses this stage.",
    examples: ["a screen recording with the sound", "a SoundCloud or Drive link"],
  },
  "content-creation": {
    kinds: ["video", "link", "image"],
    doIt: "Make one small piece of content that uses this stage.",
    examples: ["a short video", "a link to the post", "a thumbnail or a storyboard image"],
  },
  "travel-vlogging": {
    kinds: ["video", "link"],
    doIt: "Film and cut a short clip that uses this stage.",
    examples: ["the clip itself", "a link to it"],
  },
  podcasting: {
    kinds: ["link", "video"],
    doIt: "Record a short segment that uses this stage.",
    examples: ["a link to the audio", "a video of the recording"],
  },
  cybersecurity: {
    kinds: ["link", "image", "doc"],
    doIt: "Do a small lab exercise that uses this stage, on a system you own or a practice range.",
    examples: ["a link to a lab or a room you finished", "a screenshot of the result", "a short PDF write-up"],
  },
  "interior-design": {
    kinds: ["image", "doc", "link"],
    doIt: "Sketch or plan one small space with this stage in mind.",
    examples: ["a sketch or a mood board", "a PDF floor plan", "a link to the board"],
  },
  "public-speaking": {
    kinds: ["video", "link"],
    doIt: "Give a short talk, or part of one, that uses this stage.",
    examples: ["a one-minute video", "a link to the recording"],
  },
  chess: {
    kinds: ["link", "image"],
    doIt: "Play or study a position that uses this stage.",
    examples: ["a Lichess or Chess.com game or study link", "a screenshot of the position"],
  },
  screenwriting: {
    kinds: ["doc", "link"],
    doIt: "Write a short scene or page that uses this stage.",
    examples: ["a PDF of the pages", "a link to the draft"],
  },
  seo: {
    kinds: ["link", "image"],
    doIt: "Change or check one real page with this stage in mind.",
    examples: ["the page you worked on", "a screenshot of the result in a search tool"],
  },
  "digital-marketing": {
    kinds: ["image", "link", "doc"],
    doIt: "Draft one small campaign piece that uses this stage.",
    examples: ["an ad or a post mock-up", "a link to the live post", "a one-page PDF plan"],
  },
  "ai-tools": {
    kinds: ["link", "image", "doc"],
    doIt: "Use an AI tool on one real task the way this stage teaches.",
    examples: ["a shared chat or a workflow link", "a screenshot of the result", "a PDF of the prompt and what came back"],
  },
  freelancing: {
    kinds: ["doc", "link", "image"],
    doIt: "Make one real piece of your freelance setup that uses this stage.",
    examples: ["a PDF proposal or rate sheet", "a portfolio or profile link", "a screenshot of the listing"],
  },
};

export function handsOnSpec(slug: string): HandsOnSpec | null {
  return HANDS_ON_PATHS[slug] ?? null;
}

export const KIND_LABEL: Record<ProofKind, string> = {
  link: "A link",
  image: "A photo or screenshot",
  video: "A short video",
  doc: "A PDF",
};

/** The task for one stage: do one small real thing with it, then show it. */
export function handsOnTask(spec: HandsOnSpec, stageTitle: string): string {
  return `${spec.doIt} Keep it small: one real attempt at "${stageTitle.trim()}" is enough. Then show it, and say what you did.`;
}

export const MIN_WRITEUP_WORDS = 40;
export const MAX_WRITEUP_CHARS = 4000;

const UPLOAD = /^\/uploads\/[a-z0-9]+\.(jpe?g|png|webp|gif|pdf|mp4|webm|mov)$/;

function uploadKind(ext: string): ProofKind {
  if (ext === "pdf") return "doc";
  if (ext === "mp4" || ext === "webm" || ext === "mov") return "video";
  return "image";
}

function words(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export type ProofInput = { kind: ProofKind; url: string; writeUp: string };

export type ProofCheck = { ok: true; proof: ProofInput } | { ok: false; error: string };

/** Everything the form sends, checked before any model call. */
export function checkProof(spec: HandsOnSpec, raw: { kind?: unknown; url?: unknown; writeUp?: unknown }): ProofCheck {
  const kind = typeof raw.kind === "string" && (spec.kinds as string[]).includes(raw.kind) ? (raw.kind as ProofKind) : null;
  if (!kind) return { ok: false, error: "Choose what you are showing." };
  const url = typeof raw.url === "string" ? raw.url.trim() : "";
  const writeUp = typeof raw.writeUp === "string" ? raw.writeUp.trim().slice(0, MAX_WRITEUP_CHARS) : "";

  if (kind === "link") {
    let parsed: URL | null = null;
    try {
      parsed = new URL(url);
    } catch {
      parsed = null;
    }
    if (!parsed || parsed.protocol !== "https:" || url.length > 500) return { ok: false, error: "Paste a full https:// link to your work." };
  } else {
    const match = UPLOAD.exec(url);
    if (!match) return { ok: false, error: "Upload the file first." };
    if (uploadKind(match[1]) !== kind) return { ok: false, error: `That file is not ${KIND_LABEL[kind].toLowerCase()}.` };
  }

  if (words(writeUp) < MIN_WRITEUP_WORDS) {
    return { ok: false, error: `Say what you did in at least ${MIN_WRITEUP_WORDS} words: what you made, how, and one thing you changed or fixed.` };
  }
  return { ok: true, proof: { kind, url, writeUp } };
}

/** Pages whose text says nothing about the work (players, drives, social feeds), so they are not fetched. */
const MEDIA_HOSTS = /(^|\.)(youtube\.com|youtu\.be|vimeo\.com|drive\.google\.com|docs\.google\.com|soundcloud\.com|instagram\.com|tiktok\.com|facebook\.com|x\.com|twitter\.com|dropbox\.com|loom\.com)$/i;

/** True when reading the linked page could tell the reviewer something (a repository, a write-up, a study). */
export function linkWorthReading(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" && !MEDIA_HOSTS.test(parsed.hostname);
  } catch {
    return false;
  }
}
