<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# SkillFlow — context for a new chat

Read this after the Next.js block. `Project-roadmap.md` is the phase list. `README.md` is how to run the app. The files in `content/catalog/_review/` are generated link-check reports. Do not rewrite them by hand.

Last aligned with the working tree on 30 September 2026.

## What this product is

SkillFlow is a mastery-first learning app. A learner follows a skill, opens a stage of real external resources, and is meant to pass a quiz and an explain-back before moving on. Version 1 does not grade those checks yet. The free paths open every stage except the last three.

There is no comments, likes, view counts, or payments. Do not build Stripe.

## Version 1 niches

Three paths are free, available, and flagship. Signed-in learners can open every stage except the last three (`LOCKED_TAIL = 3` in `lib/data/catalog.ts`). Locked stages stay visible. Their real description and resources are not sent. The placeholder is "This part of the path stays locked."

| Slug | Name | Live status | Offer | Flagship | Stages | Resources | Needs review | Explain-backs |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `full-stack-web-dev` | Full-Stack Web Development | AVAILABLE | FREE | yes | 12 | 64 | 17 | 12 |
| `travel-vlogging` | Travel Vlogging | AVAILABLE | FREE | yes | 8 | 46 | 9 | 8 |
| `content-creation` | Content Creation | AVAILABLE | FREE | yes | 10 | 57 | 13 | 10 |

Open stages: Full-Stack 1–9, Travel 1–5, Content Creation 1–7.

**Art & Painting** (`art-painting`) stays. It is a flagship, `COMING_SOON`, `MONETIZED`, and has no stages. Do not delete it. Do not invent a catalog for it.

Photography and Music Production are coming soon, monetized, and not flagships. Every other niche is coming soon and monetized until a path is researched. The niche list is `BASE_SKILLS` in `prisma/seed.ts` plus `EXTRA_NICHES` in `lib/niche-catalog.ts`. Travel Vlogging is a base skill. It must not also appear in `EXTRA_NICHES`, or a future seed will clear the flagship flag.

A stage opens only when the skill is `AVAILABLE`, the offer is `FREE`, the stage is not monetized, and `stage.order <= max(1, stageCount - 3)`. Coming-soon and monetized skills open nothing.

## Catalog files

| Live slug | File |
| --- | --- |
| `full-stack-web-dev` | `content/catalog/full-stack-web-development.json` |
| `content-creation` | `content/catalog/content-creation.json` |
| `travel-vlogging` | `content/catalog/travel-vlogging.json` |

`FILE_BY_SLUG` in `scripts/import-catalog.ts` and `scripts/verify-catalog.ts` maps only the Full-Stack mismatch. Do not rename the live slug `full-stack-web-dev`.

The Full-Stack and Travel JSON files say `"status": "COMING_SOON"`. That is the researched file. The live rows are `AVAILABLE`. The importer writes the skill name and description only. It does not set status, offer, image, or `isFlagship`. Content Creation's file says `AVAILABLE` because that override was written into the file. Do not "fix" a file status and expect the database to change.

Catalog `note:` lines have no column. Omit them from the JSON and the database. Zod strips unknown keys.

`[CONFIRM]` resources are stored with `needsReview: true`. If a link check fails, report it. Do not swap the URL.

YouTube ids on videos come from `?v=`. `lib/playable-src.ts` turns a watch, youtu.be, shorts, or embed URL into `https://www.youtube-nocookie.com/embed/ID?autoplay=1`. The lesson player and the clip feed both use it. Do not put a raw watch URL in an iframe.

Stage photos are `RoadmapStage.image`, served from `/uploads/...`. The importer omits `image`, so a reimport does not wipe photos. `public/uploads` is gitignored except `.gitkeep`. A fresh clone will not have the stage photos. Skill cover images live in `public/skills/` and are committed.

## How to load a catalog

The importer is server-only. Dry-run first. Apply only after the dry-run touches that skill alone.

```bash
npx tsx scripts/verify-catalog.ts <slug>
npx tsx --conditions=react-server scripts/import-catalog.ts <slug>
npx tsx --conditions=react-server scripts/import-catalog.ts <slug> --apply
```

A second dry-run should print "Nothing to change." `--from-db` checks rows already stored and can mark a dead link `UNAVAILABLE`. It writes `content/catalog/_review/<file>.from-db.md`. Use it only when asked. A 403 or a bot challenge is "needs manual check", not a failure, and is not a reason to replace the link.

Do not run `npx prisma db seed`. The seed resets admin passwords and rewrites every niche. After a catalog apply, set status, offer, and `isFlagship` with a targeted Prisma update. `seedStatus` and `seedOffer` in `prisma/seed.ts` already special-case Art so a future seed does not turn it back into a free available skill.

## What is wired, and what is not

Wired to Postgres:

