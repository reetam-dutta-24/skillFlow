/**
 * Stage photos for every free path, committed under public/stages/<slug>/<order>.jpg.
 *
 *   npx tsx scripts/fetch-stage-photos.ts            # dry run: what would be fetched
 *   npx tsx scripts/fetch-stage-photos.ts --apply    # download, resize, and point each stage at its photo
 *
 * Source: Pexels when PEXELS_API_KEY is set, otherwise Openverse (no key), limited to CC0 and public
 * domain so no credit is required. StockSnap is tried first through Openverse because its photos are
 * real stock photography. Every photo's source and license is recorded in public/stages/credits.json.
 *
 * The three original paths already have hand-picked photos in public/uploads (gitignored). Those are
 * copied into public/stages too, so a clone or a deploy has every stage photo.
 *
 * A stage that already has its file is skipped, so the script can be re-run after a rate limit.
 */
import "dotenv/config";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";
import { prisma } from "@/lib/prisma";
import { FREE_PATH_SLUGS } from "@/lib/niches/tiers";

const APPLY = process.argv.includes("--apply");
const ROOT = join(process.cwd(), "public", "stages");
const CREDITS = join(ROOT, "credits.json");
const QUERIES: Record<string, [string, string][]> = JSON.parse(readFileSync(join(process.cwd(), "scripts", "stage-photo-queries.json"), "utf8"));
const UA = "SkillFlow-stage-photos/1.0 (https://github.com/reetam-dutta-24/skillFlow)";
const PEXELS = process.env.PEXELS_API_KEY?.trim();

type Credit = { slug: string; order: number; source: string; license: string; page: string; creator: string | null };
type Candidate = { id: string; url: string; width: number; height: number; page: string; license: string; source: string; creator: string | null };

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function searchPexels(query: string): Promise<Candidate[]> {
  const url = new URL("https://api.pexels.com/v1/search");
  url.searchParams.set("query", query);
  url.searchParams.set("orientation", "landscape");
  url.searchParams.set("per_page", "20");
  const response = await fetch(url, { headers: { Authorization: PEXELS!, "User-Agent": UA } });
  if (!response.ok) throw new Error(`pexels ${response.status}`);
  const body = (await response.json()) as { photos?: { id: number; width: number; height: number; url: string; photographer: string; src: { large2x: string } }[] };
  return (body.photos ?? []).map((photo) => ({
    id: `pexels-${photo.id}`,
    url: photo.src.large2x,
    width: photo.width,
    height: photo.height,
    page: photo.url,
    license: "Pexels License",
    source: "pexels",
    creator: photo.photographer,
  }));
}

async function searchOpenverse(query: string, source?: string): Promise<Candidate[]> {
  const url = new URL("https://api.openverse.org/v1/images/");
  url.searchParams.set("q", query);
  url.searchParams.set("license", "cc0,pdm");
  url.searchParams.set("mature", "false");
  url.searchParams.set("page_size", "20");
  if (source) url.searchParams.set("source", source);
  else url.searchParams.set("aspect_ratio", "wide");
  const response = await fetch(url, { headers: { "User-Agent": UA } });
  if (response.status === 429) throw new Error("rate-limited");
  if (!response.ok) throw new Error(`openverse ${response.status}`);
  const body = (await response.json()) as {
    results?: { id: string; url: string; width: number | null; height: number | null; foreign_landing_url: string; license: string; source: string; creator: string | null }[];
  };
  return (body.results ?? []).map((result) => ({
    id: `openverse-${result.id}`,
    url: result.url,
    width: result.width ?? 0,
    height: result.height ?? 0,
    page: result.foreign_landing_url,
    license: result.license.toUpperCase(),
    source: result.source,
    creator: result.creator,
  }));
}

/** Landscape, big enough for a 1280×720 crop, and not already used on this path. */
function usable(candidate: Candidate, used: Set<string>) {
  if (used.has(candidate.page)) return false;
  if (candidate.width && candidate.height && candidate.width < candidate.height * 1.2) return false;
  return !candidate.width || candidate.width >= 900;
}

async function findPhoto(queries: [string, string], used: Set<string>): Promise<Candidate | null> {
  const attempts: (() => Promise<Candidate[]>)[] = PEXELS
    ? queries.map((query) => () => searchPexels(query))
    : [
        () => searchOpenverse(queries[0], "stocksnap"),
        () => searchOpenverse(queries[1], "stocksnap"),
        () => searchOpenverse(queries[0]),
        () => searchOpenverse(queries[1]),
      ];
  for (const attempt of attempts) {
    const found = (await attempt()).find((candidate) => usable(candidate, used));
    await sleep(1500);
    if (found) return found;
  }
  return null;
}

