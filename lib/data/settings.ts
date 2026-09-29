import "server-only";
import { devDelay } from "@/lib/mock/delay";
import { listSkills } from "@/lib/mock/catalog";
import type { SkillStatus } from "@/lib/types/domain";

export type SettingsSkill = { id: string; name: string; status: SkillStatus; followed: boolean };

export async function getSettingsProfile(user: { name: string | null; email: string | null }) {
  await devDelay();
  return {
    name: user.name ?? "",
    email: user.email ?? "",
    initial: (user.name ?? "?").trim().charAt(0).toUpperCase() || "?",
    skills: listSkills().map((skill) => ({
      id: skill.id,
      name: skill.name,
      status: skill.status,
      followed: skill.followed,
    })),
    streakReminder: true,
  };
}
