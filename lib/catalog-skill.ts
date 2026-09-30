import { prisma } from "@/lib/prisma";

export type CatalogSkillInput = {
  name: string;
  slug: string;
  description: string;
  open: boolean;
};

export type CatalogSkillResult = { ok: true; id: string; slug: string } | { ok: false; error: string };

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export async function createCatalogSkill(input: CatalogSkillInput): Promise<CatalogSkillResult> {
  const name = input.name.trim();
  const slug = input.slug.trim().toLowerCase();
  const description = input.description.trim();
  if (!name) return { ok: false, error: "Add a name." };
  if (!SLUG.test(slug)) return { ok: false, error: "Use a slug like travel-vlogging." };

  const taken = await prisma.skill.findUnique({ where: { slug }, select: { id: true } });
  if (taken) return { ok: false, error: "That slug is already used." };

  const last = await prisma.skill.findFirst({ orderBy: { order: "desc" }, select: { order: true } });
  const created = await prisma.skill.create({
    data: {
      name,
      slug,
      description: description || null,
      isFlagship: input.open,
      order: (last?.order ?? 0) + 1,
    },
    select: { id: true, slug: true },
  });
  return { ok: true, id: created.id, slug: created.slug };
}