- Niches, roadmaps, lessons, and clips read `Skill`, `RoadmapStage`, and `Resource`.
- Home shows one row per followed skill. Settings → Add follows an available skill and writes `UserSkillProgress`. Settings → Remove deletes that progress row and keeps quiz history. Home and the roadmap index show a short niche teaser that links to `/skills`. They do not follow a skill.
- A niche card links to `/roadmap/[slug]` only when the skill is available and has stages. Coming-soon cards are articles.
- Admin catalog (`/admin/catalog`) edits skills that already have stages, and lists every niche. Needs-review filter is `#catalog-review-only`.
- Submit writes `ResourceSubmission`. Admin approval creates a `Resource`. Reject stores a note.
- Profile name saves. Email does not. Theme and accent apply immediately. The ten presets stay. A custom gradient is `custom:#start:#end` on `LearnerProfile.accent` and the `skillflow-accent` cookie. The palette, hex, and RGB fields live on Settings and onboarding. That choice is personal: it is not part of the catalog cache, and saving it does not call `invalidateCatalog()`.
- Explain-back questions and rubrics are stored on each imported stage. No quiz questions are stored. `/quiz/[stageId]` reads Prisma and shows an empty state.
- Progress, analytics, and home stats read real attempt counts. With no attempts, those numbers are zero. The charts are not a mock learner with a streak of 12.

Not wired:

- Quiz generation and explain-back grading. `/milestone/[stageId]` still reads `lib/mock/catalog`. Real stage ids do not resolve there. This is Version 2.
- Passing a quiz or an explain-back does not unlock the next stage. The last three stages of a free path are what stay locked.
- Streaks do not advance from activity. `User.currentStreak` is stored and displayed. Nothing updates it on a schedule.
- Mastery percent is not calculated from attempts.
- Stripe, leaderboard score, transcript PDF, notes, peer review, and creator tools. Those routes are labeled previews and stay out of the main nav.
- `requireLearner()` exists and is not used by pages. `requireAdmin()` is: no session goes to `/login`, any other role gets `notFound()`.

## Stack facts that are easy to get wrong

- Next.js 16.3.4, React 19.2.8, Tailwind v4, Prisma 6.19.3, NextAuth v5 beta.32. `trustHost: true`. Sessions are JWT. Credentials needs JWT. Do not describe database sessions or a finished Google button. Google is configured in `lib/auth.ts` only.
- `cacheComponents` is on in `next.config.ts`. Shared niches, stages, resources, the niche grid, lesson screens, clips, and the submit picker use `use cache` with the `catalog` tag. The niches page shows 32 cards at a time in the browser, so the page number is not a cache key. Home and the roadmap index reuse a cached teaser of the first rows. Admin catalog saves and an approved submission call `updateTag`. Progress, streaks, and settings stay on the request. The account menu streams beside that shell.
- `proxy.ts` exports `export const proxy = auth(...)`. `middleware.ts` was deleted. Do not restore it. The proxy only checks that someone is signed in.
- Postgres database name is `skillflow` on localhost:5432. `prisma.config.ts` loads `.env` with dotenv because Prisma 6 does not.
- Migrations through `20260930150000_stage_image` are applied. Do not create a migration unless the schema changes.
- `tsx` top-level await fails under CommonJS. Wrap scripts in `async function main()`. PowerShell has no `&&` and no bash heredoc. It also eats `$disconnect` inside `tsx -e`. Use a temp script, then delete it.
- Full-repo `eslint` still fails on older files. Lint the files you touched. `tsc --noEmit` and `next build` are the project checks.
- Do not start a second `npm run dev` if one is already answering on port 3000.
- Known failure strings, left in on purpose: catalog title `fail this save`, settings name `fail this save`, submit title `fail this submit`, review notes `fail this review`.
- Placeholder video id constant is `skillflow-placeholder`. Do not use it to replace a real catalog id.

## Pages that still name Art

Landing, the auth carousel, and onboarding name Travel Vlogging. `lib/mock/catalog.ts` still uses Art for the unwired milestone screen. Do not edit that file unless the task is that mock.

Also leave `lib/auth.ts` and the auth models alone unless the task is auth.

## Working rules

- Do not commit or push unless the user asks. After a piece of work, leave a commit message in the reply.
- Do not run the full seed.
- Do not research or rewrite pasted catalog text. Copy it. Omit note lines.
- If a link check fails, report the URL and the result. Do not replace it.
- Do not sign the browser out. Do not print `AUTH_SECRET` or passwords.
- When a screen, layout, or client flow changes, verify it in the browser before saying it is done.
- Decide the cache for every new page, section, and component. Content that is the same for every visitor uses `"use cache"`, `cacheLife("hours")`, and the `catalog` tag, and a write that changes it calls `invalidateCatalog()`. Session, progress, follow marks, streaks, and the account menu stay on the request. Do not call `auth()` inside a cached function.
- Every new page, section, and component must reflow at phone width. A grid uses one column under 640px and two under 960px unless the design is a single horizontal scroller. Put the mobile rule after the base grid rule so a later desktop rule does not win. Check 375px and desktop before saying a layout is done.
- Update `AGENTS.md`, `Project-roadmap.md`, and `README.md` when the product gains a capability those files do not mention. A new cache, a new path, a new lock rule, and a newly wired screen all belong there. Do not leave a new system only in code. Do not hand-edit `content/catalog/_review/`.
