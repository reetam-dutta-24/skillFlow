import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { LANDING_STATS_TAG } from "@/lib/cache/tags";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { publicOrigin } from "@/lib/public-origin";

/**
 * Where Google sign-in lands. A first-time learner has no profile yet, so they go through onboarding,
 * the same as an email sign-up. Everyone else goes to Home. Per request: it reads the session.
 */
export async function GET(request: Request) {
  const origin = publicOrigin(request.headers, request.url);
  const session = await auth();
  if (!session?.user?.id) return NextResponse.redirect(new URL("/login", origin));
  const profile = await prisma.learnerProfile.findUnique({ where: { userId: session.user.id }, select: { id: true } });
  // A first Google sign-in has just created the account, so the landing learner count is out of date.
  // updateTag is for Server Actions only; expire 0 makes the next landing visit read the new count.
  if (!profile) revalidateTag(LANDING_STATS_TAG, { expire: 0 });
  return NextResponse.redirect(new URL(profile ? "/dashboard" : "/onboarding", origin));
}
