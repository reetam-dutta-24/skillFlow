# SkillFlow

A mastery-first learning platform. Curated roadmaps, a quiz, and an explain-back check are the product. Version 1 ships the roadmaps and the lessons. The quiz and the explain-back are not graded yet.

## Status

Three free paths are loaded and available:

- Full-Stack Web Development — 12 stages, 64 resources. Stages 1–9 open.
- Travel Vlogging — 8 stages, 46 resources. Stages 1–5 open.
- Content Creation — 10 stages, 57 resources. Stages 1–7 open.

On each free path the last three stages stay visible and locked. Art & Painting remains a flagship and is coming soon, with no stages. Every other niche is coming soon.

The niche list shows 32 cards a page. Home and roadmaps show the first 12, a blurred peek of the next row, and a link to the full list.

Signed-in learners can keep a preset accent or build their own gradient from a color palette, a hex value, or RGB. Public pages stay on Dusk.

Open Source is a signed-in contribution feed for the skills a learner follows. The side panel can narrow that set or open any other niche. The niche tabs, a contribution page, and the contribute form are in place. A new post stays open until a reviewer merges it.

Creator studio is a signed-in library for a video the learner owns. An admin approves it onto that niche’s clip feed and the creator’s public profile. View counts stay in the studio.

A dead stored link can be marked unavailable. The lesson keeps the saved title, description, and key points.

## Tech stack

- Next.js 16.3.4, React 19, TypeScript, Tailwind CSS v4. Landing and auth pages are static. Shared catalog screens (niche grid, lessons, clips, submit picker) are cached for every visitor. Progress and the account menu stay per person
- PostgreSQL and Prisma 6
- Auth.js v5 — email and password with bcrypt, JWT sessions. Google is configured in code and is not on the login form
- Quizzes and explain-back grading are not connected to a model yet

## Getting started

```bash
npm install
docker compose up -d
npx prisma migrate dev
npx prisma db seed
npm run dev
```

Copy `.env.example` to `.env` and fill in real values before running.

Do not re-run the seed on a database that already has people in it. The seed resets the admin passwords and rewrites every niche. To reload one path, use the catalog commands below, then set that skill's status and offer directly. The importer does not change status, the cover image, or the flagship flag.

## Catalog

Check the researched file. This does not change stored resources:

```bash
npx tsx scripts/verify-catalog.ts full-stack-web-dev
npx tsx scripts/verify-catalog.ts content-creation
npx tsx scripts/verify-catalog.ts travel-vlogging
```

Load a path. The first command prints the plan. The second writes it.

```bash
npx tsx --conditions=react-server scripts/import-catalog.ts travel-vlogging
npx tsx --conditions=react-server scripts/import-catalog.ts travel-vlogging --apply
```

Check the links already stored for a skill. A removed, private, failed, or non-embeddable source is marked unavailable. A link that only needs a person to look at it is left as it is.

```bash
npx tsx scripts/verify-catalog.ts full-stack-web-dev --from-db
```

The Full-Stack file is `content/catalog/full-stack-web-development.json`. The live slug stays `full-stack-web-dev`.

## What is still ahead

Passing a quiz or an explain-back does not unlock a stage. The model calls, Stripe, and the leaderboard score are not running. `Project-roadmap.md` is the phase list. `AGENTS.md` is the working context for the next session.
