/**
 * The Home product tour, one plain record per slide. The dialog (components/tour/TourDialog.tsx) renders these in
 * order; the visual and the "Try it" demo for each slide are picked by id. Keep body copy under 40 words.
 */

export type TourVisualId =
  | "welcome"
  | "niches"
  | "path"
  | "lesson"
  | "explain"
  | "notes"
  | "practice"
  | "progress"
  | "activity"
  | "plan"
  | "detox"
  | "theme"
  | "beyond"
  | "inbox"
  | "premium"
  | "start";

export type TourDemoId =
  | "niches"
  | "path"
  | "lesson"
  | "explain"
  | "notes"
  | "practice"
  | "progress"
  | "activity"
  | "plan"
  | "detox"
  | "theme"
  | "beyond"
  | "inbox";

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
    body: "Anyone can play a video to the end. SkillFlow asks you to explain what you learned, in your own words. The next few minutes show every part of the app, with something small to try on each.",
    visual: "welcome",
    demo: null,
  },
  {
    id: "niches",
    label: "Niches",
    kicker: "Niches and following",
    emoji: "📚",
    heading: "Pick what you want to learn",
    body: "A niche is a subject, from web development to chess. Thirty paths are free, every stage included. Follow the ones you care about and they show up on Home, each as its own lane.",
    visual: "niches",
    demo: { id: "niches", prompt: "Follow a niche or two. You can stop following any time." },
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
    id: "lessons",
    label: "Lessons and Clips",
    kicker: "Lessons and Clips",
    emoji: "🎬",
    heading: "A stage is a calm, step-by-step lesson",
    body: "Each stage walks you through its clip and resources one at a time: videos play right here, docs and courses open beside you. Clips gives you a feed of short lessons from every niche.",
    visual: "lesson",
    demo: { id: "lesson", prompt: "Step through a sample stage, the way a real lesson works." },
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
    id: "practice",
    label: "Practice",
    kicker: "Practice on anything",
    emoji: "🧪",
    heading: "Bring your own material",
    body: "Found a great article or have your own notes? Practise explaining it from a link, a file, or pasted text, and keep the note. You can also suggest a resource for a stage.",
    visual: "practice",
    demo: { id: "practice", prompt: "Pick where your practice text comes from." },
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
    id: "activity",
    label: "Activity and records",
    kicker: "Activity and records",
    emoji: "🗓️",
    heading: "Every real step leaves a mark",
    body: "Your activity heatmap fills in as you explain, recall, and contribute. Transcripts list every stage you passed with its date, and a certificate appears when a whole path is done.",
    visual: "activity",
    demo: { id: "activity", prompt: "Tap a few days to fill in a sample week." },
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
    id: "detox",
    label: "Dopamine Detox",
    kicker: "Dopamine Detox",
    emoji: "🌿",
    heading: "Your dopamine detox, with proof",
    body: "A three-minute self-check gives you a Detox Score. Only real learning moves it, with a daily limit, so hours alone never inflate it. Swap a scroll for one idea, or start a focus session.",
    visual: "detox",
    demo: { id: "detox", prompt: "Add some learning and watch the score, and its daily limit, work." },
  },
  {
    id: "themes",
    label: "Themes and accents",
    kicker: "Look and feel",
    emoji: "🎨",
    heading: "Make it look like yours",
    body: "Light or dark, ten accent presets, Spectrum that drifts slowly around the colour wheel, or your own gradient. Every screen follows your choice, and it is saved to your account.",
    visual: "theme",
    demo: { id: "theme", prompt: "Try a theme and an accent on this preview. Nothing changes until you choose in Settings." },
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
    id: "inbox",
    label: "Notifications and profile",
    kicker: "Notifications and your profile",
    emoji: "🔔",
    heading: "Stay in the loop, on your terms",
    body: "The bell tells you when a review is decided, someone asks about your post, or your streak or weekly check-in is waiting. Your public profile shows only what you choose to share.",
    visual: "inbox",
    demo: { id: "inbox", prompt: "Open a notification, then mark them all as read." },
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
