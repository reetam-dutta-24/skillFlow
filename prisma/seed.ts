// prisma/seed.ts
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  const skills = [
    { slug: "full-stack-web-dev", name: "Full-Stack Web Development", isFlagship: true, order: 1 },
    { slug: "art-painting", name: "Art & Painting", isFlagship: true, order: 2 },
    { slug: "content-creation", name: "Content Creation", isFlagship: true, order: 3 },
    { slug: "photography", name: "Photography", isFlagship: false, order: 4 },
    { slug: "music-production", name: "Music Production", isFlagship: false, order: 5 },
  ]

  for (const skill of skills) {
    await prisma.skill.upsert({
      where: { slug: skill.slug },
      update: {},
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
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())