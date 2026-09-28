export const SKILL_CHOICES = [
  {
    slug: "full-stack-web-dev",
    title: "Full-Stack Web Development",
    image: "/skills/web.jpg",
  },
  {
    slug: "art-painting",
    title: "Art & Painting",
    image: "/skills/art.jpg",
  },
  {
    slug: "content-creation",
    title: "Content Creation",
    image: "/skills/content.jpg",
  },
  {
    slug: "photography",
    title: "Photography",
    image: "/skills/photo.jpg",
  },
  {
    slug: "music-production",
    title: "Music Production",
    image: "/skills/music.jpg",
  },
] as const;

export const PACE_CHOICES = [
  { id: "steady", label: "Steady", hint: "A little each day", icon: "sun" },
  { id: "focused", label: "Focused", hint: "Longer sessions", icon: "target" },
  { id: "deep", label: "Deep", hint: "Until it sticks", icon: "layers" },
] as const;

export const GOAL_CHOICES = [
  { id: "project", label: "Build something", icon: "box" },
  { id: "craft", label: "Get sharper", icon: "sparkles" },
  { id: "career", label: "Change direction", icon: "compass" },
  { id: "curiosity", label: "Just curious", icon: "lightbulb" },
] as const;

export type SkillSlug = (typeof SKILL_CHOICES)[number]["slug"];
export type PaceId = (typeof PACE_CHOICES)[number]["id"];
export type GoalId = (typeof GOAL_CHOICES)[number]["id"];

const GOAL_LINES: Record<GoalId, string> = {
  project: "Start with the first milestone.",
  craft: "Practice the fundamentals.",
  career: "Follow the path in order.",
  curiosity: "Begin with the first idea.",
};

export function isSkillSlug(value: string | null | undefined): value is SkillSlug {
  return SKILL_CHOICES.some((skill) => skill.slug === value);
}

export function isPaceId(value: string | null | undefined): value is PaceId {
  return PACE_CHOICES.some((pace) => pace.id === value);
}

export function isGoalId(value: string | null | undefined): value is GoalId {
  return GOAL_CHOICES.some((goal) => goal.id === value);
}

export function skillBySlug(slug: string) {
  return SKILL_CHOICES.find((skill) => skill.slug === slug) ?? null;
}

export function paceById(id: string) {
  return PACE_CHOICES.find((pace) => pace.id === id) ?? PACE_CHOICES[0];
}

export function goalById(id: string) {
  return GOAL_CHOICES.find((goal) => goal.id === id) ?? GOAL_CHOICES[0];
}

export function goalLine(id: string) {
  return isGoalId(id) ? GOAL_LINES[id] : GOAL_LINES.curiosity;
}

/** How many stages are open before any are finished. Focused starts one stage further along. */
export function openCount(pace: string) {
  return pace === "focused" ? 2 : 1;
}

/** The furthest open stage: the pace window, or further if progress has moved on. */
export function openThrough(pace: string, currentStageOrder = 1) {
  return Math.max(openCount(pace), currentStageOrder);
}

/** The feed stays on the chosen skill. Pace only decides how much of that path to open first. */
export function startingStages<T>(stages: T[], pace: string): T[] {
  return stages.slice(0, openCount(pace));
}

export function stageTag(pace: string, index: number) {
  if (pace === "deep") return "Stay with this";
  if (pace === "focused" && index === 1) return "Then";
  return "Start here";
}
