import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { accountTag } from "@/lib/cache/tags";
import { prisma } from "@/lib/prisma";

export type CachedAccount = {
  name: string | null;
  email: string | null;
  image: string | null;
};

/** Name, email, and photo for the shell. Invalidated when the profile name is saved. */
export async function loadCachedAccount(userId: string): Promise<CachedAccount | null> {
  "use cache";
  cacheLife("hours");
  cacheTag(accountTag(userId));

  const account = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, email: true, image: true },
  });
  if (!account) return null;
  return { name: account.name, email: account.email, image: account.image };
}
