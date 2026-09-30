import "server-only";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/** Count one view per signed-in reader. A refresh does not add another. */
export async function recordContributionView(userId: string, contributionId: string) {
  const row = await prisma.communityContribution.findUnique({
    where: { id: contributionId },
    select: { status: true },
  });
  if (!row || row.status !== "MERGED") return { counted: false as const };

  try {
    await prisma.$transaction(async (tx) => {
      await tx.contributionView.create({ data: { userId, contributionId } });
      await tx.communityContribution.update({
        where: { id: contributionId },
        data: { viewCount: { increment: 1 } },
      });
    });
    return { counted: true as const };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { counted: false as const };
    }
    throw error;
  }
}
