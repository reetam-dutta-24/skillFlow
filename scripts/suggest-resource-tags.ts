import "dotenv/config";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/prisma";
import { mergeResourceTags, readTagOrigins } from "@/lib/plan/tags";
import { suggestResourceTags } from "@/lib/plan/suggest";

const REPORT = path.join(process.cwd(), "content", "catalog", "_review", "resource-tags.md");

async function main() {
  const apply = process.argv.includes("--apply");
  const resources = await prisma.resource.findMany({
    orderBy: [{ stage: { skill: { order: "asc" } } }, { stage: { order: "asc" } }, { order: "asc" }],
    select: {
      id: true,
      title: true,
      description: true,
      keyPoints: true,
      durationMinutes: true,
      depth: true,
      isCore: true,
      captionLanguages: true,
      tagOrigins: true,
      stage: { select: { order: true, skill: { select: { slug: true } } } },
    },
  });

  const lines = [
    `# Resource tag suggestions`,
    "",
    apply ? "Applied where an admin had not already set the field." : "Dry run. Nothing was written. Pass `--apply` only after checking this report.",
    "",
  ];

  for (const resource of resources) {
    const suggestion = await suggestResourceTags({
      title: resource.title,
      description: resource.description ?? "",
      keyPoints: resource.keyPoints.join("\n"),
    });
    const where = `${resource.stage.skill.slug} stage ${resource.stage.order} — ${resource.title}`;
    if (!suggestion) {
      lines.push(`- ${where}: no suggestion`);
      continue;
    }
    const existing = {
      durationMinutes: resource.durationMinutes,
      depth: resource.depth,
      isCore: resource.isCore,
      captionLanguages: resource.captionLanguages,
    };
    const merged = mergeResourceTags(existing, readTagOrigins(resource.tagOrigins), suggestion, "model");
    lines.push(`- ${where}: ${merged.changed ? `would set ${JSON.stringify(merged.tags)}` : "left as saved"}`);
    if (apply && merged.changed) {
      await prisma.resource.update({
        where: { id: resource.id },
        data: { ...merged.tags, tagOrigins: merged.origins },
      });
    }
  }

  await mkdir(path.dirname(REPORT), { recursive: true });
  await writeFile(REPORT, `${lines.join("\n")}\n`, "utf8");
  console.log(apply ? `Applied tag suggestions. Report: ${path.relative(process.cwd(), REPORT)}` : `Dry run only. Report: ${path.relative(process.cwd(), REPORT)}`);
  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Tag suggestion failed.");
  process.exit(1);
});
