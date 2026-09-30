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

export function nicheRole(actor: CommunityActor, skillId: string): NicheRole | null {
  const match = actor.roles.find((role) => role.skillId === skillId);
  return match?.role ?? null;
}

/** Review contributions in this niche. Admins, maintainers, and reviewers. */
export function canReview(actor: CommunityActor, skillId: string): boolean {
  return isAdmin(actor) || nicheRole(actor, skillId) !== null;
}

/** A person cannot review their own contribution. */
export function canReviewContribution(actor: CommunityActor, skillId: string, authorId: string | null): boolean {
  if (!authorId || authorId === actor.id) return false;
  return canReview(actor, skillId);
}

/** Unmerge, close gaps, label good-first gaps, and grant or revoke reviewers. */
export function canModerate(actor: CommunityActor, skillId: string): boolean {
  return isAdmin(actor) || nicheRole(actor, skillId) === "MAINTAINER";
}

export function canGrantReviewer(actor: CommunityActor, skillId: string): boolean {
  return canModerate(actor, skillId);
}

export function canGrantMaintainer(actor: CommunityActor): boolean {
  return isAdmin(actor);
}

export function canSeeSuggestions(actor: CommunityActor, skillId: string): boolean {
  return canModerate(actor, skillId);
}
