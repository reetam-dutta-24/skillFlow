// lib/prisma.ts
import { PrismaClient } from "@prisma/client"

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

function lacksLearnerProfile(client: PrismaClient) {
  return !("learnerProfile" in (client as unknown as Record<string, unknown>))
}

// Drop a dev client created before LearnerProfile existed. The engine file can stay locked while `next dev` is running.
if (process.env.NODE_ENV !== "production" && globalForPrisma.prisma && lacksLearnerProfile(globalForPrisma.prisma)) {
  void globalForPrisma.prisma.$disconnect()
  globalForPrisma.prisma = undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma