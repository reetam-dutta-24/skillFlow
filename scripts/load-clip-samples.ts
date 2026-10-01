import "dotenv/config";
import { prisma } from "@/lib/prisma";

const MARK = "clip-sample";

/** Extra candidates so a dead short can be skipped. The first 10 that still resolve are stored. */
const CANDIDATES: Record<string, string[]> = {
  "full-stack-web-dev": [
    "TmfRHTIP9Eo",
    "CFtvKIAJZpQ",
    "GWMZLsMijp0",
    "8nHmCbIzm5A",
    "-2CnrBUfAUQ",
    "hU3w2BrjeUc",
    "9B3wKe0bDRg",
    "DANWV4hUVfc",
    "69sOmWtarXw",
    "e0aux3ZuSw8",
    "2KqLNdx0hbs",
  ],
  "travel-vlogging": [
    "4HT8c0H_qYE",
    "4tIb8vUvGLg",
    "1dL9s4RAuPM",
    "OAiuUVWSKTw",
    "kVZTZvNOxbU",
    "qis01A_kgyg",
    "nkrQZIrOejE",
    "e8tnRNtfxjI",
    "Tg531sUdk_Y",
    "PXqRKcc_G7c",
  ],
  "content-creation": [
    "e4wdRr8NoGo",
    "d-SM-zQ_-rE",
    "wi3sku4C1f0",
    "VQRL6Wa81Zw",
    "CGMsZVjvqX8",
    "ylUPo8g8_lM",
    "X1ONIei7stI",
    "A2AN713fNGI",
    "zzMg-GA8ND4",
    "BUpjvutWTk8",
  ],
};

function shortUrl(id: string) {
  return `https://www.youtube.com/shorts/${id}`;
}

async function lookup(id: string) {
  const url = shortUrl(id);
  const response = await fetch(`https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(url)}`);
  if (!response.ok) return null;
  const body = (await response.json()) as { title?: string; author_name?: string };
  const title = body.title?.replace(/\s+/g, " ").trim();
  if (!title) return null;
  return { title: title.slice(0, 140), author: body.author_name?.trim() || "YouTube" };
}

async function main() {
  const skills = await prisma.skill.findMany({
    where: { slug: { in: Object.keys(CANDIDATES) }, status: "AVAILABLE" },
    select: {
      id: true,
      slug: true,
      stages: { orderBy: { order: "asc" }, select: { id: true, order: true, title: true } },
    },
  });
  if (skills.length !== 3) throw new Error("Expected the three available flagship niches.");

  const removed = await prisma.resource.deleteMany({
    where: { url: { contains: "/shorts/" }, transcript: MARK },
  });

  let inserted = 0;
  for (const skill of skills) {
    const openCount = Math.max(1, skill.stages.length - 3);
    const open = skill.stages.filter((stage) => stage.order <= openCount);
    if (open.length === 0) throw new Error(`No open stage for ${skill.slug}.`);

    const picked: { id: string; title: string; author: string }[] = [];
    for (const id of CANDIDATES[skill.slug]) {
      const found = await lookup(id);
      if (!found) {
        console.log(`Skipped ${skill.slug} ${id}: YouTube did not return a title.`);
        continue;
      }
      picked.push({ id, ...found });
      if (picked.length === 10) break;
    }
    if (picked.length < 10) throw new Error(`${skill.slug} only resolved ${picked.length} shorts.`);

    for (const [index, clip] of picked.entries()) {
      const stage = open[index % open.length];
      const latest = await prisma.resource.aggregate({ where: { stageId: stage.id }, _max: { order: true } });
      const order = (latest._max.order ?? 0) + 1;
      await prisma.resource.create({
        data: {
          stageId: stage.id,
          type: "HOOK_CLIP",
          url: shortUrl(clip.id),
          order,
          title: clip.title,
          description: `${clip.author}. A YouTube Short attached to this stage.`,
          transcript: MARK,
          keyPoints: [],
          provider: "YouTube",
          author: clip.author,
          videoId: clip.id,
          isFree: true,
          language: "en",
          sourceStatus: "ACTIVE",
          needsReview: true,
        },
      });
      inserted += 1;
      console.log(`${skill.slug} stage ${stage.order}: ${clip.title}`);
    }
  }

  console.log(`Removed ${removed.count} earlier sample clips.`);
  console.log(`Inserted ${inserted} short clips.`);
  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error(error instanceof Error ? error.message : error);
  await prisma.$disconnect();
  process.exit(1);
});
