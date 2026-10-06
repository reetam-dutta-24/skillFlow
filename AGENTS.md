<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# SkillFlow — context for a new chat

Read this after the Next.js block. `Project-roadmap.md` is the phase list. `README.md` is how to run the app. The files in `content/catalog/_review/` are generated link-check reports. Do not rewrite them by hand.

Last aligned with the working tree on 6 October 2026.

## What this product is

SkillFlow is a mastery-first learning app. A learner follows a skill, opens a stage of real external resources, and passes an explain-back before the stage is recorded. Version 1 grades a real stage one idea at a time. There is no quiz. A learner can also bring their own resource and get an explain-back gate prompt for it (Version 2 preview). Thirty paths are free. The next stage opens only after the explain-back on the current one is passed, and the last three stages stay locked.

There is no comments, likes, view counts, or payments. Do not build Stripe.

## Free paths and Premium niches

Thirty paths are free and available to everyone. The list is `FREE_PATH_SLUGS` in `lib/niches/tiers.ts`. Four of them have catalogs today. The other twenty-six are free and have no stages until a catalog is added through the admin CMS. Do not invent those catalogs.

A stage is structurally open when the skill is `AVAILABLE`, the offer is `FREE`, the stage is not monetized, and `stage.order <= max(1, stageCount - 3)` (`LOCKED_TAIL = 3`). The last three stages stay locked for everyone. Their real description and resources are not sent. The tail placeholder is "This part of the path stays locked."

On top of that, the next stage stays shut for this learner until every earlier open stage has a passed explain-back. A stage they already passed stays open. That check is personal: it lives in `loadCatalog`, `getLesson`, the milestone, and the explain-back write. It is not inside `"use cache"`. The sentence is "Pass the previous stage to open this one." A stage waiting on that pass still shows its title, photo, and description, with a lock. The last two stages on the path stay blurred.

| Slug | Name | Live status | Offer | Flagship | Stages | Resources | Needs review | Explain-backs |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `full-stack-web-dev` | Full-Stack Web Development | AVAILABLE | FREE | yes | 12 | 64 | 17 | 12 |
| `travel-vlogging` | Travel Vlogging | AVAILABLE | FREE | yes | 8 | 46 | 9 | 8 |
| `content-creation` | Content Creation | AVAILABLE | FREE | yes | 10 | 57 | 13 | 10 |
| `music-production` | Music Production | AVAILABLE | FREE | no | 8 | 45 | 9 | 8 |

Open stages: Full-Stack 1–9, Travel 1–5, Content Creation 1–7, Music Production 1–5.

The other twenty-six free slugs, still with no stages: `art-painting`, `photography`, `self-grooming`, `animation`, `iot-robot-automation`, `screenwriting`, `graphic-design`, `ai-tools`, `seo`, `cybersecurity`, `digital-marketing`, `emergency-preparedness`, `personal-finance`, `badminton`, `public-speaking`, `sound-design`, `nutrition`, `psychology`, `podcasting`, `guitar`, `chess`, `interior-design`, `relationships`, `socializing`, `freelancing`, `travel-planning`.

**Art & Painting** (`art-painting`) stays a flagship and one of the thirty free paths. `content/catalog/art-painting.json` is written and not imported: the link check failed on `https://www.acmiart.org/acmi-seals` (404) and `https://www.ucl.ac.uk/slade/know/1818` (502). Do not delete it. Do not swap those links.

Every slug outside that list is Premium: `AVAILABLE`, `MONETIZED`, and zero stages. The card says Premium. There is no payment, so the label is the lock. Do not invent resources for them. Settings cannot follow a Premium path. The niche list is `BASE_SKILLS` in `prisma/seed.ts` plus `EXTRA_NICHES` in `lib/niche-catalog.ts`. Travel Vlogging is a base skill. It must not also appear in `EXTRA_NICHES`, or a future seed will clear the flagship flag. `seedOffer` follows `isFreePath`. Do not run the full seed.

## Catalog files

