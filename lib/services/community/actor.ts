import "server-only";
import { prisma } from "@/lib/prisma";
import type { CommunityActor } from "@/lib/services/community/permissions";

export async function communityActor(userId: string): Promise<CommunityActor | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true,
      communityRoles: { select: { skillId: true, role: true } },
    },
  });
  if (!user) return null;
  return { id: user.id, appRole: user.role, roles: user.communityRoles };
}
