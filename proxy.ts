import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

const protectedRoutes = [
  "/dashboard",
  "/onboarding",
  "/roadmap",
  "/lesson",
  "/quiz",
  "/milestone",
  "/progress",
  "/settings",
  "/submit",
  "/admin",
];

export const proxy = auth((req) => {
  const isProtected = protectedRoutes.some((route) => req.nextUrl.pathname.startsWith(route));

  if (isProtected && !req.auth) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    return NextResponse.redirect(loginUrl);
  }
});

export const config = {
  matcher: [
    "/dashboard",
    "/dashboard/:path*",
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
    "/settings",
    "/settings/:path*",
    "/submit",
    "/submit/:path*",
    "/admin",
    "/admin/:path*",
  ],
};
