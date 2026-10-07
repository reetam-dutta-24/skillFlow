import { auth } from "@/lib/auth";
import { loadFollowedSkillIds } from "@/lib/data/catalog";
import { PublishFollowedIds } from "./followed-context";

/** Follow marks are personal. They update the cached grid after the shared cards are on screen. */
export async function FollowedSkillSeed() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const ids = await loadFollowedSkillIds(session.user.id);
  return <PublishFollowedIds ids={ids} />;
}
