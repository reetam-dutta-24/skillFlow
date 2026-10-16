/**
 * Scripted logic behind the tour's "Try it" demos. Plain functions, no I/O: the demos never write to the database,
 * call a model, or navigate. The components in components/tour/TourDemos.tsx only render what these return.
 */
import { DAILY_CAP, bandFor, clampScore, dayPoints, type DetoxEventKind } from "@/lib/detox/score";
import { RECALL_GAP_MS } from "@/lib/explain/recall";

/* ── Paths and stages ─────────────────────────────────────────────────────── */

/** The first three stages of Full-Stack Web Development, with their real photos. */
export const PATH_DEMO_STAGES = [
  { title: "How the Web Works & Semantic HTML", image: "/stages/full-stack-web-dev/1.jpg" },
  { title: "CSS Layout & Responsive Design", image: "/stages/full-stack-web-dev/2.jpg" },
  { title: "JavaScript Fundamentals", image: "/stages/full-stack-web-dev/3.jpg" },
] as const;

export type PathTap = { kind: "open"; message: string } | { kind: "locked"; message: string };

/** Stage 1 is open; every later stage waits on the one before it, with the same sentence the path page uses. */
export function tapPathStage(index: number): PathTap {
  if (index <= 0) return { kind: "open", message: "Open. Its videos, docs and courses are ready for you." };
  return { kind: "locked", message: `Pass stage ${index} to open this one.` };
}

/* ── Explain-back practice ────────────────────────────────────────────────── */

export const PRACTICE_IDEA = "What is a variable?";
/** Fewer words than this is too thin to show understanding. */
export const PRACTICE_MIN_WORDS = 8;
export const PRACTICE_MAX_CHARS = 400;

/** A reason or a use: why it exists, or when you reach for it. */
const REASON = /\b(?:because|so|when|used\s+to)\b/i;

export type PracticeReview =
  | { verdict: "empty"; title: string; hint: string }
  | { verdict: "stay"; reason: "short" | "no-reason"; title: string; hint: string }
  | { verdict: "holds"; title: string; hint: string };

/**
 * The practice rule, standing in for the real AI review: a very short answer, or one that never says why or when,
 * stays on the idea with a one-line hint. A fuller answer with a reason holds.
 */
export function reviewPracticeAnswer(text: string): PracticeReview {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    return { verdict: "empty", title: "Write a sentence or two first", hint: "Say what a variable is, in your own words." };
  }
  if (words.length < PRACTICE_MIN_WORDS) {
    return {
      verdict: "stay",
      reason: "short",
      title: "Stay with this idea",
      hint: "Say a little more: what a variable holds, and why you would use one.",
    };
  }
  if (!REASON.test(text)) {
    return {
      verdict: "stay",
      reason: "no-reason",
      title: "Stay with this idea",
      hint: "Add the why: what is a variable for, or when would you reach for one?",
    };
  }
  return { verdict: "holds", title: "This idea holds", hint: "You said what it is and why it matters. That is what a review looks for." };
}

/* ── Notes and recall ─────────────────────────────────────────────────────── */

export const SAMPLE_NOTE =
  "A variable is a name for a value, so you can store it once and use it again when the program needs it.";
export const RECALL_QUESTION = "Without looking back: what is a variable, and why would you use one?";
export const RECALL_GAP_HOURS = RECALL_GAP_MS / (60 * 60 * 1000);
const NOTE_MAX_CHARS = 200;

/** The note card shows the learner's own practice answer when it held, and a sample otherwise. */
export function practiceNote(answer: string | null): { text: string; fromAnswer: boolean } {
  const clean = (answer ?? "").replace(/\s+/g, " ").trim();
  if (!clean || reviewPracticeAnswer(clean).verdict !== "holds") return { text: SAMPLE_NOTE, fromAnswer: false };
  if (clean.length <= NOTE_MAX_CHARS) return { text: clean, fromAnswer: true };
  const cut = clean.slice(0, NOTE_MAX_CHARS);
  const space = cut.lastIndexOf(" ");
  return { text: `${(space > 0 ? cut.slice(0, space) : cut).replace(/[\s,.;:]+$/, "")}…`, fromAnswer: true };
}

