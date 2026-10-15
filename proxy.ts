import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { publicOrigin } from "@/lib/public-origin";

const protectedRoutes = [
  "/dashboard",
  "/clips",
  "/onboarding",
  "/roadmap",
  "/lesson",
  "/milestone",
  "/progress",
  "/analytics",
  "/settings",
  "/skills",
  "/upgrade",
  "/notes",
  "/creator",
  "/profile",
  "/dev",
  "/submit",
  "/admin",
  "/open-source",
  "/map",
  "/nearby",
  "/career-test",
];

export const proxy = auth((req) => {
  const origin = publicOrigin(req.headers, req.url);
  const isProtected = protectedRoutes.some((route) => req.nextUrl.pathname.startsWith(route));
  const isAsset = /\.(?:avif|gif|jpe?g|png|svg|webp|ico)$/i.test(req.nextUrl.pathname);

  if (req.nextUrl.pathname === "/" && req.auth) {
    return NextResponse.redirect(new URL("/dashboard", origin));
  }

  if (isProtected && !isAsset && !req.auth) {
    const loginUrl = new URL("/login", origin);
    return NextResponse.redirect(loginUrl);
  }
});

export const config = {
  matcher: [
    "/",
    "/dashboard",
    "/dashboard/:path*",
    "/clips",
    "/clips/:path*",
    "/onboarding",
    "/onboarding/:path*",
    "/career-test",
    "/career-test/:path*",
    "/roadmap",
    "/roadmap/:path*",
    "/lesson",
    "/lesson/:path*",
    "/milestone",
    "/milestone/:path*",
    "/progress",
    "/progress/:path*",
    "/analytics",
    "/analytics/:path*",
    "/upgrade",
    "/upgrade/:path*",
    "/notes",
    "/notes/:path*",
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
    "/nearby",
    "/nearby/:path*",
  ],
};