| Live slug | File |
| --- | --- |
| `full-stack-web-dev` | `content/catalog/full-stack-web-development.json` |
| `content-creation` | `content/catalog/content-creation.json` |
| `travel-vlogging` | `content/catalog/travel-vlogging.json` |
| `music-production` | `content/catalog/music-production.json` |

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
- Home shows one row per followed skill. Settings → Add follows a free path and writes `UserSkillProgress`. Settings → Remove deletes that progress row and keeps explain-back history. A Premium path cannot be followed. Home and the roadmap index show a short niche teaser that links to `/skills`. They do not follow a skill.
- A niche card links to `/roadmap/[slug]` only when the skill is available and has stages. A Premium card says Premium and is not a link. The Open filter on `/skills` is the free paths.
- Admin catalog (`/admin/catalog`) edits skills that already have stages, and lists every niche. Needs-review filter is `#catalog-review-only`.
- Submit writes `ResourceSubmission`. Admin approval creates a `Resource`. Reject stores a note.
- Profile name saves. Email does not. Theme and accent apply immediately. The ten presets stay. A custom gradient is `custom:#start:#end` on `LearnerProfile.accent` and the `skillflow-accent` cookie. The palette, hex, and RGB fields live on Settings and onboarding. That choice is personal: it is not part of the catalog cache, and saving it does not call `invalidateCatalog()`.
- Explain-back on a real stage is a step wizard, one learning objective at a time. The ideas are written from that stage’s resources the first time the gate opens, and again when those resources change. Every key point is kept. A page the site blocks is skipped. With no model key, the questions already in the catalog stay. Each step sends that idea to Gemini’s free tier (`GEMINI_API_KEY`, `gemini-flash-lite-latest`). `OPENAI_API_KEY` is the paid fallback when that key is empty. An empty answer stays on the step. A wrong or thin answer stays on the step and shows a written review. A sound answer shows a written review too, then the next idea, and that idea is stored as a `LearnerNote` (the explanation and the review). Notes are personal and stay on the request. `/notes` is in the sidebar. Opening Notes also keeps a pass that was recorded before notes existed. The stage is recorded only after every idea has passed: one `ExplainBackAttempt` and `StageCompletion.explainBackPassed`. The next stage stays shut until this one is passed. The last three stages stay locked. With no key, a timeout, or a reply that is not a review, nothing is saved. The preview id `__explain_input__` still uses the mock walkthrough. `/notes/practice` grades an idea against a third-party page, a dropped text file, or pasted text, and stores a practice note when it holds. The page text is read on the server and cached for every learner under `practice-source`. The note itself is personal. It does not pass a stage, write a `Resource`, or call `invalidateCatalog()`. A followed skill can have one personal plan: preferences live on `LearningPlan`, and plain code builds the schedule from the shared stages. Gemini only turns a learning description into those preferences, or suggests resource tags for an admin to review. Undo on the roadmap hides that schedule and shows the shared stages again. It does not change those stages or their resources. While the plan is on, opening a stage lists the selected resources in that order and marks the extra ones Optional.
- The quiz feature was dropped on 1 October 2026. The explain-back gate is the only mastery check. The `Quiz`, `QuizQuestion`, and `QuizAttempt` tables and `StageCompletion.quizPassed` are still in the schema because the database was not changed. Nothing reads or writes them. Do not build on them.
- Progress, analytics, and home read explain-back attempts. Mastery for a skill is the share of its open stages with a passed explain-back. The last three stages of a free path stay out of that count. A passed stage is 100 on the lane. A streak day is a UTC day with a saved explain-back or a saved note. The current run stays alive through today and yesterday, and a gap sets it back to 0. The longest run is kept. Those reads stay on the request. Saving a streak or a mastery percent does not call `invalidateCatalog()`. With no attempts, the numbers are zero. The charts are not a mock learner with a streak of 12.
- Open Source is a post a learner submits. A moderator publishes it, and only then is it public. The stored status for a published post is still `MERGED`. Community content never goes into `Resource`, `RoadmapStage`, or any catalog table, and community writes never call `invalidateCatalog()`. `/submit` (`ResourceSubmission`) is a separate feature. Coming-soon niches have communities too.
  - Routes. `/open-source` is the feed for followed skills, with a niche rail and a “My contributions” link. `/open-source/[slug]` has Contributions, Contributors, and a Maintainers tab that only moderators see. `/open-source/[slug]/contribute` is the form: text, an uploaded image or an image link, and source links. `/open-source/[slug]/c/[id]` is the post. A published post has one question per learner, and the author writes one answer. There is no thread, no likes, and no view count. `/open-source/me`, `/open-source/me/[id]`, and `/open-source/me/[id]/edit` are the author’s pages. `/open-source/review` and `/open-source/review/[id]` are the review queue. `/admin/community` is admin only. `/profile/[userId]` has an Open Source section.
  - Roles. `ADMIN` reviews and moderates everywhere and grants either role. A `MAINTAINER` (`CommunityRole`) reviews and moderates one niche and grants or revokes reviewers there. A `REVIEWER` reviews one niche. Nobody reviews their own contribution or changes their own role. Granting a role someone holds is a no-op success. Rules live in `lib/services/community/permissions.ts`. Pages check them and return `notFound()`. Every action checks again in the service.
  - Review. Approve publishes (`OPEN` → `MERGED`). Reject keeps it off the list (`OPEN` → `CLOSED`) and needs a reason and a note. The review page shows the link check and possible duplicates. Those notes do not publish the post. The form carries the revision the reviewer saw. The write only applies if the status and revision still match, otherwise “This contribution changed since you opened it…”. After a decision the reviewer lands on the next waiting item. The sidebar shows Review with an open count to admins and role holders, computed on the request.
  - Author. Edit is allowed while the post is waiting and returns it to `OPEN` with revision + 1. Editing a published one warns first, takes it off the public list, and sends it back to review. Withdraw closes a waiting one. `CLOSED` is final.
  - Hide. Maintainers and admins only. A published post becomes `CLOSED` with a reason. `/admin/community` lists the last 20.
  - Cache. Published lists, member counts, contributors, and contributor profiles use `use cache` with the `community` tag. Every write that changes them calls `invalidateCommunity()`. Questions on a post stay on the request. The review queue, the sidebar count, the author’s pages, the maintainers panel, and `/admin/community` are per request.