/* ── Progress ─────────────────────────────────────────────────────────────── */

export type ProgressDemo = { passed: number; total: number; streak: number; passedToday: boolean };

export const PROGRESS_START: ProgressDemo = { passed: 1, total: 4, streak: 2, passedToday: false };

/** One more stage passed. The first pass today adds a streak day; later passes the same day only add mastery. */
export function passDemoStage(state: ProgressDemo): ProgressDemo {
  if (state.passed >= state.total) return state;
  return {
    ...state,
    passed: state.passed + 1,
    streak: state.passedToday ? state.streak : state.streak + 1,
    passedToday: true,
  };
}

/** The share of stages passed, the same rule Progress uses. */
export function demoMastery(state: ProgressDemo) {
  return state.total > 0 ? Math.round((state.passed / state.total) * 100) : 0;
}

/* ── Make it yours: pace ──────────────────────────────────────────────────── */

export type DemoPace = "light" | "steady" | "intense";

export const DEMO_PACES: readonly { id: DemoPace; label: string }[] = [
  { id: "light", label: "Light" },
  { id: "steady", label: "Steady" },
  { id: "intense", label: "Intense" },
];

export const WEEK_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
export const WEEK_DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const;

const PACE_PATTERN: Record<DemoPace, { days: number[]; minutes: number }> = {
  light: { days: [0, 2, 5], minutes: 30 },
  steady: { days: [0, 1, 3, 4, 6], minutes: 45 },
  intense: { days: [0, 1, 2, 3, 4, 5], minutes: 60 },
};

const SESSION_KINDS = ["Watch", "Read", "Practise"] as const;

export type PlanSession = { id: string; day: number; minutes: number; kind: (typeof SESSION_KINDS)[number] | "Explain back" };

/**
 * A sample week for a pace. Sessions keep their ids across paces, so the same block can move to its new day.
 * The last session of the week is always the explain-back.
 */
export function planWeek(pace: DemoPace): PlanSession[] {
  const { days, minutes } = PACE_PATTERN[pace];
  return days.map((day, index) => ({
    id: `session-${index}`,
    day,
    minutes,
    kind: index === days.length - 1 ? "Explain back" : SESSION_KINDS[index % SESSION_KINDS.length],
  }));
}

export function weeklyMinutes(pace: DemoPace) {
  return planWeek(pace).reduce((sum, session) => sum + session.minutes, 0);
}

/** "1 h 30 min", "45 min", "6 h". */
export function formatMinutes(total: number) {
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  if (hours === 0) return `${minutes} min`;
  return minutes === 0 ? `${hours} h` : `${hours} h ${minutes} min`;
}

/* ── Beyond the path ──────────────────────────────────────────────────────── */

export type BeyondTileId = "open-source" | "nearby" | "creator";

export const BEYOND_TILES: readonly { id: BeyondTileId; title: string; icon: string; line: string }[] = [
  {
    id: "open-source",
    title: "Open Source",
    icon: "git-pull-request",
    line: "Share notes, guides and projects with your niche. A reviewer reads each one before it goes public.",
  },
  {
    id: "nearby",
    title: "Nearby",
    icon: "map-pin",
    line: "See how many learners study around your city, and find events for the paths you follow.",
  },
  {
    id: "creator",
    title: "Creator studio",
    icon: "video",
    line: "Upload a video you made. Once it is approved, it joins that niche’s clip feed.",
  },
];

export type BeyondState = { open: BeyondTileId[]; seen: BeyondTileId[] };

export const BEYOND_START: BeyondState = { open: [], seen: [] };

/** Opens or closes a tile. Every tile opened at least once counts as seen. */
export function toggleBeyondTile(state: BeyondState, id: BeyondTileId): BeyondState {
  if (!BEYOND_TILES.some((tile) => tile.id === id)) return state;
  const isOpen = state.open.includes(id);
  return {
    open: isOpen ? state.open.filter((item) => item !== id) : [...state.open, id],
    seen: state.seen.includes(id) ? state.seen : [...state.seen, id],
  };
}

export function allBeyondSeen(state: BeyondState) {
  return BEYOND_TILES.every((tile) => state.seen.includes(tile.id));
}

