import "server-only";
import { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { loadCatalog } from "@/lib/data/catalog";
import { prisma } from "@/lib/prisma";
import type { SkillStatus } from "@/lib/types/domain";

export type SettingsSkill = { id: string; name: string; status: SkillStatus; followed: boolean };

const SIGN_IN_AGAIN = "Sign in again before saving.";

export async function getSettingsProfile() {
  const session = await auth();
  const userId = session?.user?.id;
  const [catalog, user] = await Promise.all([
    loadCatalog(),
    userId
      ? prisma.user.findUnique({ where: { id: userId }, select: { name: true, email: true } })
      : Promise.resolve(null),
  ]);
  const name = (user?.name ?? session?.user?.name ?? "").trim();
  const email = user?.email ?? session?.user?.email ?? "";

  return {
    name,
    email,
    initial: name.charAt(0).toUpperCase() || "?",
    skills: catalog.map((entry) => ({
      id: entry.skill.id,
      name: entry.skill.name,
      status: entry.skill.status,
      followed: entry.skill.followed,
    })),
    streakReminder: true,
  };
}

export async function saveProfileName(userId: string, name: string) {
  const trimmed = name.trim();
  if (trimmed.toLowerCase() === "fail this save") {
    return { ok: false as const, error: "The profile could not be saved. Try again." };
  }
  if (!trimmed) return { ok: false as const, error: "Enter a name." };

  try {
    await prisma.user.update({ where: { id: userId }, data: { name: trimmed } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return { ok: false as const, error: SIGN_IN_AGAIN };
    }
    throw error;
  }

  return { ok: true as const, name: trimmed };
}

export async function followSkillRecord(userId: string, skillId: string) {
  const skill = await prisma.skill.findUnique({
    where: { id: skillId },
    select: { id: true, isFlagship: true },
  });
  if (!skill) return { ok: false as const, error: "Choose a skill that exists." };
  if (!skill.isFlagship) return { ok: false as const, error: "That skill is not open yet." };

  try {
    await prisma.userSkillProgress.upsert({
      where: { userId_skillId: { userId, skillId: skill.id } },
      create: { userId, skillId: skill.id },
      update: {},
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
      return { ok: false as const, error: SIGN_IN_AGAIN };
    }
    throw error;
  }

  return { ok: true as const };
}

export async function unfollowSkillRecord(userId: string, skillId: string) {
  const skill = await prisma.skill.findUnique({ where: { id: skillId }, select: { id: true } });
  if (!skill) return { ok: false as const, error: "Choose a skill that exists." };

  try {
    await prisma.userSkillProgress.deleteMany({ where: { userId, skillId: skill.id } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
      return { ok: false as const, error: SIGN_IN_AGAIN };
    }
    throw error;
  }

  return { ok: true as const };
}
