import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard.jsx";

export const metadata: Metadata = {
  title: "Your path",
};

export default function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  return (
    <Suspense fallback={<p className="sf-review-live">Loading your path</p>}>
      <OnboardingContent searchParams={searchParams} />
    </Suspense>
  );
}

async function OnboardingContent({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [profile, query] = await Promise.all([
    prisma.learnerProfile.findUnique({ where: { userId: session.user.id } }),
    searchParams,
  ]);

  if (profile && query.edit !== "1") redirect("/dashboard");

  return (
    <OnboardingWizard
      name={session.user.name ?? ""}
      initial={
        profile
          ? {
              skillSlug: profile.skillSlug,
              pace: profile.pace,
              goal: profile.goal,
              accent: profile.accent,
            }
          : null
      }
    />
  );
}
