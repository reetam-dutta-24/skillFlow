/** The paths a learner can open without paying. Every other niche is Premium and has no stages. */
export const FREE_PATH_SLUGS = [
  "full-stack-web-dev",
  "travel-vlogging",
  "content-creation",
  "music-production",
  "art-painting",
  "photography",
  "self-grooming",
  "animation",
  "iot-robot-automation",
  "screenwriting",
  "graphic-design",
  "ai-tools",
  "seo",
  "cybersecurity",
  "digital-marketing",
  "emergency-preparedness",
  "personal-finance",
  "badminton",
  "public-speaking",
  "sound-design",
  "nutrition",
  "psychology",
  "podcasting",
  "guitar",
  "chess",
  "interior-design",
  "relationships",
  "socializing",
  "freelancing",
  "travel-planning",
] as const;

const FREE = new Set<string>(FREE_PATH_SLUGS);

export function isFreePath(slug: string) {
  return FREE.has(slug);
}
