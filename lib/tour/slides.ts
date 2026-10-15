/**
 * The Home product tour, one plain record per slide. The dialog (components/tour/TourDialog.tsx) renders these in
 * order; the visual and the "Try it" demo for each slide are picked by id. Keep body copy under 40 words.
 */

export type TourVisualId = "welcome" | "path" | "explain" | "notes" | "progress" | "plan" | "beyond" | "premium" | "start";

export type TourDemoId = "path" | "explain" | "notes" | "progress" | "plan" | "beyond";

export type TourSlide = {
  id: string;
  /** Short name for the step dot. */
  label: string;
  kicker: string;
  /** At most one, shown before the heading and hidden from screen readers. */
  emoji: string | null;
  heading: string;
  body: string;
  visual: TourVisualId;
  /** Feature slides end with a small sandboxed exercise. `prompt` says what to do in one line. */
  demo: { id: TourDemoId; prompt: string } | null;
};

export const TOUR_BODY_MAX_WORDS = 40;

export const TOUR_SLIDES: readonly TourSlide[] = [
  {
    id: "welcome",
    label: "Welcome",
    kicker: "Welcome to SkillFlow",
    emoji: "👋",
    heading: "Understanding counts here, not watch time",
    body: "Anyone can play a video to the end. SkillFlow asks you to explain what you learned, in your own words. The next two minutes show how that works, with a few small things to try.",
    visual: "welcome",
    demo: null,
  },
  {
    id: "paths",
    label: "Paths and stages",
    kicker: "Paths and stages",
    emoji: "🧭",
    heading: "Follow a path, one stage at a time",
    body: "A path is an ordered list of stages. Each stage gathers real videos, docs and courses from around the web. A stage opens once you have shown you understand the one before it.",
    visual: "path",
    demo: { id: "path", prompt: "Tap each stage. The first one opens; the others tell you why they wait." },
  },
  {
    id: "explain-back",
    label: "Explain-back",
    kicker: "Explain-back · the core",
    emoji: "✍️",
    heading: "Explain each idea in your own words",
    body: "After a stage, you explain its ideas one at a time. A written review comes back every time. When every idea holds, the stage is recorded and the next one opens.",
    visual: "explain",
    demo: {
      id: "explain",
      prompt: "Explain the sample idea. This practice uses a simple scripted check, not the real AI review.",
    },
  },
  {
    id: "notes",
    label: "Notes and recall",
    kicker: "Notes and recall",
    emoji: "📝",
    heading: "What holds becomes your note",
    body: "Every idea you explain well is saved to Notes, in your words, with its review. It comes back twice, 18 hours apart, as a short recall question, so it stays with you.",
    visual: "notes",
    demo: { id: "notes", prompt: "Tap the card to turn your note into its recall question, and back." },
  },
  {
    id: "progress",
    label: "Progress",
    kicker: "Progress",
    emoji: "📈",
    heading: "Watch your understanding add up",
    body: "Mastery is the share of stages you have passed. A streak counts the days you explain or save a note. Home shows topics to strengthen; Progress keeps analytics, transcripts and certificates.",
    visual: "progress",
    demo: { id: "progress", prompt: "Tap “Pass a stage” and watch the numbers move." },
  },
  {
    id: "make-it-yours",
    label: "Make it yours",
    kicker: "Make it yours",
    emoji: "🎛️",
    heading: "Learn at a pace that fits your week",
    body: "Pick a pace and SkillFlow turns a path into a weekly plan you can change any time. When you want a hint about where to start, the career-fit test suggests paths that suit you.",
    visual: "plan",
    demo: { id: "plan", prompt: "Pick a pace and watch the week rearrange itself." },
  },
  {
    id: "beyond",
    label: "Beyond the path",
    kicker: "Beyond the path",
    emoji: "🌍",
    heading: "Learn alongside other people",
    body: "Share what you know with your niche, find learners and events near you, and publish videos you made. All of it sits one tap away from your path.",
    visual: "beyond",
    demo: { id: "beyond", prompt: "Tap each tile to see what it is for." },
  },
  {
    id: "premium",
    label: "Free and Premium",
    kicker: "Free and Premium",
    emoji: null,
    heading: "Thirty paths are free, every stage included",
    body: "Explain-back, notes, progress and certificates are free on all thirty paths. Premium adds the other niches, a place on the learner map and live event search. That is the whole difference.",
    visual: "premium",
    demo: null,
  },
  {
    id: "start",
    label: "Start",
    kicker: "You are ready",
    emoji: "🌱",
    heading: "Start with your first stage",
    body: "Take the resources at your own pace, then explain the stage back. You can replay this tour from Home whenever you like.",
    visual: "start",
    demo: null,
  },
];

/** The last slide when the learner follows nothing yet: it points at the niches instead of a stage. */
export const START_WITHOUT_PATH = {
  heading: "Pick your first path",
  body: "Choose a path you care about and follow it. Its first stage opens right away. You can replay this tour from Home whenever you like.",
} as const;

export function wordCount(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/** The last slide when the first followed path has no open stage left (all passed, or none yet). */
export const START_ON_PATH = {
  heading: "Back to your path",
  body: "Open your path to see every stage and where you stand. You can replay this tour from Home whenever you like.",
} as const;
