import "server-only";
import { devDelay } from "@/lib/mock/delay";
import { listSkills } from "@/lib/mock/catalog";
import type { SessionViewer } from "@/lib/types/domain";
import type { SettingsData } from "@/lib/types/pages";

export async function getSettingsData(viewer: SessionViewer): Promise<SettingsData> {
  await devDelay();
  const skills = listSkills();
  return {
    name: viewer.name,
    email: viewer.email,
    image: viewer.image,
    followed: skills.filter((skill) => skill.followed),
    availableToAdd: skills.filter((skill) => !skill.followed),
    streakReminder: true,
  };
}
