const BY_SLUG: Record<string, string[]> = {
  "full-stack-web-dev": ["hackathon", "developer meetup", "tech conference"],
  "travel-vlogging": ["travel meetup", "vlogging workshop", "creator conference"],
  "content-creation": ["content creator meetup", "social media workshop", "creator conference"],
};

/** Search words for a niche. The three live paths have a list. Everyone else uses the skill name. */
export function keywordsFor(slug: string, name: string): string[] {
  const listed = BY_SLUG[slug];
  if (listed && listed.length > 0) return listed;
  const fallback = name.trim();
  return fallback ? [fallback] : ["meetup"];
}
