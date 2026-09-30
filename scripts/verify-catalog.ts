import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { z } from "zod";
import { checkCatalogLink, outcomeText, type LinkOutcome } from "@/lib/catalog-link-check";

/** Live skill slug → catalog file name. The file keeps the researched slug. */
const FILE_BY_SLUG: Record<string, string> = {
  "full-stack-web-dev": "full-stack-web-development",
};

const DELAY_MS = 400;

const resourceSchema = z.object({
  order: z.number().int(),
  type: z.enum(["EMBEDDED_VIDEO", "DOC_LINK", "COURSE_LINK"]),
  needsReview: z.boolean(),
  title: z.string(),
  provider: z.string(),
  author: z.string().optional(),
  url: z.string(),
  videoId: z.string().optional(),
});

const catalogSchema = z.object({
  slug: z.string(),
  name: z.string(),
  stages: z.array(
    z.object({
      order: z.number().int(),
      title: z.string(),
      resources: z.array(resourceSchema),
    }),
  ),
});

type Catalog = z.infer<typeof catalogSchema>;
type Resource = z.infer<typeof resourceSchema>;

type Checked = {
  stageOrder: number;
  stageTitle: string;
  resource: Resource;
  outcome: LinkOutcome;
  mismatches: { label: string; catalog: string; found: string }[];
  finalUrl: string | null;
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function catalogFile(slug: string) {
  const fileName = FILE_BY_SLUG[slug] ?? slug;
  return {
    fileName,
    filePath: path.join(process.cwd(), "content", "catalog", `${fileName}.json`),
  };
}

async function readCatalog(slug: string) {
  const { fileName, filePath } = catalogFile(slug);
  let raw: unknown;
  try {
    raw = JSON.parse(await readFile(filePath, "utf8"));
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      throw new Error(`No catalog file for ${slug}. Expected ${path.relative(process.cwd(), filePath)}.`);
    }
    throw error;
  }
  const parsed = catalogSchema.safeParse(raw);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "The catalog file is not valid.");
  return { fileName, catalog: parsed.data };
}

function problem(outcome: LinkOutcome) {
  return outcome.kind !== "ok";
}

async function checkCatalog(catalog: Catalog) {
  const checked: Checked[] = [];
  const resources = catalog.stages.flatMap((stage) => stage.resources.map((resource) => ({ stage, resource })));

  for (let index = 0; index < resources.length; index += 1) {
    if (index > 0) await sleep(DELAY_MS);
    const { stage, resource } = resources[index];
    const result = await checkCatalogLink(resource);
    checked.push({
      stageOrder: stage.order,
      stageTitle: stage.title,
      resource,
      outcome: result.outcome,
      mismatches: result.mismatches,
      finalUrl: result.finalUrl,
    });
    console.log(`${index + 1}/${resources.length} ${stage.order}.${resource.order} ${outcomeText(result.outcome)}`);
  }

  return checked;
}

function bulletLink(item: Checked) {
  const lines = [
    `### Stage ${item.stageOrder}.${item.resource.order} — ${item.resource.title}`,
    "",
    `- Stage: ${item.stageTitle}`,
    `- Type: ${item.resource.type}`,
    `- Link: ${item.resource.url}`,
    `- Result: ${outcomeText(item.outcome)}`,
  ];
  if (item.finalUrl) lines.push(`- Final URL: ${item.finalUrl}`);
  return lines.join("\n");
}

function reportMarkdown(slug: string, fileName: string, catalog: Catalog, checked: Checked[]) {
  const problems = checked.filter((item) => problem(item.outcome));
  const mismatches = checked.filter((item) => item.mismatches.length > 0);
  const reviews = checked.filter((item) => item.resource.needsReview);
  const count = (kind: LinkOutcome["kind"]) => checked.filter((item) => item.outcome.kind === kind).length;
  const checkedOn = new Date().toISOString().slice(0, 10);

  const sections = [
    `# Catalog link check: ${fileName}`,
    "",
    `Checked ${checkedOn} for skill \`${slug}\` (${catalog.name}). ${checked.length} resources. This check does not change the catalog.`,
    "",
    "## Summary",
    "",
    `- OK: ${count("ok")}`,
    `- Embedding disabled: ${count("embedding_disabled")}`,
    `- Removed or private: ${count("removed_or_private")}`,
    `- Failed: ${count("failed")}`,
    `- Needs manual check: ${count("needs_manual_check")}`,
    `- Title or author mismatches: ${mismatches.length}`,
    "",
    "## Failed or needs manual check",
    "",
    problems.length > 0 ? problems.map(bulletLink).join("\n\n") : "None.",
    "",
    "## Title and author mismatches",
    "",
  ];

  if (mismatches.length === 0) sections.push("None.", "");
  else {
    for (const item of mismatches) {
      sections.push(`### Stage ${item.stageOrder}.${item.resource.order} — ${item.resource.title}`, "");
      sections.push(`- Link: ${item.resource.url}`);
      for (const mismatch of item.mismatches) {
        sections.push(`- ${mismatch.label}: catalog "${mismatch.catalog}" / YouTube "${mismatch.found}"`);
      }
      sections.push("");
    }
  }

  sections.push("## Needs review checklist", "");
  if (reviews.length === 0) sections.push("None.", "");
  else {
    for (const item of reviews) {
      sections.push(`- [ ] Stage ${item.stageOrder}.${item.resource.order} — ${item.resource.title}`);
      sections.push(`  - ${item.resource.url}`);
      sections.push(`  - ${outcomeText(item.outcome)}`);
    }
    sections.push("");
  }

  return `${sections.join("\n").replace(/\n{3,}/g, "\n\n")}\n`;
}

export async function verifyCatalog(slug: string) {
  const { fileName, catalog } = await readCatalog(slug);
  console.log(`Checking ${catalog.stages.reduce((sum, stage) => sum + stage.resources.length, 0)} resources in ${fileName}.json`);
  const checked = await checkCatalog(catalog);
  const markdown = reportMarkdown(slug, fileName, catalog, checked);
  const reviewDir = path.join(process.cwd(), "content", "catalog", "_review");
  await mkdir(reviewDir, { recursive: true });
  const reviewPath = path.join(reviewDir, `${fileName}.md`);
  await writeFile(reviewPath, markdown);
  console.log(`Wrote ${path.relative(process.cwd(), reviewPath)}`);
  return reviewPath;
}

function isDirectRun() {
  const entry = process.argv[1];
  if (!entry) return false;
  return import.meta.url === pathToFileURL(path.resolve(entry)).href;
}

if (isDirectRun()) {
  const slug = process.argv[2];
  if (!slug || slug.startsWith("--")) {
    console.error("Usage: npx tsx scripts/verify-catalog.ts <skill-slug>");
    process.exit(1);
  }
  verifyCatalog(slug).catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
