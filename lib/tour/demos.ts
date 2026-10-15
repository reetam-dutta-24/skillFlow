/**
 * Scripted logic behind the tour's "Try it" demos. Plain functions, no I/O: the demos never write to the database,
 * call a model, or navigate. The components in components/tour/TourDemos.tsx only render what these return.
 */
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