- Creator studio (`/creator`) is where a signed-in person uploads a video they own, keeps the draft, and sends it for review. Admin approval at `/admin/creator` marks it live. A live video joins that niche’s clip feed and the public profile at `/profile/[userId]`. The studio shows that creator’s views, watch time, and how many plays reached most of the video. Those numbers stay off the feed and off the profile. Replacing the file on a live video sends it back to review. A creator rating and earnings are not part of the product. Publishing, withdrawing, or editing a live video calls `invalidateCatalog()`.
- Learner map lives on the Nearby page (`/nearby`, Learners tab). `/map` redirects there. Settings stores a city, a country, and the city-centre coordinates, plus “Show me on the learner map”. Saving a city before onboarding creates a profile with placeholder path fields. The map never receives names or one pin per person, and it never reads GPS. Cities under `MAP_MIN_LEARNERS` (default 5) are omitted. A niche filter puts followed niches first; that order is personal and stays outside the cache. City totals use `use cache`, `cacheLife("hours")`, and `MAP_TAG`. Saving a city or the toggle calls `invalidateMap()`. Nominatim search uses `use cache`, `cacheLife("days")`, and `GEOCODE_TAG`. In development the totals are read fresh so `scripts/map-demo.ts` shows up on refresh. That script refuses to run in production or against a database that is not on this machine. Clustering lives in `app/(app)/map/_components/MapCanvas.tsx`. The geocoding cache lives in `lib/geo/nominatim.ts`.
- Nearby events (`/nearby/events`) reuse that map, the saved city, and the niche filter. The map opens on that city. Ticketmaster pins use the venue coordinates. Google events have no coordinates, so each venue is geocoded and cached; a miss stays off the map instead of sitting on the city centre. Pins cluster when zoomed out. Cards show the event photo with the title on the picture. They sit beside the map and below it on a phone. Clicking a pin highlights its card and the other way around. Filters are niche (followed first), this week / this month / next 3 months, and 25/50/100/200 km. Online events are a separate list. A missing city shows a Settings card and still lists online events. Each card is a link. There is no booking or RSVP.
- Event sources sit behind one adapter each: Ticketmaster Discovery (`TICKETMASTER_API_KEY`, 5,000 calls a day in code), Google Events via SerpApi (`SERPAPI_API_KEY`, hard cap 200 searches a month in code), and community submissions. Google retired the separate Events tab in September 2026, so the SerpApi call is a normal Google search (`engine=google`) and the events carousel comes back as `events_results`. A card with no ticket link opens a Google search for that title. A missing key turns that source off, and the page only names connected sources. Keywords for the three live paths are in `lib/events/keywords.ts`. Any other niche searches on its name.
- Free visitors never call those APIs. Rows are saved per city and niche and refreshed at most every 12 hours (`EVENTS_TTL_HOURS`). A stale pair refreshes in the background after the page responds. `GET /api/cron/events` with `Authorization: Bearer <CRON_SECRET>` refreshes the most popular city and niche pairs (`EVENTS_CRON_PAIRS`). Usage is counted in `ApiUsage`. Live search (any keyword and city, not saved) is `canUseLiveSearch()` in `lib/events/access.ts`. Only an admin can use it until payments exist. Everyone else sees “Premium · coming soon”.
- Community events: any signed-in learner submits one, at most 3 a day. Admins and that niche’s Open Source reviewers approve or reject it, using `canReviewContribution`. Pending events stay off the public list. Writes that change the public list call `invalidateEvents()`. The list itself uses `use cache`, `cacheLife("hours")`, and `EVENTS_TAG` in production. The learner’s city, the followed-niche order, and live-search permission stay on the request. Development reads events fresh.

