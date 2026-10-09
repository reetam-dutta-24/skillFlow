// app/signup/actions.ts
"use server"

import bcrypt from "bcryptjs"
import { headers } from "next/headers"
import { clientIp, signupAllowed } from "@/lib/limits"
import { prisma } from "@/lib/prisma"
import { normalizeEmail } from "@/lib/google-auth"

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export async function signUp(formData: FormData) {
  if (!(await signupAllowed(clientIp(await headers())))) return { error: "Too many sign-ups from this network. Try again later." }
  const email = normalizeEmail(formData.get("email"))
  const password = String(formData.get("password") ?? "")
  const name = String(formData.get("name") ?? "").trim()

  if (!name) return { error: "Add your name." }
  if (!EMAIL.test(email)) return { error: "Enter a valid email address." }
  if (password.length < 8) return { error: "Use at least 8 characters for the password." }

  const existing = await prisma.user.findUnique({
    where: { email },
    select: { password: true, accounts: { where: { provider: "google" }, select: { id: true } } },
  })
  if (existing) {
    if (!existing.password && existing.accounts.length > 0) {
      return { error: "This email already signs in with Google. Use Continue with Google." }
    }
    return { error: "An account with this email already exists." }
  }

  const hashedPassword = await bcrypt.hash(password, 10)

  await prisma.user.create({
    data: { email, name, password: hashedPassword },
  })

  return { success: true }
}
