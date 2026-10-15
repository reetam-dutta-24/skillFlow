/**
 * The Detox playbook: fixed, concrete steps written here in code. The model may only choose step ids from this list;
 * it never writes new health advice. Each step is a small habit change, tied to something in the app where it fits.
 */
import type { DetoxAnswers, DetoxSection } from "./questions";

export type PlaybookArea = Exclude<DetoxSection, "mood"> | "learning";

export type PlaybookStep = {
  id: string;
  area: PlaybookArea;
  title: string;
  detail: string;
  action?: { label: string; href: string };
};

export const PLAYBOOK: readonly PlaybookStep[] = [
  {
    id: "phone-other-room",
    area: "focus",
    title: "Study with your phone in another room",
    detail: "Distance beats willpower. Put it somewhere you would have to stand up to reach, for one whole session.",
    action: { label: "Start a 25-minute focus session", href: "/detox#focus" },
  },
  {
    id: "timebox-25",
    area: "focus",
    title: "Work in one 25-minute block",
    detail: "One task, one timer, nothing else open. Stop when it rings, even mid-thought, and take a short break.",
    action: { label: "Start a focus session", href: "/detox#focus" },
  },
  {
    id: "swap-a-scroll",
    area: "short-form",
    title: "Swap one reel for one explained idea",
    detail: "When you notice the urge to scroll, answer one recall or explain one idea instead. It takes about three minutes.",
    action: { label: "Swap a scroll", href: "/detox?swap=1" },
  },
  {
    id: "no-video-morning",
    area: "screen",
    title: "Keep the first hour of the day video-free",
    detail: "No short video before your first real task. Let the morning start with something you chose.",
  },
  {
    id: "notifications-off",
    area: "reaching",
    title: "Turn off every notification that is not a person",
    detail: "Keep calls and messages from people. Switch off app badges, banners, and sounds for everything else.",
  },
  {
    id: "grayscale",
    area: "reaching",
    title: "Set your phone to grayscale for a day",
    detail: "Colour makes feeds more tempting. Most phones have a grayscale or bedtime mode in accessibility or wellbeing settings.",
  },
  {
    id: "app-off-home",
    area: "short-form",
    title: "Move short-video apps off your home screen",
    detail: "Put them in a folder on the last page. One extra swipe is often enough to break the automatic tap.",
  },
  {
    id: "daily-limit",
    area: "screen",
    title: "Set a daily limit on your most-used app",
    detail: "Use your phone's own screen-time limits. Start at a little under what you use now, not at zero.",
  },
  {
    id: "phone-out-of-bed",
    area: "sleep",
    title: "Charge your phone outside the bedroom",
    detail: "A cheap alarm clock removes the last scroll at night and the first one in the morning.",
  },
  {
    id: "wind-down",
    area: "sleep",
    title: "Screens off 30 minutes before sleep",
    detail: "Read paper, stretch, or write tomorrow's one task. Your Notes are there to read in the morning instead.",
  },
  {
    id: "fixed-wake",
    area: "sleep",
    title: "Wake at the same time for seven days",
    detail: "A steady wake time makes a steady day. Put your first learning session right after it.",
  },
  {
    id: "offline-hour",
    area: "offline",
    title: "Plan one offline hour this week",
    detail: "A walk, a game with friends, cooking, music: something you enjoy that has no screen. Put it in your calendar.",
  },
  {
    id: "boredom-practice",
    area: "focus",
    title: "Let two minutes of waiting stay empty",
    detail: "In a queue or a lift, leave the phone in your pocket. Short boredom is where ideas and calm come from.",
  },
  {
    id: "read-long",
    area: "focus",
    title: "Read one long resource in one sitting",
    detail: "Open the next article or doc on your current stage and read it to the end before you check anything.",
    action: { label: "Open my current stage", href: "/dashboard" },
  },
  {
    id: "explain-daily",
    area: "learning",
    title: "Explain one idea a day",
    detail: "One explain-back a day keeps your streak and your Detox Score moving. Quality counts more than hours.",
    action: { label: "Open my current stage", href: "/dashboard" },
  },
  {
    id: "recall-first",
    area: "learning",
    title: "Answer your recall before any feed",
    detail: "When a recall card is waiting, do it first. Remembering something you learned is a better first hit than a reel.",
    action: { label: "Open Notes", href: "/notes" },
  },
  {
    id: "plan-week",
    area: "learning",
    title: "Set a gentle weekly plan",
    detail: "Choose a light pace on your path. A small plan you keep beats a big one you skip.",
    action: { label: "Open Paths", href: "/roadmap" },
  },
  {
    id: "single-tab",
    area: "reaching",
    title: "Keep one tab open while you learn",
    detail: "Close everything that is not the lesson. Every open tab is a small invitation to drift.",
  },
  {
    id: "share-once",
    area: "offline",
    title: "Teach someone what you learned",
    detail: "Tell a friend, or post one contribution on Open Source. Teaching turns a passive day into an active one.",
    action: { label: "Open Source", href: "/open-source" },
  },
  {
    id: "weekly-checkin",
    area: "screen",
    title: "Check your real screen time once a week",
    detail: "Look at the number your phone reports, then do your one-minute Detox check-in. Honest numbers make honest progress.",
    action: { label: "Do the check-in", href: "/detox#checkin" },
  },
];

export const PLAYBOOK_IDS = new Set(PLAYBOOK.map((step) => step.id));

export function playbookStep(id: string) {
  return PLAYBOOK.find((step) => step.id === id) ?? null;
}

const INTENT_AREA: Record<string, PlaybookArea> = {
  scroll: "short-form",
  focus: "focus",
  sleep: "sleep",
  finish: "learning",
  calm: "offline",
};

/**
 * The rules pick: three steps from three different areas. The learner's stated intent first, then the weakest sections
 * of their answers, then learning habits. Deterministic, so the same answers always give the same steps.
 */
export function rulesPick(answers: DetoxAnswers, sections: Partial<Record<DetoxSection, number>>, count = 3): string[] {
  const intent = typeof answers.intent === "string" ? INTENT_AREA[answers.intent] : undefined;
  const weakest = (Object.entries(sections) as [DetoxSection, number][])
    .filter(([section]) => section !== "mood")
    .sort((a, b) => a[1] - b[1] || a[0].localeCompare(b[0]))
    .map(([section]) => section as PlaybookArea);
  const order: PlaybookArea[] = [...new Set<PlaybookArea>([...(intent ? [intent] : []), ...weakest, "learning", "focus", "screen", "offline"])];
  const picks: string[] = [];
  for (const area of order) {
    if (picks.length >= count) break;
    const step = PLAYBOOK.find((item) => item.area === area && !picks.includes(item.id));
    if (step) picks.push(step.id);
  }
  for (const step of PLAYBOOK) {
    if (picks.length >= count) break;
    if (!picks.includes(step.id)) picks.push(step.id);
  }
  return picks;
}

/** Keeps only real playbook ids, once each, and tops up from the rules pick. */
export function settlePicks(ids: unknown, fallback: string[], count = 3): string[] {
  const chosen = Array.isArray(ids) ? ids.filter((id): id is string => typeof id === "string" && PLAYBOOK_IDS.has(id)) : [];
  return [...new Set([...chosen, ...fallback])].slice(0, count);
}
