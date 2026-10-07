import "dotenv/config";
import { prisma } from "@/lib/prisma";

async function main() {
  const skills = await prisma.skill.findMany({
    where: { stages: { some: {} } },
    orderBy: { order: "asc" },
    select: {
      slug: true,
      name: true,
      _count: { select: { stages: true } },
      stages: {
        select: {
          resources: {
            select: { durationMinutes: true, depth: true, isCore: true, captionLanguages: true, language: true },
          },
        },
      },
    },
  });
  for (const skill of skills) {
    const resources = skill.stages.flatMap((stage) => stage.resources);
    const tagged = resources.filter((resource) => resource.durationMinutes != null || resource.depth != null || resource.isCore || resource.captionLanguages.length > 0);
    const languages = [...new Set(resources.map((resource) => resource.language))].join(",");
    console.log(`${skill.slug}\tstages=${skill.stages.length}\tresources=${resources.length}\ttagged=${tagged.length}\tlangs=${languages}`);
  }
  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
