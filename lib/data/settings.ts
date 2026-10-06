import "server-only";
import { Prisma } from "@prisma/client";
import { isStoredAccent } from "@/lib/accent";
import { auth } from "@/lib/auth";
import { userHasPremium } from "@/lib/billing/access";
import { loadCatalog } from "@/lib/data/catalog";
import { prisma } from "@/lib/prisma";
import type { SkillStatus } from "@/lib/types/domain";

export type SettingsSkill = { id: string; name: string; slug: string; status: SkillStatus; offer: "FREE" | "MONETIZED"; followed: boolean };

const SIGN_IN_AGAIN = "Sign in again before saving.";

export async function getSettingsProfile() {
  const session = await auth();
  const userId = session?.user?.id;
  const [catalog, user] = await Promise.all([
    loadCatalog(),
    userId
      ? prisma.user.findUnique({
          where: { id: userId },
          select: {
            name: true,
            email: true,
            learnerProfile: { select: { accent: true, city: true, country: true, showOnMap: true } },
          },
        })
      : Promise.resolve(null),
  ]);
  const name = (user?.name ?? session?.user?.name ?? "").trim();
  const email = user?.email ?? session?.user?.email ?? "";

  const storedAccent = user?.learnerProfile?.accent;

  return {
    userId: userId ?? "",
    name,
    email,
    initial: name.charAt(0).toUpperCase() || "?",
    skills: catalog.map((entry) => ({
      id: entry.skill.id,
      name: entry.skill.name,
      slug: entry.skill.slug,
      status: entry.skill.status,
      offer: entry.skill.offer,
      followed: entry.skill.followed,
    })),
    accent: isStoredAccent(storedAccent) ? storedAccent : "tide",
    streakReminder: true,
    map: {
      hasProfile: Boolean(user?.learnerProfile),
      city: user?.learnerProfile?.city ?? null,
      country: user?.learnerProfile?.country ?? null,
      showOnMap: user?.learnerProfile?.showOnMap ?? false,
    },
    premium: userId ? session?.user?.role === "ADMIN" || (await userHasPremium(userId)) : false,
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
    select: { id: true, status: true, offer: true },
  });
  if (!skill) return { ok: false as const, error: "Choose a skill that exists." };
  if (skill.status !== "AVAILABLE") return { ok: false as const, error: "That skill is not open yet." };
  if (skill.offer !== "FREE") {
    const premium = await userHasPremium(userId);
    const role = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    if (role?.role !== "ADMIN" && !premium) {
      return { ok: false as const, error: "That path is Premium. Upgrade to follow it." };
    }
  }

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
