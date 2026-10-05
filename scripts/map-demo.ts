/**
 * Development-only stand-ins so the learner map has something to show.
 * Refuses to run when NODE_ENV is production, or when the database is not on this machine.
 *
 *   npx tsx scripts/map-demo.ts add
 *   npx tsx scripts/map-demo.ts remove
 */
import "dotenv/config";
import { prisma } from "@/lib/prisma";

const EMAIL_PREFIX = "map-demo-";
const EMAIL_DOMAIN = "@skillflow.invalid";

const PLACES = [
  { key: "lisbon", city: "Lisbon", country: "Portugal", lat: 38.72, lng: -9.14, count: 6, skill: "travel-vlogging" },
  { key: "porto", city: "Porto", country: "Portugal", lat: 41.15, lng: -8.61, count: 6, skill: "travel-vlogging" },
  { key: "tokyo", city: "Tokyo", country: "Japan", lat: 35.68, lng: 139.65, count: 6, skill: "content-creation" },
  { key: "bengaluru", city: "Bengaluru", country: "India", lat: 12.97, lng: 77.59, count: 6, skill: "full-stack-web-dev" },
  { key: "reykjavik", city: "Reykjavik", country: "Iceland", lat: 64.15, lng: -21.94, count: 2, skill: "travel-vlogging" },
] as const;

const demoWhere = { email: { startsWith: EMAIL_PREFIX, endsWith: EMAIL_DOMAIN } };

function refuseUnlessLocal() {
  if (process.env.NODE_ENV === "production") {
    console.error("Refusing to run: NODE_ENV is production.");
    process.exit(1);
  }
  const raw = process.env.DATABASE_URL;
  if (!raw) {
    console.error("Refusing to run: DATABASE_URL is missing.");
    process.exit(1);
  }
  let host = "";
  try {
    host = new URL(raw).hostname;
  } catch {
    host = "";
  }
  if (host !== "localhost" && host !== "127.0.0.1" && host !== "::1") {
    console.error("Refusing to run: the database is not on this machine.");
    process.exit(1);
  }
}

async function addLearners() {
  const existing = await prisma.user.count({ where: demoWhere });
  if (existing > 0) {
    console.error(`${existing} demo learners already exist. Run "npx tsx scripts/map-demo.ts remove" first.`);
    process.exit(1);
  }

  const skills = await prisma.skill.findMany({
    where: { slug: { in: [...new Set(PLACES.map((place) => place.skill))] } },
    select: { id: true, slug: true },
  });
  const skillIds = new Map(skills.map((skill) => [skill.slug, skill.id]));

  let created = 0;
  for (const place of PLACES) {
    const skillId = skillIds.get(place.skill);
    if (!skillId) console.warn(`No skill "${place.skill}". Those learners still count under All niches.`);
    for (let index = 1; index <= place.count; index += 1) {
      await prisma.user.create({
        data: {
          email: `${EMAIL_PREFIX}${place.key}-${index}${EMAIL_DOMAIN}`,
          name: `Map demo ${place.city} ${index}`,
          learnerProfile: {
            create: {
              skillSlug: place.skill,
              pace: "steady",
              goal: "explore",
              accent: "tide",
              city: place.city,
              country: place.country,
              lat: place.lat,
              lng: place.lng,
              showOnMap: true,
            },
          },
          ...(skillId ? { skillProgress: { create: { skillId } } } : {}),
        },
      });
      created += 1;
    }
  }

  console.log(`Added ${created} demo learners.`);
  console.log("Lisbon, Porto, Tokyo, and Bengaluru have 6. Reykjavik has 2, so it stays hidden while MAP_MIN_LEARNERS is 5.");
  console.log("Lisbon and Porto sit close enough to cluster when the map is zoomed out.");
  console.log("Set MAP_MIN_LEARNERS=1 in .env and refresh /map to see Reykjavik too.");
}

async function removeLearners() {
  const result = await prisma.user.deleteMany({ where: demoWhere });
  console.log(`Removed ${result.count} demo learners.`);
}

async function main() {
  refuseUnlessLocal();
  const command = process.argv[2];
  if (command === "add") await addLearners();
  else if (command === "remove") await removeLearners();
  else {
    console.error('Use "add" or "remove".');
    process.exit(1);
  }
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : "The demo script failed.");
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
