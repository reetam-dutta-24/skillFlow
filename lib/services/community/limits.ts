export const COMMUNITY_LIMITS = {
  contributionsPerDay: 5,
  gapsPerDay: 3,
  usefulTogglesPerHour: 60,
} as const;

export function limitReached(count: number, max: number): boolean {
  return count >= max;
}

export function limitMessage(kind: "contributions" | "gaps" | "useful"): string {
  if (kind === "contributions") return "You can share 5 contributions in 24 hours. Try again tomorrow.";
  if (kind === "gaps") return "You can report 3 gaps in 24 hours. Try again tomorrow.";
  return "You can mark 60 contributions in an hour. Try again later.";
}