/* ── Niches and following ─────────────────────────────────────────────────── */

export const NICHE_DEMO = [
  { slug: "full-stack-web-dev", name: "Full-Stack Web Development", image: "/skills/web.jpg", stages: 12 },
  { slug: "photography", name: "Photography", image: "/skills/photo.jpg", stages: 8 },
  { slug: "music-production", name: "Music Production", image: "/skills/music.jpg", stages: 8 },
  { slug: "chess", name: "Chess", image: "/skills/chess.jpg", stages: 8 },
] as const;

/** Follow or stop following one sample niche. Order stays the order they were followed in. */
export function toggleFollow(followed: readonly string[], slug: string): string[] {
  if (!NICHE_DEMO.some((niche) => niche.slug === slug)) return [...followed];
  return followed.includes(slug) ? followed.filter((item) => item !== slug) : [...followed, slug];
}

/* ── Lessons ──────────────────────────────────────────────────────────────── */

export const LESSON_DEMO_STEPS = [
  { kind: "Watch first", icon: "circle-play", detail: "The stage's clip plays right inside the lesson." },
  { kind: "Read", icon: "file-text", detail: "A doc opens beside you. Read it, then come back for the next step." },
  { kind: "Course", icon: "graduation-cap", detail: "A free course chapter. Your plan can mark the extra ones Optional." },
  { kind: "When you are ready", icon: "message-square-quote", detail: "Explain the stage back, one idea at a time." },
] as const;

/** Move through the sample lesson, never past either end. */
export function lessonStep(current: number, delta: number) {
  return Math.max(0, Math.min(LESSON_DEMO_STEPS.length - 1, current + delta));
}

/* ── Practice on anything ─────────────────────────────────────────────────── */

export const PRACTICE_SOURCES = [
  { id: "link", label: "A link", icon: "link", detail: "Paste a public page. SkillFlow reads its text, then you explain one idea from it." },
  { id: "file", label: "A file", icon: "file-up", detail: "Drop a text file, like your own lecture notes, and practise on it." },
  { id: "text", label: "Pasted text", icon: "clipboard-paste", detail: "Paste a passage straight in. The note it makes is yours alone." },
] as const;

export type PracticeSource = (typeof PRACTICE_SOURCES)[number]["id"];

/* ── Activity heatmap ─────────────────────────────────────────────────────── */

export const HEAT_DAYS = 14;
export const HEAT_MAX = 4;

/** One more tap on a day: a little more activity, wrapping back to none after the busiest shade. */
export function bumpDay(levels: readonly number[], index: number): number[] {
  return levels.map((level, position) => (position === index ? (level + 1) % (HEAT_MAX + 1) : level));
}

export function heatTotals(levels: readonly number[]) {
  return { total: levels.reduce((sum, level) => sum + level, 0), activeDays: levels.filter((level) => level > 0).length };
}

/* ── Dopamine Detox ───────────────────────────────────────────────────────── */

export const DETOX_DEMO_BASE = -12;

export const DETOX_DEMO_ACTIONS: readonly {
  id: string;
  label: string;
  icon: string;
  kind: DetoxEventKind;
  quality?: "strong";
  minutes?: number;
}[] = [
  { id: "idea", label: "Explain an idea", icon: "message-square-quote", kind: "idea" },
  { id: "recall", label: "Strong recall", icon: "brain", kind: "recall", quality: "strong" },
  { id: "focus", label: "25 focused minutes", icon: "timer", kind: "focus", minutes: 25 },
];

/** The sample day, scored by the real rule in lib/detox/score.ts, daily limit included. */
export function detoxDemo(actions: readonly string[]) {
  const at = new Date(0);
  const events = actions
    .map((id) => DETOX_DEMO_ACTIONS.find((action) => action.id === id))
    .filter((action) => action !== undefined)
    .map((action) => ({ at, kind: action.kind, quality: action.quality, minutes: action.minutes }));
  const { earned, capped } = dayPoints(events);
  const score = clampScore(DETOX_DEMO_BASE + earned);
  return { score, earned, capped, cap: DAILY_CAP, band: bandFor(score).label };
}

/* ── Themes and accents ───────────────────────────────────────────────────── */

