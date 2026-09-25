// middleware.ts (project root)
import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

const protectedRoutes = [
  "/dashboard",
  "/roadmap",
  "/quiz",
  "/milestone",
  "/progress",
  "/settings",
]

export default auth((req) => {
  const isProtected = protectedRoutes.some((route) =>
    req.nextUrl.pathname.startsWith(route)
  )

  if (isProtected && !req.auth) {
    const loginUrl = new URL("/login", req.nextUrl.origin)
    return NextResponse.redirect(loginUrl)
  }
})

export const config = {
  matcher: ["/dashboard/:path*", "/roadmap/:path*", "/quiz/:path*", "/milestone/:path*", "/progress/:path*", "/settings/:path*"],
}