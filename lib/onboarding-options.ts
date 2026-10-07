/**
 * Choices for the onboarding profile. The wizard renders these, and the server action validates
 * against the same lists, so a stored id always means something on screen.
 */

export const AGE_RANGES = [
  { id: "under-13", label: "Under 13" },
  { id: "13-17", label: "13–17" },
  { id: "18-24", label: "18–24" },
  { id: "25-34", label: "25–34" },
  { id: "35-44", label: "35–44" },
  { id: "45+", label: "45 or older" },
] as const;

export const STAGES = [
  { id: "school", label: "At school", icon: "backpack" },
  { id: "college", label: "In college or university", icon: "graduation-cap" },
  { id: "working", label: "Working", icon: "briefcase" },
  { id: "switching", label: "Changing careers", icon: "shuffle" },
  { id: "freelance", label: "Freelancing or running a business", icon: "store" },
  { id: "break", label: "Taking a break", icon: "coffee" },
] as const;

export const EXPERIENCE = [
  { id: "new", label: "New to it", hint: "Starting from zero" },
  { id: "some", label: "Some experience", hint: "I know the basics" },
  { id: "experienced", label: "Experienced", hint: "Filling gaps" },
] as const;

/** `goal` on the profile keeps the first of these for the older Home card. */
export const GOALS = [
  { id: "career", label: "Get a job or change careers", icon: "compass" },
  { id: "project", label: "Build something real", icon: "box" },
  { id: "craft", label: "Get sharper at what I do", icon: "sparkles" },
  { id: "income", label: "Earn on the side", icon: "wallet" },
  { id: "studies", label: "Help my studies", icon: "book-open" },
  { id: "curiosity", label: "Just curious", icon: "lightbulb" },
] as const;

export const WEEKLY_HOURS = [
  { id: 2, label: "1–2 hours a week" },
  { id: 4, label: "3–5 hours" },
  { id: 8, label: "6–10 hours" },
  { id: 12, label: "More than 10" },
] as const;

export const FORMATS = [
  { id: "video", label: "Watching videos", icon: "circle-play" },
  { id: "reading", label: "Reading articles and docs", icon: "file-text" },
  { id: "hands-on", label: "Doing it hands-on", icon: "hammer" },
  { id: "courses", label: "Structured courses", icon: "graduation-cap" },
  { id: "audio", label: "Listening on the go", icon: "headphones" },
] as const;

export const LANGUAGES = [
  { id: "en", label: "English" },
  { id: "hi", label: "Hindi" },
  { id: "bn", label: "Bengali" },
  { id: "ta", label: "Tamil" },
  { id: "te", label: "Telugu" },
  { id: "mr", label: "Marathi" },
  { id: "es", label: "Spanish" },
  { id: "fr", label: "French" },
  { id: "de", label: "German" },
  { id: "pt", label: "Portuguese" },
  { id: "ar", label: "Arabic" },
  { id: "ja", label: "Japanese" },
] as const;

export const MAX_PATHS = 5;
export const MAX_HEADLINE = 80;

const ids = <T extends { id: string | number }>(list: readonly T[]) => new Set(list.map((item) => item.id));
const AGE_IDS = ids(AGE_RANGES);
const STAGE_IDS = ids(STAGES);
const EXPERIENCE_IDS = ids(EXPERIENCE);
const GOAL_IDS = ids(GOALS);
const HOUR_IDS = ids(WEEKLY_HOURS);
const FORMAT_IDS = ids(FORMATS);
const LANGUAGE_IDS = ids(LANGUAGES);

export type OnboardingAnswers = {
  ageRange: string;
  guardianConsent: boolean;
  stage: string;
  headline: string;
  paths: string[];
  goals: string[];
  experience: string;
  pace: string;
  weeklyHours: number;
  formats: string[];
  languages: string[];
  accent: string;
};

/** Returns the first problem in plain words, or null when the answers can be saved. */
export function onboardingProblem(input: OnboardingAnswers, isPath: (slug: string) => boolean): string | null {
  if (!AGE_IDS.has(input.ageRange)) return "Choose your age range.";
  if (input.ageRange === "under-13") return "SkillFlow is for people 13 and older.";
  if (input.ageRange === "13-17" && !input.guardianConsent) return "A parent or guardian needs to agree before you continue.";
  if (!STAGE_IDS.has(input.stage)) return "Choose what you are doing right now.";
  if (input.headline.length > MAX_HEADLINE) return `Keep the headline under ${MAX_HEADLINE} characters.`;
  if (input.paths.length < 1) return "Pick at least one path.";
  if (input.paths.length > MAX_PATHS) return `Pick up to ${MAX_PATHS} paths.`;
  if (!input.paths.every(isPath)) return "One of those paths is not available.";
  if (input.goals.length < 1 || !input.goals.every((goal) => GOAL_IDS.has(goal))) return "Choose at least one goal.";
  if (!EXPERIENCE_IDS.has(input.experience)) return "Choose your experience.";
  if (!HOUR_IDS.has(input.weeklyHours)) return "Choose how much time you have.";
  if (input.formats.length < 1 || !input.formats.every((format) => FORMAT_IDS.has(format))) return "Choose at least one way you like to learn.";
  if (input.languages.length < 1 || !input.languages.every((language) => LANGUAGE_IDS.has(language))) return "Choose at least one language.";
  return null;
}

export function labelOf<T extends { id: string | number; label: string }>(list: readonly T[], id: string | number | null | undefined) {
  return list.find((item) => item.id === id)?.label ?? "";
}
