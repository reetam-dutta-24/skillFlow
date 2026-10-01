export type AppRole = "USER" | "ADMIN";
export type NicheRole = "REVIEWER" | "MAINTAINER";

export type CommunityActor = {
  id: string;
  appRole: AppRole;
  roles: { skillId: string; role: NicheRole }[];
};

export function isAdmin(actor: CommunityActor): boolean {
  return actor.appRole === "ADMIN";
}

function holds(actor: CommunityActor, skillId: string, role: NicheRole): boolean {
  return actor.roles.some((row) => row.skillId === skillId && row.role === role);
}

/** The strongest role in this niche. A person can hold both rows, so maintainer wins. */
export function nicheRole(actor: CommunityActor, skillId: string): NicheRole | null {
  if (holds(actor, skillId, "MAINTAINER")) return "MAINTAINER";
  if (holds(actor, skillId, "REVIEWER")) return "REVIEWER";
  return null;
}

/** Review contributions in this niche. Admins, maintainers, and reviewers. */
export function canReview(actor: CommunityActor, skillId: string): boolean {
  return isAdmin(actor) || nicheRole(actor, skillId) !== null;
}

/** A person cannot review their own contribution. A former member's contribution can still be reviewed. */
export function canReviewContribution(actor: CommunityActor, skillId: string, authorId: string | null): boolean {
  if (authorId === actor.id) return false;
  return canReview(actor, skillId);
}

/** Niches this person reviews. Admins review every niche. An empty list means no review queue. */
export function reviewableSkillIds(actor: CommunityActor): "all" | string[] {
  if (isAdmin(actor)) return "all";
  return [...new Set(actor.roles.map((role) => role.skillId))];
}

/** Unmerge, close and reopen gaps, label good-first gaps, and grant or revoke reviewers. */
export function canModerate(actor: CommunityActor, skillId: string): boolean {
  return isAdmin(actor) || nicheRole(actor, skillId) === "MAINTAINER";
}

export function canGrantReviewer(actor: CommunityActor, skillId: string): boolean {
  return canModerate(actor, skillId);
}

export function canGrantMaintainer(actor: CommunityActor): boolean {
  return isAdmin(actor);
}

/**
 * Grant or revoke one role. Admins change any role. Maintainers change reviewers in their own niche.
 * Nobody changes their own role. Returns the reason when it is not allowed.
 */
export function roleChangeBlock(actor: CommunityActor, userId: string, skillId: string, role: NicheRole): string | null {
  if (userId === actor.id) return "You cannot change your own role.";
  if (role === "MAINTAINER") return canGrantMaintainer(actor) ? null : "Only an admin changes maintainers.";
  return canGrantReviewer(actor, skillId) ? null : "You cannot change reviewers in this niche.";
}

export function canSeeSuggestions(actor: CommunityActor, skillId: string): boolean {
  return canModerate(actor, skillId);
}
