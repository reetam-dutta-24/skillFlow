import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

const protectedRoutes = [
  "/dashboard",
  "/clips",
  "/onboarding",
  "/roadmap",
  "/lesson",
  "/quiz",
  "/milestone",
  "/progress",
  "/analytics",
  "/settings",
  "/skills",
  "/upgrade",
  "/leaderboard",
  "/notes",
  "/projects",
  "/creator",
  "/profile",
  "/dev",
  "/submit",
  "/admin",
  "/open-source",
  "/map",
];

export const proxy = auth((req) => {
  const isProtected = protectedRoutes.some((route) => req.nextUrl.pathname.startsWith(route));
  const isAsset = /\.(?:avif|gif|jpe?g|png|svg|webp|ico)$/i.test(req.nextUrl.pathname);

  if (isProtected && !isAsset && !req.auth) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    return NextResponse.redirect(loginUrl);
  }
});

export const config = {
  matcher: [
    "/dashboard",
    "/dashboard/:path*",
    "/clips",
    "/clips/:path*",
    "/onboarding",
    "/onboarding/:path*",
    "/roadmap",
    "/roadmap/:path*",
    "/lesson",
    "/lesson/:path*",
    "/quiz",
    "/quiz/:path*",
    "/milestone",
    "/milestone/:path*",
    "/progress",
    "/progress/:path*",
    "/analytics",
    "/analytics/:path*",
    "/upgrade",
    "/upgrade/:path*",
    "/leaderboard",
    "/leaderboard/:path*",
    "/notes",
    "/notes/:path*",
    "/projects",
    "/projects/:path*",
    "/creator",
    "/creator/:path*",
    "/profile",
    "/profile/:path*",
    "/dev",
    "/dev/:path*",
    "/settings",
    "/settings/:path*",
    "/skills",
    "/skills/:path*",
    "/submit",
    "/submit/:path*",
    "/admin",
    "/admin/:path*",
    "/open-source",
    "/open-source/:path*",
    "/map",
    "/map/:path*",
  ],
};