/** Six of the presets, with the colours the preview needs. Values match app/globals.css. */
export const THEME_DEMO_PRESETS = [
  { id: "tide", label: "Tide", gradient: "linear-gradient(to left, #1d4ed8, #0369a1 49.5%, #0e7490)", bright: "#5ef6ff", mid: "#22e7ff", deep: "#0e7490", strong: "#1d4ed8", app: "#04141c", elevated: "#0a2430", appLight: "#f0fbff", elevatedLight: "#f7fdff", cardLight: "#f4fbfe" },
  { id: "iris", label: "Iris", gradient: "linear-gradient(to left, #4c1d95, #6d28d9 49.5%, #5b21b6)", bright: "#d7b4ff", mid: "#b07cff", deep: "#6d28d9", strong: "#5b21b6", app: "#12081f", elevated: "#1c1033", appLight: "#f7f4ff", elevatedLight: "#fcfbff", cardLight: "#f6f3ff" },
  { id: "grove", label: "Grove", gradient: "linear-gradient(to left, #065f46, #047857 49.5%, #0f766e)", bright: "#5dffc0", mid: "#2ee59a", deep: "#047857", strong: "#065f46", app: "#041510", elevated: "#0a2820", appLight: "#f1fdf6", elevatedLight: "#f8fffb", cardLight: "#f3fcf7" },
  { id: "ember", label: "Ember", gradient: "linear-gradient(to left, #9a3412, #c2410c 49.5%, #9f1239)", bright: "#ffc14d", mid: "#ff8a1f", deep: "#c2410c", strong: "#9a3412", app: "#1a0c08", elevated: "#2a1610", appLight: "#fff6f1", elevatedLight: "#fffbf8", cardLight: "#fff5f0" },
  { id: "bloom", label: "Bloom", gradient: "linear-gradient(to left, #9d174d, #a21caf 49.5%, #6b21a8)", bright: "#ff6ee0", mid: "#ff4fd8", deep: "#a21caf", strong: "#6b21a8", app: "#1a0814", elevated: "#2a1020", appLight: "#fff2f8", elevatedLight: "#fffafc", cardLight: "#fff5f9" },
  { id: "volt", label: "Volt", gradient: "linear-gradient(to left, #365314, #3f6212 49.5%, #4d7c0f)", bright: "#d6ff4a", mid: "#c8ff3d", deep: "#3f6212", strong: "#365314", app: "#0c1406", elevated: "#18240c", appLight: "#f6ffe8", elevatedLight: "#fbfff4", cardLight: "#f4fee6" },
] as const;

export type ThemeDemoPreset = (typeof THEME_DEMO_PRESETS)[number];

/** The CSS variables that recolour only the preview box: the same names the real accent sets on <html>. */
export function themeDemoVars(preset: ThemeDemoPreset): Record<string, string> {
  return {
    "--preset-gradient": preset.gradient,
    "--gradient-brand": preset.gradient,
    "--preset-bright": preset.bright,
    "--preset-mid": preset.mid,
    "--preset-deep": preset.deep,
    "--preset-strong": preset.strong,
    "--hue-app": preset.app,
    "--hue-elevated": preset.elevated,
    "--hue-app-light": preset.appLight,
    "--hue-elevated-light": preset.elevatedLight,
    "--hue-card-light": preset.cardLight,
  };
}

/* ── Notifications ────────────────────────────────────────────────────────── */

export const INBOX_DEMO = [
  { id: "review", icon: "circle-check", title: "Your contribution was published", message: "“CSS grid in five minutes” is live on Open Source." },
  { id: "question", icon: "message-circle-question", title: "A learner asked about your post", message: "“Does this work with flexbox too?”" },
  { id: "detox", icon: "leaf", title: "Your weekly Detox check-in", message: "One minute: your screen time and focus this week." },
] as const;

export function readNote(read: readonly string[], id: string): string[] {
  return read.includes(id) || !INBOX_DEMO.some((note) => note.id === id) ? [...read] : [...read, id];
}

export function readAllNotes(): string[] {
  return INBOX_DEMO.map((note) => note.id);
}

export function unreadCount(read: readonly string[]) {
  return INBOX_DEMO.filter((note) => !read.includes(note.id)).length;
}
