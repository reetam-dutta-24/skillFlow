const BY_SLUG: Record<string, string[]> = {
  "full-stack-web-dev": ["hackathon", "developer meetup", "tech conference"],
  "travel-vlogging": ["travel meetup", "vlogging workshop", "creator conference"],
  "content-creation": ["content creator meetup", "social media workshop", "creator conference"],
  "music-production": ["music production workshop", "local gig", "studio session"],
  "art-painting": ["art workshop", "painting class", "gallery opening"],
  photography: ["photography workshop", "photo walk", "camera club"],
  "self-grooming": ["grooming workshop", "barber class", "skincare class"],
  animation: ["animation workshop", "vfx meetup", "film festival"],
  "iot-robot-automation": ["robotics meetup", "maker faire", "hardware hackathon"],
  screenwriting: ["screenwriting workshop", "film festival", "writers meetup"],
  "graphic-design": ["design meetup", "portfolio review", "design conference"],
  "ai-tools": ["AI meetup", "machine learning workshop", "tech conference"],
  seo: ["SEO workshop", "search marketing meetup", "digital marketing conference"],
  cybersecurity: ["security conference", "cybersecurity meetup", "capture the flag"],
  "digital-marketing": ["marketing meetup", "social media workshop", "marketing conference"],
  "emergency-preparedness": ["first aid class", "disaster preparedness", "CPR training"],
  "personal-finance": ["personal finance workshop", "investing seminar", "financial literacy"],
  badminton: ["badminton tournament", "badminton club", "racket sports"],
  "public-speaking": ["public speaking workshop", "toastmasters", "storytelling night"],
  "sound-design": ["sound design workshop", "audio meetup", "film sound"],
  nutrition: ["nutrition workshop", "cooking class", "healthy eating seminar"],
  psychology: ["psychology lecture", "mental health workshop", "counseling seminar"],
  podcasting: ["podcast workshop", "audio meetup", "creator conference"],
  guitar: ["guitar workshop", "open mic", "acoustic night"],
  chess: ["chess tournament", "chess club", "chess workshop"],
  "interior-design": ["interior design workshop", "home design show", "design meetup"],
  relationships: ["relationship workshop", "communication class", "counseling seminar"],
  socializing: ["social skills workshop", "conversation club", "community meetup"],
  freelancing: ["freelancer meetup", "small business workshop", "client workshop"],
  "travel-planning": ["travel meetup", "trip planning workshop", "travel fair"],
};

/** Search words for a niche. Every free path has a list. Any other niche uses its name. */
export function keywordsFor(slug: string, name: string): string[] {
  const listed = BY_SLUG[slug];
  if (listed && listed.length > 0) return listed;
  const fallback = name.trim();
  return fallback ? [fallback] : ["meetup"];
}
