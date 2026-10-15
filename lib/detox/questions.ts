/**
 * The Dopamine Detox baseline self-check. SkillFlow's own wording, written for this app; not taken from any published
 * questionnaire and not clinically validated. Every option carries the points it adds to the raw baseline, so the score
 * is plain arithmetic (lib/detox/score.ts). Change a question or a point value only together with DETOX_VERSION.
 */

export const DETOX_VERSION = 1;

export type DetoxSection = "screen" | "short-form" | "reaching" | "focus" | "sleep" | "offline" | "mood";

export type DetoxOption = { id: string; label: string; points: number };

export type DetoxQuestion = {
  id: string;
  section: DetoxSection;
  /** "single": one option. "chips": any number. "scale": 1 to 5, shown as five buttons. */
  kind: "single" | "chips" | "scale";
  prompt: string;
  hint?: string;
  options: DetoxOption[];
  /** For chips: the most points the picks can add together, and the id that means "none of these". */
  chipCap?: number;
  noneId?: string;
};

export const SECTION_LABELS: Record<DetoxSection, string> = {
  screen: "Screen time",
  "short-form": "Short video and social",
  reaching: "Reaching for the phone",
  focus: "Focus",
  sleep: "Sleep and routine",
  offline: "Offline life",
  mood: "Focus and mood lately",
};

/** Screen-time bands, shared by the baseline and the weekly check-in. `hours` is the middle of the band. */
export const SCREEN_BANDS = [
  { id: "lt1", label: "Under 1 hour", hours: 0.5, points: 12 },
  { id: "1-2", label: "1 to 2 hours", hours: 1.5, points: 6 },
  { id: "2-4", label: "2 to 4 hours", hours: 3, points: 0 },
  { id: "4-6", label: "4 to 6 hours", hours: 5, points: -8 },
  { id: "6plus", label: "More than 6 hours", hours: 7, points: -14 },
] as const;

export type ScreenBand = (typeof SCREEN_BANDS)[number]["id"];

export function isScreenBand(value: unknown): value is ScreenBand {
  return SCREEN_BANDS.some((band) => band.id === value);
}

export function screenBand(id: ScreenBand) {
  return SCREEN_BANDS.find((band) => band.id === id)!;
}

const scale = (points: [number, number, number, number, number], low: string, high: string): DetoxOption[] =>
  points.map((value, index) => ({
    id: String(index + 1),
    label: index === 0 ? `1 · ${low}` : index === 4 ? `5 · ${high}` : String(index + 1),
    points: value,
  }));

export const HOBBY_OPTIONS: DetoxOption[] = [
  { id: "sport", label: "Sport or exercise", points: 3 },
  { id: "walk", label: "Walks outdoors", points: 3 },
  { id: "books", label: "Reading books", points: 3 },
  { id: "music", label: "Playing music", points: 3 },
  { id: "art", label: "Art or crafts", points: 3 },
  { id: "cooking", label: "Cooking", points: 3 },
  { id: "games", label: "Games with people", points: 3 },
  { id: "friends", label: "Time with friends", points: 3 },
  { id: "volunteer", label: "Volunteering", points: 3 },
  { id: "calm", label: "Meditation or prayer", points: 3 },
  { id: "writing", label: "Writing by hand", points: 3 },
  { id: "none", label: "None of these right now", points: -6 },
];

