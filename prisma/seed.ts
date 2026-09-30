// prisma/seed.ts
import bcrypt from "bcryptjs"
import { PrismaClient } from "@prisma/client"
import { EXTRA_NICHES } from "../lib/niche-catalog"

const prisma = new PrismaClient()

const ADMIN_PASSWORD = "admin123"

const BASE_SKILLS = [
  {
    slug: "full-stack-web-dev",
    name: "Full-Stack Web Development",
    description: "Build and ship a web app, from the interface through the database.",
    isFlagship: true,
    order: 1,
  },
  {
    slug: "art-painting",
    name: "Art & Painting",
    description: "See, mix, and place paint so a picture holds together.",
    isFlagship: true,
    order: 2,
  },
  {
    slug: "content-creation",
    name: "Content Creation",
    description: "Plan, make, and publish work people can finish.",
    isFlagship: true,
    order: 3,
  },
  {
    slug: "photography",
    name: "Photography",
    description: "Light, frame, and edit a photograph on purpose.",
    isFlagship: false,
    order: 4,
  },
  {
    slug: "music-production",
    name: "Music Production",
    description: "Arrange, record, and mix a track.",
    isFlagship: false,
    order: 5,
  },
]

async function main() {
  const skills = [
    ...BASE_SKILLS,
    ...EXTRA_NICHES.map((skill, index) => ({
      ...skill,
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
        isFlagship: skill.isFlagship,
        order: skill.order,
      },
      create: skill,
    })
  }

  console.log("Skills seeded.")

  const fullStackWebDev = await prisma.skill.findUniqueOrThrow({
    where: { slug: "full-stack-web-dev" },
  })

  const stages = [
    { title: "React Fundamentals", description: "Components, props, and the render model.", order: 1 },
    { title: "Hooks & State", description: "State, effects, and the dependency array.", order: 2 },
    { title: "Server Actions", description: "Mutating data without writing API routes.", order: 3 },
    { title: "Auth & Sessions", description: "Protecting routes and managing identity.", order: 4 },
    { title: "Database & Prisma", description: "Modeling and querying relational data.", order: 5 },
  ]

  for (const stage of stages) {
    await prisma.roadmapStage.upsert({
      where: { skillId_order: { skillId: fullStackWebDev.id, order: stage.order } },
      update: {},
      create: { ...stage, skillId: fullStackWebDev.id },
    })
  }

  console.log("Roadmap stages seeded.")

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
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())