Not wired:

- A certificate is issued only when every stage on the path is passed, so a free path cannot earn one while the last three stages stay locked.
- Stripe stays a preview and out of the main nav. There is no leaderboard and no peer review. A creator rating and earnings are not part of the product. Notes from an accepted explain-back idea are stored at `/notes`, can be downloaded as Word or PDF, and a stage can be summarized from those notes alone. Those notes are not turned into lessons. A transcript at `/transcript/[userId]/[skillSlug]` lists the stages this learner has passed, with the real dates, and downloads as PDF. A certificate at `/certificate/[userId]/[skillSlug]` appears only when every stage on that path is passed. It is SkillFlow’s own record and is not a license or a degree. A passed stage idea comes back twice, 18 hours apart, as a card over the app until the learner writes an answer. A thin answer still opens the app and lowers Retention on Progress. The stage pass stays. Closing the browser is what clears the hold for the next idea.
- `requireLearner()` exists and is not used by pages. `requireAdmin()` is: no session goes to `/login`, any other role gets `notFound()`.

## Stack facts that are easy to get wrong

- Next.js 16.3.4, React 19.2.8, Tailwind v4, Prisma 6.19.3, NextAuth v5 beta.32. `trustHost: true`. Sessions are JWT. Credentials needs JWT. Do not describe database sessions or a finished Google button. Google is configured in `lib/auth.ts` only.
- `cacheComponents` is on in `next.config.ts`. Shared niches, stages, resources, the niche grid, lesson screens, clips, and the submit picker use `use cache` with the `catalog` tag. Merged community lists, member counts, gaps, the changelog, contributors, and contributor profiles use the `community` tag. Learner-map city totals use the `learner-map` tag. Nominatim city search uses the `geocode` tag. Saved nearby events use the `nearby-events` tag. Text read from a public page for a practice note uses the `practice-source` tag. The niches page shows 32 cards at a time in the browser, so the page number is not a cache key. Home and the roadmap index reuse a cached teaser of the first rows. Admin catalog saves and an approved submission call `updateTag`. Progress, streaks, settings, joined state, and “N new” stay on the request. The account menu streams beside that shell. A learner’s own city and map toggle stay on the request.
- `proxy.ts` exports `export const proxy = auth(...)`. `middleware.ts` was deleted. Do not restore it. The proxy only checks that someone is signed in.
- Postgres database name is `skillflow` on localhost:5432. `prisma.config.ts` loads `.env` with dotenv because Prisma 6 does not.
- Migrations through `20261001104500_creator_studio` are applied, plus the `community_unmerge_flag` migration that adds `ContributionReview.unmerge`, `20261005193000_learner_map` for the opt-in city, and `20261005220000_nearby_events` for saved events. Do not create a migration unless the schema changes. Do not run `prisma migrate reset`.
- `tsx` top-level await fails under CommonJS. Wrap scripts in `async function main()`. PowerShell has no `&&` and no bash heredoc. It also eats `$disconnect` inside `tsx -e`. Use a temp script, then delete it.
- Full-repo `eslint` still fails on older files. Lint the files you touched. `tsc --noEmit` and `next build` are the project checks.
- Do not start a second `npm run dev` if one is already answering on port 3000.
- Known failure strings, left in on purpose: catalog title `fail this save`, settings name `fail this save`, submit title `fail this submit`, review notes `fail this review`, creator title `fail this upload`, Open Source review feedback `fail this merge`.
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