/** 16:9, 1280×720, one quality setting for every photo so the roadmap feels like one set. */
async function saveCropped(input: Buffer, file: string) {
  await sharp(input).rotate().resize(1280, 720, { fit: "cover", position: "attention" }).jpeg({ quality: 78, mozjpeg: true }).toFile(file);
}

async function main() {
  mkdirSync(ROOT, { recursive: true });
  const credits: Credit[] = existsSync(CREDITS) ? JSON.parse(readFileSync(CREDITS, "utf8")) : [];
  const skills = await prisma.skill.findMany({
    where: { slug: { in: [...FREE_PATH_SLUGS] } },
    select: { slug: true, stages: { orderBy: { order: "asc" }, select: { id: true, order: true, image: true } } },
  });
  console.log(`${APPLY ? "Applying" : "Dry run"}: ${skills.length} paths. Source: ${PEXELS ? "Pexels" : "Openverse (CC0 / public domain)"}.`);

  let fetched = 0;
  let copied = 0;
  let missing = 0;
  for (const skill of skills) {
    const folder = join(ROOT, skill.slug);
    if (APPLY) mkdirSync(folder, { recursive: true });
    const used = new Set(credits.filter((credit) => credit.slug === skill.slug).map((credit) => credit.page));
    const queries = QUERIES[skill.slug];

    for (const stage of skill.stages) {
      const file = join(folder, `${stage.order}.jpg`);
      const publicPath = `/stages/${skill.slug}/${stage.order}.jpg`;
      if (existsSync(file)) {
        if (APPLY && stage.image !== publicPath) await prisma.roadmapStage.update({ where: { id: stage.id }, data: { image: publicPath } });
        continue;
      }

      // A hand-picked photo already uploaded for this stage: keep it, just move it into git.
      if (stage.image?.startsWith("/uploads/")) {
        const source = join(process.cwd(), "public", stage.image);
        if (!existsSync(source)) {
          console.warn(`  ${skill.slug} ${stage.order}: ${stage.image} is not on this machine`);
          missing += 1;
          continue;
        }
        console.log(`  copy ${skill.slug} ${stage.order} from ${stage.image}`);
        if (APPLY) {
          await saveCropped(readFileSync(source), file);
          await prisma.roadmapStage.update({ where: { id: stage.id }, data: { image: publicPath } });
        }
        copied += 1;
        continue;
      }

      const pair = queries?.[stage.order - 1];
      if (!pair) {
        console.warn(`  ${skill.slug} ${stage.order}: no search words in stage-photo-queries.json`);
        missing += 1;
        continue;
      }
      if (!APPLY) {
        console.log(`  would search ${skill.slug} ${stage.order}: "${pair[0]}" / "${pair[1]}"`);
        continue;
      }

      let photo: Candidate | null = null;
      try {
        photo = await findPhoto(pair, used);
      } catch (error) {
        console.error(`Stopped at ${skill.slug} ${stage.order}: ${(error as Error).message}. Re-run later to continue.`);
        writeFileSync(CREDITS, `${JSON.stringify(credits, null, 2)}\n`);
        await prisma.$disconnect();
        process.exit(2);
      }
      if (!photo) {
        console.warn(`  ${skill.slug} ${stage.order}: nothing found for "${pair[0]}" / "${pair[1]}"`);
        missing += 1;
        continue;
      }

      const response = await fetch(photo.url, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(30_000) });
      if (!response.ok) {
        console.warn(`  ${skill.slug} ${stage.order}: download failed (${response.status})`);
        missing += 1;
        continue;
      }
      await saveCropped(Buffer.from(await response.arrayBuffer()), file);
      await prisma.roadmapStage.update({ where: { id: stage.id }, data: { image: publicPath } });
      used.add(photo.page);
      credits.push({ slug: skill.slug, order: stage.order, source: photo.source, license: photo.license, page: photo.page, creator: photo.creator });
      writeFileSync(CREDITS, `${JSON.stringify(credits, null, 2)}\n`);
      fetched += 1;
      console.log(`  ${skill.slug} ${stage.order}: ${photo.source} ${photo.license} ${photo.page}`);
    }
  }

  console.log(`Done. Fetched ${fetched}, copied ${copied}, still missing ${missing}.`);
  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
