/**
 * Where the tour shows on Home, and where its last button goes. Plain code, shared by the Home page and the tests.
 */

/** Never finished or skipped: the invite card. Otherwise only the small "Replay the tour" link. */
export function tourEntry(completedAt: Date | null | undefined): "invite" | "replay" {
  return completedAt ? "replay" : "invite";
}

export type TourStart = {
  href: string;
  /** The stage the button opens, or null when it goes to a path page or the niches. */
  stageTitle: string | null;
  pathName: string | null;
  image: string | null;
};

type FollowedRow = {
  skill: { name: string; image: string | null };
  roadmapHref: string;
  lane: { title: string; status: string; href: string; image: string | null }[];
};

/**
 * The first open stage of the first followed path. A path with every stage passed, or none yet, opens its path page.
 * Nothing followed goes to the niches.
 */
export function tourStartTarget(followed: readonly FollowedRow[]): TourStart {
  const first = followed[0];
  if (!first) return { href: "/skills", stageTitle: null, pathName: null, image: null };
  const open = first.lane.find((item) => item.status === "current" || item.status === "ready");
  if (!open) return { href: first.roadmapHref, stageTitle: null, pathName: first.skill.name, image: first.skill.image };
  return {
    href: open.href,
    stageTitle: open.title,
    pathName: first.skill.name,
    image: open.image ?? first.skill.image,
  };
}

/** The last slide's one primary button. */
export function tourStartLabel(start: TourStart) {
  if (start.stageTitle) return "Start this stage";
  return start.pathName ? "Open my path" : "Browse niches";
}