export const DETOX_QUESTIONS: readonly DetoxQuestion[] = [
  {
    id: "screen",
    section: "screen",
    kind: "single",
    prompt: "On a typical day, how long is your phone screen on outside work or study?",
    hint: "A rough guess is fine. Your phone's screen-time page has the real number.",
    options: SCREEN_BANDS.map((band) => ({ id: band.id, label: band.label, points: band.points })),
  },
  {
    id: "wake-check",
    section: "screen",
    kind: "single",
    prompt: "How soon after waking up do you look at your phone?",
    options: [
      { id: "5min", label: "Within five minutes", points: -8 },
      { id: "30min", label: "Within half an hour", points: -3 },
      { id: "hour", label: "After an hour or more", points: 6 },
      { id: "routine", label: "Only after my morning routine", points: 8 },
    ],
  },
  {
    id: "short-video",
    section: "short-form",
    kind: "single",
    prompt: "How much short video (reels, shorts, quick clips) do you watch on a typical day?",
    options: [
      { id: "none", label: "None", points: 10 },
      { id: "lt15", label: "Less than 15 minutes", points: 5 },
      { id: "15-60", label: "15 minutes to an hour", points: -2 },
      { id: "1-2h", label: "One to two hours", points: -8 },
      { id: "2h", label: "More than two hours", points: -12 },
    ],
  },
  {
    id: "scroll-stop",
    section: "short-form",
    kind: "single",
    prompt: "When you start scrolling, how often do you stop when you meant to?",
    options: [
      { id: "always", label: "Almost always", points: 8 },
      { id: "often", label: "Often", points: 4 },
      { id: "sometimes", label: "Sometimes", points: 0 },
      { id: "rarely", label: "Rarely", points: -6 },
      { id: "never", label: "Almost never", points: -10 },
    ],
  },
  {
    id: "social-opens",
    section: "short-form",
    kind: "single",
    prompt: "About how many times a day do you open social apps?",
    options: [
      { id: "0-5", label: "Five times or fewer", points: 8 },
      { id: "6-15", label: "6 to 15 times", points: 2 },
      { id: "16-30", label: "16 to 30 times", points: -4 },
      { id: "30plus", label: "More than 30 times", points: -9 },
      { id: "unsure", label: "Not sure, but a lot", points: -6 },
    ],
  },
  {
    id: "autopilot",
    section: "reaching",
    kind: "single",
    prompt: "How often do you find your phone in your hand without having decided to pick it up?",
    options: [
      { id: "rarely", label: "Rarely", points: 8 },
      { id: "daily", label: "A few times a day", points: 3 },
      { id: "hourly", label: "About every hour", points: -4 },
      { id: "minutes", label: "Every few minutes", points: -10 },
    ],
  },
  {
    id: "notifications",
    section: "reaching",
    kind: "single",
    prompt: "Which notifications can interrupt you right now?",
    options: [
      { id: "few", label: "Almost none", points: 8 },
      { id: "people", label: "Calls and messages from people only", points: 4 },
      { id: "most", label: "Most apps", points: -4 },
      { id: "all", label: "Everything. I have never changed them", points: -7 },
    ],
  },
  {
    id: "focus-25",
    section: "focus",
    kind: "single",
    prompt: "Can you stay on one task for 25 minutes without checking anything else?",
    options: [
      { id: "easily", label: "Easily", points: 12 },
      { id: "usually", label: "Usually", points: 6 },
      { id: "sometimes", label: "Sometimes", points: 0 },
      { id: "rarely", label: "Rarely", points: -7 },
      { id: "never", label: "Almost never", points: -12 },
    ],
  },
  {
    id: "long-read",
    section: "focus",
    kind: "single",
    prompt: "When did you last read something long, like a chapter or an article, in one sitting?",
    options: [
      { id: "week", label: "This week", points: 8 },
      { id: "month", label: "This month", points: 3 },
      { id: "months", label: "A few months ago", points: -3 },
      { id: "cannot", label: "I cannot remember", points: -7 },
    ],
  },
  {
    id: "waiting",
    section: "focus",
    kind: "single",
    prompt: "You are waiting two minutes for something with nothing to do. What usually happens?",
    options: [
      { id: "wait", label: "I just wait, or let my mind wander", points: 8 },
      { id: "depends", label: "It depends on the day", points: 2 },
      { id: "phone", label: "My phone is out straight away", points: -7 },
    ],
  },
  {
    id: "study-phone",
    section: "focus",
    kind: "single",
    prompt: "Where is your phone while you study?",
    options: [
      { id: "away", label: "In another room", points: 10 },
      { id: "reach", label: "Face down and out of reach", points: 5 },
      { id: "desk", label: "On the desk next to me", points: -3 },
      { id: "hand", label: "In my hand, or I study on it and drift", points: -8 },
    ],
  },
  {
    id: "bed-phone",
    section: "sleep",
    kind: "single",
    prompt: "Do you use your phone in bed before you sleep?",
    options: [
      { id: "never", label: "Never", points: 8 },
      { id: "sometimes", label: "Sometimes", points: 2 },
      { id: "most", label: "Most nights", points: -5 },
      { id: "always", label: "Every night until I fall asleep", points: -10 },
    ],
  },
  {
    id: "sleep",
    section: "sleep",
    kind: "single",
    prompt: "How many hours do you usually sleep?",
    options: [
      { id: "lt5", label: "Under 5", points: -10 },
      { id: "5-6", label: "5 to 6", points: -4 },
      { id: "6-7", label: "6 to 7", points: 3 },
      { id: "7-9", label: "7 to 9", points: 8 },
      { id: "9plus", label: "More than 9", points: 2 },
    ],
  },
  {
    id: "routine",
    section: "sleep",
    kind: "single",
    prompt: "How regular are your days: waking, meals, study time?",
    options: [
      { id: "very", label: "Very regular", points: 8 },
      { id: "mostly", label: "Mostly regular", points: 4 },
      { id: "varies", label: "It varies a lot", points: -3 },
      { id: "none", label: "No real routine right now", points: -6 },
    ],
  },
  {
    id: "hobbies",
    section: "offline",
    kind: "chips",
    prompt: "Which of these do you do away from screens at least once a week?",
    hint: "Pick as many as are true.",
    options: HOBBY_OPTIONS,
    chipCap: 12,
    noneId: "none",
  },
  {
    id: "weekend",
    section: "offline",
    kind: "single",
    prompt: "How much of your free time last weekend was away from screens?",
    options: [
      { id: "most", label: "Most of it", points: 10 },
      { id: "half", label: "About half", points: 4 },
      { id: "little", label: "A little", points: -3 },
      { id: "none", label: "Almost none", points: -8 },
    ],
  },
  {
    id: "focus-now",
    section: "mood",
    kind: "scale",
    prompt: "How well have you been able to focus lately?",
    options: scale([-8, -4, 0, 4, 8], "Hardly at all", "Very well"),
  },
  {
    id: "mood",
    section: "mood",
    kind: "scale",
    prompt: "How has your mood been over the last two weeks?",
    options: scale([-6, -3, 0, 3, 6], "Very low", "Very good"),
  },
  {
    id: "overwhelm",
    section: "mood",
    kind: "single",
    prompt: "Over the last two weeks, how often have you felt overwhelmed or unable to cope?",
    options: [
      { id: "never", label: "Not at all", points: 4 },
      { id: "sometimes", label: "Some days", points: 0 },
      { id: "often", label: "More than half the days", points: -4 },
      { id: "always", label: "Nearly every day", points: -6 },
    ],
  },
  {
    id: "intent",
    section: "mood",
    kind: "single",
    prompt: "What would you most like to change first?",
    hint: "This shapes your next steps. It does not change your score.",
    options: [
      { id: "scroll", label: "Scroll less", points: 0 },
      { id: "focus", label: "Focus for longer", points: 0 },
      { id: "sleep", label: "Sleep better", points: 0 },
      { id: "finish", label: "Finish what I start", points: 0 },
      { id: "calm", label: "Feel calmer", points: 0 },
    ],
  },
];

export const DETOX_QUESTION_COUNT = DETOX_QUESTIONS.length;

export type DetoxAnswers = Record<string, string | string[]>;
