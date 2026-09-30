import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { z } from "zod";

/** Live skill slug → catalog file name. The file keeps the researched slug. */
const FILE_BY_SLUG: Record<string, string> = {
  "full-stack-web-dev": "full-stack-web-development",
};

const DELAY_MS = 400;
const TIMEOUT_MS = 15_000;

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

type Outcome =
  | { kind: "ok"; status: number }
  | { kind: "embedding_disabled"; status: number }
  | { kind: "removed_or_private"; status: number }
  | { kind: "needs_manual_check"; status: number; reason: string }
  | { kind: "failed"; status: number | null; reason: string };

type Mismatch = { label: string; catalog: string; found: string };

type Checked = {
  stageOrder: number;
  stageTitle: string;
  resource: Resource;
  outcome: Outcome;
  mismatches: Mismatch[];
  finalUrl: string | null;
};

const CHALLENGE =
  /just a moment|cf-challenge|challenge-platform|attention required|enable javascript and cookies|pardon our interruption|verify you are human|checking your browser/i;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalize(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
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

async function readSnippet(response: Response) {
  const reader = response.body?.getReader();
  if (!reader) return "";
  const decoder = new TextDecoder();
  let text = "";
  try {
    while (text.length < 12_000) {
      const { done, value } = await reader.read();
      if (done) break;
      text += decoder.decode(value, { stream: true });
    }
  } finally {
    await reader.cancel().catch(() => undefined);
  }
  return text.slice(0, 12_000);
}

function isBotChallenge(response: Response, body: string) {
  if (response.headers.get("cf-mitigated")) return true;
  const type = response.headers.get("content-type") ?? "";
  if (!type.includes("html") && !type.includes("text")) return false;
  return CHALLENGE.test(body);
}

async function request(url: string) {
  const response = await fetch(url, {
    redirect: "follow",
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers: {
      Accept: "text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8",
      "User-Agent": "SkillFlowCatalogCheck/1.0",
    },
  });
  return response;
}

function failure(error: unknown): Outcome {
  const reason = error instanceof Error ? error.message : "Could not reach the link.";
  return { kind: "failed", status: null, reason };
}

async function checkVideo(resource: Resource): Promise<{ outcome: Outcome; mismatches: Mismatch[] }> {
  if (!resource.videoId) return { outcome: { kind: "failed", status: null, reason: "Missing video id." }, mismatches: [] };
  const endpoint = new URL("https://www.youtube.com/oembed");
  endpoint.searchParams.set("url", `https://www.youtube.com/watch?v=${resource.videoId}`);
  endpoint.searchParams.set("format", "json");

  let response: Response;
  try {
    response = await request(endpoint.toString());
  } catch (error) {
    return { outcome: failure(error), mismatches: [] };
  }

  if (response.status === 401 || response.status === 403) {
    await response.body?.cancel().catch(() => undefined);
    return { outcome: { kind: "embedding_disabled", status: response.status }, mismatches: [] };
  }
  if (response.status === 404) {
    await response.body?.cancel().catch(() => undefined);
    return { outcome: { kind: "removed_or_private", status: response.status }, mismatches: [] };
  }
  if (response.status < 200 || response.status >= 300) {
    await response.body?.cancel().catch(() => undefined);
    return { outcome: { kind: "failed", status: response.status, reason: `HTTP ${response.status}` }, mismatches: [] };
  }

  let payload: { title?: unknown; author_name?: unknown };
  try {
    payload = (await response.json()) as { title?: unknown; author_name?: unknown };
  } catch {
    return { outcome: { kind: "failed", status: response.status, reason: "Oembed response was not JSON." }, mismatches: [] };
  }
  if (typeof payload.title !== "string" || typeof payload.author_name !== "string") {
    return { outcome: { kind: "failed", status: response.status, reason: "Oembed response had no title or author." }, mismatches: [] };
  }

  const mismatches: Mismatch[] = [];
  if (normalize(resource.title) !== normalize(payload.title)) {
    mismatches.push({ label: "Title", catalog: resource.title, found: payload.title });
  }
  if (normalize(resource.provider) !== normalize(payload.author_name)) {
    mismatches.push({ label: "Author", catalog: resource.provider, found: payload.author_name });
  }
  if (resource.author && normalize(resource.author) !== normalize(payload.author_name)) {
    mismatches.push({ label: "Author credit", catalog: resource.author, found: payload.author_name });
  }
  return { outcome: { kind: "ok", status: response.status }, mismatches };
}

async function checkPage(url: string): Promise<{ outcome: Outcome; finalUrl: string | null }> {
  let response: Response;
  try {
    response = await request(url);
  } catch (error) {
    return { outcome: failure(error), finalUrl: null };
  }

  const finalUrl = response.url && response.url !== url ? response.url : null;
  if (response.status === 403 || response.status === 429) {
    await response.body?.cancel().catch(() => undefined);
    return {
      outcome: { kind: "needs_manual_check", status: response.status, reason: `HTTP ${response.status}` },
      finalUrl,
    };
  }

  const body = await readSnippet(response);
  if (isBotChallenge(response, body)) {
    return {
      outcome: { kind: "needs_manual_check", status: response.status, reason: "bot challenge" },
      finalUrl,
    };
  }
  if (response.status >= 200 && response.status < 300) {
    return { outcome: { kind: "ok", status: response.status }, finalUrl };
  }
  return { outcome: { kind: "failed", status: response.status, reason: `HTTP ${response.status}` }, finalUrl };
}

function outcomeText(outcome: Outcome) {
  if (outcome.kind === "ok") return `OK (${outcome.status})`;
  if (outcome.kind === "embedding_disabled") return `embedding disabled (${outcome.status})`;
  if (outcome.kind === "removed_or_private") return `removed or private (${outcome.status})`;
  if (outcome.kind === "needs_manual_check") return `needs manual check (${outcome.reason})`;
  return `failed (${outcome.reason})`;
}

function problem(outcome: Outcome) {
  return outcome.kind !== "ok";
}

async function checkCatalog(catalog: Catalog) {
  const checked: Checked[] = [];
  const resources = catalog.stages.flatMap((stage) => stage.resources.map((resource) => ({ stage, resource })));

  for (let index = 0; index < resources.length; index += 1) {
    if (index > 0) await sleep(DELAY_MS);
    const { stage, resource } = resources[index];
    const video = resource.type === "EMBEDDED_VIDEO";
    const result = video ? await checkVideo(resource) : await checkPage(resource.url);
    const outcome = result.outcome;
    const mismatches = "mismatches" in result ? result.mismatches : [];
    const finalUrl = "finalUrl" in result ? result.finalUrl : null;
    checked.push({ stageOrder: stage.order, stageTitle: stage.title, resource, outcome, mismatches, finalUrl });
    console.log(`${index + 1}/${resources.length} ${stage.order}.${resource.order} ${outcomeText(outcome)}`);
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
  const count = (kind: Outcome["kind"]) => checked.filter((item) => item.outcome.kind === kind).length;
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
