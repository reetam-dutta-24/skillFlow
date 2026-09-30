// prisma/seed.ts
import bcrypt from "bcryptjs"
import { PrismaClient } from "@prisma/client"
import { prisma as catalogPrisma } from "../lib/prisma"
import { EXTRA_NICHES } from "../lib/niche-catalog"
import { nicheMeta } from "../lib/niche-meta"
import { importCatalog } from "../scripts/import-catalog"

const prisma = new PrismaClient()

const ADMIN_PASSWORD = "admin123"

const BASE_SKILLS = [
  {
    slug: "full-stack-web-dev",
    name: "Full-Stack Web Development",
    description: "Build and ship a web app, from the interface through the database.",
    image: "/skills/web.jpg",
    isFlagship: true,
    order: 1,
  },
  {
    slug: "art-painting",
    name: "Art & Painting",
    description: "See, mix, and place paint so a picture holds together.",
    image: "/skills/art.jpg",
    isFlagship: true,
    order: 2,
  },
  {
    slug: "content-creation",
    name: "Content Creation",
    description:
      "Plan, shoot, edit and publish video that holds attention: formats and specs, exposure, lighting, audio, composition, editing, color, loudness, analytics and copyright.",
    image: "/skills/content.jpg",
    isFlagship: true,
    order: 3,
  },
  {
    slug: "photography",
    name: "Photography",
    description: "Light, frame, and edit a photograph on purpose.",
    image: "/skills/photo.jpg",
    isFlagship: false,
    order: 4,
  },
  {
    slug: "music-production",
    name: "Music Production",
    description: "Arrange, record, and mix a track.",
    image: "/skills/music.jpg",
    isFlagship: false,
    order: 5,
  },
]

async function main() {
  const skills = [
    ...BASE_SKILLS,
    ...EXTRA_NICHES.map((skill, index) => ({
      ...skill,
      image: `/skills/${skill.slug}.jpg`,
      isFlagship: false,
      order: index + 6,
    })),
  ]

  for (const skill of skills) {
    await prisma.skill.upsert({
      where: { slug: skill.slug },
      update: {
        name: skill.name,
        description: skill.description,
        image: skill.image,
        isFlagship: skill.isFlagship,
        status: skill.isFlagship ? "AVAILABLE" : "COMING_SOON",
        offer: skill.isFlagship ? "FREE" : "MONETIZED",
        nicheGroup: nicheMeta(skill.slug).group.toUpperCase() as
          | "CARE"
          | "MONEY"
          | "HOME"
          | "LANGUAGE"
          | "GAMES"
          | "CRAFT"
          | "FUTURE"
          | "MIND",
        order: skill.order,
      },
      create: {
        ...skill,
        status: skill.isFlagship ? "AVAILABLE" : "COMING_SOON",
        offer: skill.isFlagship ? "FREE" : "MONETIZED",
        nicheGroup: nicheMeta(skill.slug).group.toUpperCase() as
          | "CARE"
          | "MONEY"
          | "HOME"
          | "LANGUAGE"
          | "GAMES"
          | "CRAFT"
          | "FUTURE"
          | "MIND",
      },
    })
  }

  console.log("Skills seeded.")

  const adminPassword = await bcrypt.hash(ADMIN_PASSWORD, 10)
  const admins = [
    { name: "admin1", email: "admin1.skillflow@gmail.com" },
    { name: "admin2", email: "admin2.skillflow@gmail.com" },
  ]

  for (const admin of admins) {
    await prisma.user.upsert({
      where: { email: admin.email },
      update: { name: admin.name, role: "ADMIN", password: adminPassword },
      create: { ...admin, role: "ADMIN", password: adminPassword },
    })
  }

  console.log("Admin accounts seeded.")

  await importCatalog("full-stack-web-dev", { apply: true })
  await importCatalog("content-creation", { apply: true })
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    await catalogPrisma.$disconnect()
  })