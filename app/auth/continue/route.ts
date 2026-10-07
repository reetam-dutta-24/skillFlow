import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Where Google sign-in lands. A first-time learner has no profile yet, so they go through onboarding,
 * the same as an email sign-up. Everyone else goes to Home. Per request: it reads the session.
 */
export async function GET(request: Request) {
  const origin = new URL(request.url).origin;
  const session = await auth();
  if (!session?.user?.id) return NextResponse.redirect(new URL("/login", origin));
  const profile = await prisma.learnerProfile.findUnique({ where: { userId: session.user.id }, select: { id: true } });
  return NextResponse.redirect(new URL(profile ? "/dashboard" : "/onboarding", origin));
}
