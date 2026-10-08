import "server-only";
import { Prisma } from "@prisma/client";
import { isStoredAccent } from "@/lib/accent";
import { auth } from "@/lib/auth";
import { storeGeneratedAvatar } from "@/lib/avatar-render";
import { userHasPremium } from "@/lib/billing/access";
import { invalidateAccount, invalidateCatalog, invalidateCommunity } from "@/lib/cache/invalidate";
import { prisma } from "@/lib/prisma";
import { googleAuthEnabled } from "@/lib/google-auth";
import { displayNameProblem, isPhotoChoice } from "@/lib/profile-identity";
import { readUploadedImage } from "@/lib/uploads";

const SIGN_IN_AGAIN = "Sign in again before saving.";

export async function getSettingsProfile() {
  const session = await auth();
  const userId = session?.user?.id;
  const user = userId
    ? await prisma.user.findUnique({
        where: { id: userId },
        select: {
          name: true,
          image: true,
          email: true,
          emailVerified: true,
          password: true,
          accounts: { where: { provider: "google" }, select: { id: true } },
          learnerProfile: { select: { accent: true, city: true, country: true, showOnMap: true, streakReminder: true, showActivity: true } },
        },
      })
    : null;
  const name = (user?.name ?? session?.user?.name ?? "").trim();
  const email = user?.email ?? session?.user?.email ?? "";

  const storedAccent = user?.learnerProfile?.accent;

  return {
    userId: userId ?? "",
    name,
    image: user?.image ?? null,
    email,
    initial: name.charAt(0).toUpperCase() || "?",
    accent: isStoredAccent(storedAccent) ? storedAccent : "tide",
    streakReminder: user?.learnerProfile?.streakReminder ?? true,
    showActivity: user?.learnerProfile?.showActivity ?? true,
    map: {
      hasProfile: Boolean(user?.learnerProfile),
      city: user?.learnerProfile?.city ?? null,
      country: user?.learnerProfile?.country ?? null,
      showOnMap: user?.learnerProfile?.showOnMap ?? false,
    },
    signIn: {
      hasPassword: Boolean(user?.password),
      emailVerified: Boolean(user?.emailVerified),
      google: Boolean(user?.accounts.length),
      googleAvailable: googleAuthEnabled(),
    },
    premium: userId ? session?.user?.role === "ADMIN" || (await userHasPremium(userId)) : false,
  };
}

/**
 * Saves the display name and, unless the choice is `keep`, the profile photo (`User.image`).
 * A generated avatar is drawn again here from its style and seed. An upload must be a file that
 * `/uploads` already holds. Afterwards every cache that shows a name or a photo is dropped.
 */
export async function saveProfileIdentity(userId: string, input: { name: string; photo?: unknown }) {
  const trimmed = input.name.trim();
  if (trimmed.toLowerCase() === "fail this save") {
    return { ok: false as const, error: "The profile could not be saved. Try again." };
  }
  const problem = displayNameProblem(trimmed);
  if (problem) return { ok: false as const, error: problem };

  const photo = input.photo ?? { kind: "keep" };
  if (!isPhotoChoice(photo)) return { ok: false as const, error: "Choose a photo again." };

  const data: { name: string; image?: string | null } = { name: trimmed };
  if (photo.kind === "none") data.image = null;
  if (photo.kind === "upload") {
    if (!(await readUploadedImage(photo.url))) return { ok: false as const, error: "That photo could not be found. Upload it again." };
    data.image = photo.url;
  }
  if (photo.kind === "avatar") data.image = await storeGeneratedAvatar(photo.style, photo.seed);

  try {
    await prisma.user.update({ where: { id: userId }, data });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return { ok: false as const, error: SIGN_IN_AGAIN };
    }
    throw error;
  }

  // The shell's account row, community lists (contributors, posts), and the clip feed (creator names) show these.
  invalidateAccount(userId);
  invalidateCommunity();
  const liveVideo = await prisma.creatorWork.findFirst({ where: { ownerId: userId, status: "LIVE" }, select: { id: true } });
  if (liveVideo) invalidateCatalog();

  return { ok: true as const, name: trimmed, image: data.image === undefined ? undefined : data.image };
}

/** Same placeholders a city uses when onboarding has not written a path yet. */
const PLACEHOLDER_PROFILE = {
  skillSlug: "full-stack-web-dev",
  pace: "steady",
  goal: "explore",
  accent: "tide",
};

export async function saveStreakReminder(userId: string, enabled: boolean) {
  if (typeof enabled !== "boolean") return { ok: false as const, error: "Choose on or off." };
  await prisma.learnerProfile.upsert({
    where: { userId },
    create: { userId, ...PLACEHOLDER_PROFILE, streakReminder: enabled },
    update: { streakReminder: enabled },
  });
  return { ok: true as const };
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
