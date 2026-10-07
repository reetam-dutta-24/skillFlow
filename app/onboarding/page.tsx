import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { cacheLife, cacheTag } from "next/cache";
import { auth } from "@/lib/auth";
import { CATALOG_TAG } from "@/lib/cache/tags";
import { FREE_PATH_SLUGS } from "@/lib/niches/tiers";
import { prisma } from "@/lib/prisma";
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard.jsx";

export const metadata: Metadata = {
  title: "Your profile",
};

/** The thirty free paths for the picker. The same for every visitor, so it shares the catalog cache. */
async function loadFreePaths() {
  "use cache";
  cacheLife("hours");
  cacheTag(CATALOG_TAG);
  const rows = await prisma.skill.findMany({
    where: { slug: { in: [...FREE_PATH_SLUGS] }, status: "AVAILABLE" },
    select: { slug: true, name: true, image: true, nicheGroup: true, description: true },
    orderBy: [{ order: "asc" }, { name: "asc" }],
  });
  return rows.map((row) => ({
    slug: row.slug,
    name: row.name,
    image: row.image,
    group: row.nicheGroup.toLowerCase(),
    description: row.description ?? "",
  }));
}

export default function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  return (
    <Suspense fallback={<p className="sf-review-live">Loading your profile</p>}>
      <OnboardingContent searchParams={searchParams} />
    </Suspense>
  );
}

/** Personal: the session, the saved answers, and the followed paths stay on the request. */
async function OnboardingContent({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;

  const [profile, query, paths, followed] = await Promise.all([
    prisma.learnerProfile.findUnique({ where: { userId } }),
    searchParams,
    loadFreePaths(),
    prisma.userSkillProgress.findMany({ where: { userId }, select: { skill: { select: { slug: true } } } }),
  ]);

  // A profile made only by saving a city in Settings has no age range yet; it still needs onboarding.
  const finished = Boolean(profile?.ageRange);
  if (finished && query.edit !== "1") redirect("/dashboard");

  const freeSlugs = new Set(paths.map((path) => path.slug));
  const followedFree = followed.map((row) => row.skill.slug).filter((slug) => freeSlugs.has(slug));

  return (
    <OnboardingWizard
      name={session.user.name ?? ""}
      paths={paths}
      editing={finished}
      initial={
        profile
          ? {
              ageRange: profile.ageRange ?? "",
              guardianConsent: profile.guardianConsent,
              stage: profile.stage ?? "",
              headline: profile.headline ?? "",
              paths: followedFree.length ? followedFree : freeSlugs.has(profile.skillSlug) && finished ? [profile.skillSlug] : [],
              goals: profile.goals.length ? profile.goals : [],
              experience: profile.experience ?? "",
              pace: profile.pace,
              weeklyHours: profile.weeklyHours ?? 0,
              formats: profile.formats,
              languages: profile.languages,
              accent: profile.accent,
              city: profile.city && profile.country ? `${profile.city}, ${profile.country}` : "",
            }
          : null
      }
    />
  );
}
