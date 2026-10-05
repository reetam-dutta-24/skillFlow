// lib/prisma.ts
import { PrismaClient } from "@prisma/client"

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

function lacksCurrentModels(client: PrismaClient) {
  const fields = client as unknown as Record<string, unknown>;
  return !("learnerProfile" in fields) || !("communityMembership" in fields) || !("event" in fields);
}

// Drop a dev client created before a model existed. The engine file can stay locked while `next dev` is running.
if (process.env.NODE_ENV !== "production" && globalForPrisma.prisma && lacksCurrentModels(globalForPrisma.prisma)) {
  void globalForPrisma.prisma.$disconnect();
  globalForPrisma.prisma = undefined;
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma