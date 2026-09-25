// app/signup/actions.ts
"use server"

import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"

export async function signUp(formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const name = formData.get("name") as string

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return { error: "An account with this email already exists." }
  }

  const hashedPassword = await bcrypt.hash(password, 10)

  await prisma.user.create({
    data: { email, name, password: hashedPassword },
  })

  return { success: true }
}