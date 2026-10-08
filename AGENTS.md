<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# SkillFlow — context for a new chat

Read this after the Next.js block. `Project-roadmap.md` is the phase list. `README.md` is how to run the app. The files in `content/catalog/_review/` are generated link-check reports. Do not rewrite them by hand.

Last aligned with the working tree on 8 October 2026: after the UI polish, legal pages, Google sign-in, the new onboarding, the career-fit test, the Home and profile rebuild, the activity heatmap, the landing Clips showcase, the Catalog CMS, display names and profile photos, and the `/uploads` route. `HANDOFF.md` is the self-contained brief for testing and deployment work.

## What this product is

SkillFlow is a mastery-first learning app. A learner follows a skill, opens a stage of real external resources, and passes an explain-back before the stage is recorded. Version 1 grades a real stage one idea at a time. There is no quiz. A learner can also bring their own resource and get an explain-back gate prompt for it (Version 2 preview). Thirty paths are free, including every stage, so finishing a path can earn the certificate. The next stage opens only after the explain-back on the current one is passed.

There are no comments, likes, or view counts. Premium is one Stripe subscription. It opens the niches outside the thirty free paths, and it lets the learner appear on the learner map. The map itself, nearby events, the thirty paths, and explain-back stay free.

## Free paths and Premium niches

Thirty paths are free and available to everyone. The list is `FREE_PATH_SLUGS` in `lib/niches/tiers.ts`. All thirty have catalogs. Do not invent catalogs for Premium niches.

A stage is structurally open when the skill is `AVAILABLE`, the offer is `FREE`, and the stage is not monetized. `LOCKED_TAIL` is 0, so every stage on a free path is open. The real description and resources are sent. A learner who passes every stage can open the certificate.

On top of that, the next stage stays shut for this learner until every earlier open stage has a passed explain-back. A stage they already passed stays open. That check is personal: it lives in `loadCatalog`, `getLesson`, the milestone, and the explain-back write. It is not inside `"use cache"`. The sentence is "Pass the previous stage to open this one." A stage waiting on that pass still shows its title, photo, and description, with a lock.

Every slug outside that list is Premium: `AVAILABLE`, `MONETIZED`, and zero stages. A free account sees Premium and cannot open the roadmap. A subscriber, and an admin, can open it and follow it. There are still no stages. Do not invent resources. The label is the lock until Stripe marks the subscription active or trialing.

| Slug | Name | Live status | Offer | Flagship | Stages | Resources | Needs review | Explain-backs |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `full-stack-web-dev` | Full-Stack Web Development | AVAILABLE | FREE | yes | 12 | 64 | 17 | 12 |
| `travel-vlogging` | Travel Vlogging | AVAILABLE | FREE | yes | 8 | 46 | 9 | 8 |
| `content-creation` | Content Creation | AVAILABLE | FREE | yes | 10 | 57 | 13 | 10 |
| `music-production` | Music Production | AVAILABLE | FREE | no | 8 | 45 | 9 | 8 |
| `self-grooming` | Self Grooming | AVAILABLE | FREE | no | 8 | 47 | 15 | 8 |
| `animation` | Animation & VFX | AVAILABLE | FREE | no | 8 | 41 | 11 | 8 |
| `iot-robot-automation` | IoT & Robot Automation | AVAILABLE | FREE | no | 8 | 46 | 11 | 8 |
| `screenwriting` | Screenwriting | AVAILABLE | FREE | no | 8 | 21 | 3 | 8 |
| `graphic-design` | Graphic Design | AVAILABLE | FREE | no | 8 | 18 | 3 | 8 |
| `seo` | SEO | AVAILABLE | FREE | no | 8 | 15 | 3 | 8 |
| `ai-tools` | AI Tools | AVAILABLE | FREE | no | 8 | 15 | 3 | 8 |
| `cybersecurity` | Cybersecurity | AVAILABLE | FREE | no | 8 | 47 | 11 | 8 |
| `digital-marketing` | Digital Marketing | AVAILABLE | FREE | no | 8 | 44 | 8 | 8 |
| `personal-finance` | Personal Finance | AVAILABLE | FREE | no | 8 | 45 | 15 | 8 |
| `public-speaking` | Public Speaking | AVAILABLE | FREE | no | 8 | 44 | 9 | 8 |
| `sound-design` | Sound Design | AVAILABLE | FREE | no | 8 | 24 | 3 | 8 |
| `nutrition` | Nutrition | AVAILABLE | FREE | no | 8 | 22 | 3 | 8 |
| `psychology` | Psychology | AVAILABLE | FREE | no | 8 | 13 | 3 | 8 |
| `podcasting` | Podcasting | AVAILABLE | FREE | no | 8 | 12 | 2 | 8 |
| `guitar` | Guitar | AVAILABLE | FREE | no | 8 | 10 | 3 | 8 |
| `chess` | Chess | AVAILABLE | FREE | no | 8 | 10 | 1 | 8 |
| `art-painting` | Art & Painting | AVAILABLE | FREE | yes | 8 | 43 | 11 | 8 |
| `photography` | Photography | AVAILABLE | FREE | no | 8 | 41 | 13 | 8 |
| `emergency-preparedness` | Emergency Preparedness | AVAILABLE | FREE | no | 8 | 40 | 13 | 8 |
| `badminton` | Badminton | AVAILABLE | FREE | no | 8 | 41 | 13 | 8 |
| `relationships` | Relationships | AVAILABLE | FREE | no | 8 | 11 | 1 | 8 |
| `socializing` | Socializing | AVAILABLE | FREE | no | 8 | 8 | 1 | 8 |
| `interior-design` | Interior Design | AVAILABLE | FREE | no | 8 | 8 | 0 | 8 |
| `freelancing` | Freelancing | AVAILABLE | FREE | no | 8 | 8 | 0 | 8 |
| `travel-planning` | Travel Planning | AVAILABLE | FREE | no | 8 | 8 | 0 | 8 |

Every stage on a free path is structurally open. The next one still waits until the previous explain-back is passed.

**Art & Painting** (`art-painting`) is imported and stays a flagship. Two resources are marked for review and their URLs stay until a working page is chosen: `https://www.acmiart.org/acmi-seals` (404) and `https://www.ucl.ac.uk/slade/know/1818` (502 to the checker). Do not delete the file. Do not swap those links.

**Photography** (`photography`) is imported and is not a flagship. One resource is marked for review and its URL stays: `https://www.nikon.co.uk/en_GB/learn-and-explore/magazine/tips-and-tricks/understanding-focal-length` (404). Do not swap that link.

**Emergency Preparedness** (`emergency-preparedness`) is imported and is not a flagship. One resource is marked for review and its URL stays: `https://ndma.gov.in/Natural-Hazards/Earthquakes/Dos-Donts` (404). Do not swap that link.

**Badminton** (`badminton`) is imported and is not a flagship. One resource is marked for review and its URL stays: `https://dlgsc.wa.gov.au/sport-and-recreation/sports-dimensions-guide/badminton` (404). Do not swap that link.

These pages returned HTTP 403 to the checker. The text was already read, so the URLs stay. A 403 is a manual check, not a reason to replace the link: Relationships uses the RAINN consent page; Interior Design uses the Pima elements chapter and the Boise State principles chapter; Travel Planning uses the four State Department pages (planning, checklist, STEP, and insurance); AI Tools uses the OWASP prompt-injection page.

The niche list is `BASE_SKILLS` in `prisma/seed.ts` plus `EXTRA_NICHES` in `lib/niche-catalog.ts`. Travel Vlogging is a base skill. It must not also appear in `EXTRA_NICHES`, or a future seed will clear the flagship flag. `seedOffer` follows `isFreePath`. Do not run the full seed. Settings can follow a free path. A Premium path can be followed only while Premium is active. An admin can follow one without a charge.

## Catalog files

| Live slug | File |
| --- | --- |
| `full-stack-web-dev` | `content/catalog/full-stack-web-development.json` |
| `content-creation` | `content/catalog/content-creation.json` |
| `travel-vlogging` | `content/catalog/travel-vlogging.json` |
| `music-production` | `content/catalog/music-production.json` |
| `self-grooming` | `content/catalog/self-grooming.json` |
| `animation` | `content/catalog/animation.json` |
| `iot-robot-automation` | `content/catalog/iot-robot-automation.json` |
| `screenwriting` | `content/catalog/screenwriting.json` |
| `graphic-design` | `content/catalog/graphic-design.json` |
| `seo` | `content/catalog/seo.json` |
| `ai-tools` | `content/catalog/ai-tools.json` |
| `cybersecurity` | `content/catalog/cybersecurity.json` |
| `digital-marketing` | `content/catalog/digital-marketing.json` |
| `personal-finance` | `content/catalog/personal-finance.json` |
| `public-speaking` | `content/catalog/public-speaking.json` |
| `sound-design` | `content/catalog/sound-design.json` |
| `nutrition` | `content/catalog/nutrition.json` |
| `psychology` | `content/catalog/psychology.json` |
| `podcasting` | `content/catalog/podcasting.json` |
| `guitar` | `content/catalog/guitar.json` |
| `chess` | `content/catalog/chess.json` |
| `art-painting` | `content/catalog/art-painting.json` |
| `photography` | `content/catalog/photography.json` |
| `emergency-preparedness` | `content/catalog/emergency-preparedness.json` |
| `badminton` | `content/catalog/badminton.json` |
| `relationships` | `content/catalog/relationships.json` |
| `socializing` | `content/catalog/socializing.json` |
| `interior-design` | `content/catalog/interior-design.json` |
| `freelancing` | `content/catalog/freelancing.json` |
| `travel-planning` | `content/catalog/travel-planning.json` |

`FILE_BY_SLUG` in `scripts/import-catalog.ts` and `scripts/verify-catalog.ts` maps only the Full-Stack mismatch. Do not rename the live slug `full-stack-web-dev`. Animation & VFX was researched as `animation-vfx`. The live slug is `animation`. Do not rename it.

The Full-Stack and Travel JSON files say `"status": "COMING_SOON"`. That is the researched file. The live rows are `AVAILABLE`. The importer writes the skill name and description only. It does not set status, offer, image, or `isFlagship`. Content Creation's file says `AVAILABLE` because that override was written into the file. Do not "fix" a file status and expect the database to change.

Catalog `note:` lines have no column. Omit them from the JSON and the database. Zod strips unknown keys.

`[CONFIRM]` resources are stored with `needsReview: true`. If a link check fails, report it. Do not swap the URL.

YouTube ids on videos come from `?v=`. `lib/playable-src.ts` turns a watch, youtu.be, shorts, or embed URL into `https://www.youtube-nocookie.com/embed/ID?autoplay=1`. The lesson player and the clip feed both use it. Do not put a raw watch URL in an iframe.

Stage photos are `RoadmapStage.image`. Every stage on all thirty free paths has one, committed under `public/stages/<slug>/<order>.jpg` (1280×720). The credits are in `public/stages/credits.json`. `scripts/fetch-stage-photos.ts` picked them from Openverse (CC0 and public domain, or Pexels when `PEXELS_API_KEY` is set), copied the older `/uploads` photos of the big three, and set `RoadmapStage.image` to `/stages/...`. The search words are in `scripts/stage-photo-queries.json`. The importer omits `image`, so a reimport does not wipe photos. Skill cover images live in `public/skills/` and are committed.

## How to load a catalog

The importer is server-only. Dry-run first. Apply only after the dry-run touches that skill alone.

```bash
npx tsx scripts/verify-catalog.ts <slug>
npx tsx --conditions=react-server scripts/import-catalog.ts <slug>
npx tsx --conditions=react-server scripts/import-catalog.ts <slug> --apply
```

A second dry-run should print "Nothing to change." `--from-db` checks rows already stored and can mark a dead link `UNAVAILABLE`. It writes `content/catalog/_review/<file>.from-db.md`. Use it only when asked. A 403 or a bot challenge is "needs manual check", not a failure, and is not a reason to replace the link.

Do not run `npx prisma db seed`. The seed resets admin passwords and rewrites every niche. After a catalog apply, set status, offer, and `isFlagship` with a targeted Prisma update. `seedStatus` returns `AVAILABLE`. `seedOffer` returns `FREE` when the slug is in `FREE_PATH_SLUGS`, and `MONETIZED` otherwise. The seed imports the live catalogs, including Animation, IoT, Screenwriting, Graphic Design, SEO, AI Tools, Cybersecurity, Digital Marketing, Personal Finance, Public Speaking, Sound Design, Nutrition, Psychology, Podcasting, Guitar, Chess, Art & Painting, Photography, Emergency Preparedness, Badminton, Relationships, Socializing, Interior Design, Freelancing, and Travel Planning. The dead links named above stay in those files until a working page is chosen.

## What is wired, and what is not

Wired to Postgres:

- Niches, roadmaps, lessons, and clips read `Skill`, `RoadmapStage`, and `Resource`.
- Activity heatmap: `loadActivity` (`lib/activity.ts`) counts one learner's contributions per UTC day for 12 months across stages passed, ideas explained (stage notes), practice notes, recall answers, Open Source contributions, questions asked or answered, suggested resources, uploaded videos, and submitted events, and returns the heatmap plus a per-kind breakdown. Counts only. It is shown on Home (Your activity) and on `/profile/[userId]`, both per request. Others see it only while `LearnerProfile.showActivity` is on (default on, Settings → Profile visibility); the owner always sees it. `buildHeatmap` takes the noun, so Open Source keeps "merged contributions".
- Profile (`/profile/[userId]`): cover and avatar, name, headline, member since, paths followed, published count, role chips, six totals (contributions this year, active days, streaks, stages passed, certificates), the heatmap, Learning (followed paths with photo, passed of total, mastery, certificate link), Videos, and Open Source. Progress and activity come from `loadProfileOverview` (`lib/data/profile.ts`) on the request; creator works and Open Source lists stay on their caches. The owner gets Edit profile and Profile answers.
- Landing Clips showcase (`components/landing/ReelShowcase.jsx`, `#clips`, after the problem section): niche tabs over a phone-sized reel of real catalog clips from `loadLandingReels` (`lib/data/landing-reels.ts`, `use cache`, `catalog` tag, stage photos as posters). The privacy-enhanced YouTube player loads only when a visitor presses play.
- Home, top to bottom: the career-fit card, the streak and Continue banner, At a glance and Your activity (the contribution heatmap) (current streak, stages passed of all followed stages, passed this week, average mastery, notes saved, retention, and a seven-day explain-back chart), one lane per followed path with the stage photos, For you (mastery by path, stages that need another look, recent notes, saved events near the learner's city for followed paths, recent Open Source contributions in followed niches with the new count, transcripts and certificates), Explore, and the free-plan line. At a glance and For you live in `components/dashboard/HomeSections.tsx`; their data is `getDashboardData` plus `loadHomeExtras` in `lib/data/home.ts`, all per request. Events are read from rows already saved for Nearby; Home never calls an event API.
- Home shows one row per followed skill. Follow is the `UserSkillProgress` row. Niches, Home, and Paths put Follow or Following on each open niche. Following toggles off and keeps explain-back history. Saving a personal plan follows that path. Onboarding still follows the paths chosen there. Settings no longer adds or removes niches. A Premium path cannot be followed without Premium. A profile lists how many niches that account follows, and their names.
- A niche card links to `/roadmap/[slug]` only when the skill is available and has stages. A Premium card says Premium. A free account opens `/upgrade` from that card. A subscriber opens the roadmap. The Open filter on `/skills` is the free paths. Home (one quiet line at the bottom), the Paths index, and Settings tell a free account what Premium adds. Niches does not repeat it. The account menu links to Upgrade. An admin already counts as Premium, so those prompts stay off.
- Catalog CMS (`/admin/catalog`) is admin only. It is reached from the account menu (Admin CMS), not the sidebar. The page is driven by the URL: `?niche=<slug>` opens a niche on its Stages tab, `&tab=details` opens its details, `&stage=<id>` or `&stage=new` opens a stage, and `&resource=<id>` or `&resource=new` opens a resource; `?create=niche` is a new niche. The left pane lists every niche with search and filters (All, Free paths, Premium, Needs review, Coming soon). Forms are plain sections (no wizard) with labels, hints, inline errors, and a sticky save bar; objectives, rubric lines, key points, and caption languages are edited as rows that can be added, moved, and removed, and are still stored as newline text. Create, edit, reorder, and delete work for niches, stages, and resources. Deletes are guarded because the schema cascades: a free path, or a niche with stages, followers, contributions, creator videos, or events, cannot be deleted (set it to Coming soon instead); a stage with any completion, explain-back attempt, or note cannot be deleted. A new stage is appended to the end of the path. The slug is fixed after creation. A stage photo may be a committed `/stages/<slug>/<n>.jpg` path (`storedImage` in `lib/stored-source.ts`). Needs review is a filter in the niche list and a checkbox on the resource list. Every write calls `invalidateCatalog()`.
- Submit writes `ResourceSubmission`. Admin approval creates a `Resource`. Reject stores a note.
- Display name and profile photo: `User.name` is the display name and `User.image` the photo, everywhere (account menu, profile, Open Source, clip feed). Onboarding's first step and Settings → Profile share one save, `saveProfileIdentity` in `lib/data/settings.ts`. The name is required, 2–50 characters, and never an email address (`displayNameProblem` in `lib/profile-identity.ts`); onboarding offers an empty field when the stored name is the email or its first half (`suggestedDisplayName`). The photo choice is `keep`, `none` (initial), `upload` (an existing `/uploads` image via `ProfilePhotoPicker` and `uploadLocalFile`), or `avatar` (a style and seed). Generated avatars are plain code in `lib/avatar.ts` (Face, Shapes, Rings, Pixels; deterministic from the seed, no package); the browser previews the SVG, and the server draws it again from the style and seed (never from client SVG) and stores a 256px PNG through `next/og` in `lib/avatar-render.tsx`. A save drops the `account:<id>` tag, the `community` tag, and the `catalog` tag only when that person has a live creator video (the clip feed shows creator names). Google sign-in sets `User.image` only when it is empty. Email does not change here. Theme and accent apply immediately. The ten color presets stay. Spectrum is an eleventh preset: one neighboring pair of hues drifts around the wheel on a 96-second loop. The surfaces stay as dark as the other presets, the type stays white, and the tint is only a soft shift. Reduced motion holds one hue. A custom gradient is `custom:#start:#end` on `LearnerProfile.accent` and the `skillflow-accent` cookie. The palette, hex, and RGB fields live on Settings and onboarding. That choice is personal: it is not part of the catalog cache, and saving it does not call `invalidateCatalog()`.
- Explain-back on a real stage is a step wizard, one learning objective at a time. The ideas are written from that stage’s resources the first time the gate opens, and again when those resources change. Every key point is kept. A page the site blocks is skipped. With no model key, the questions already in the catalog stay. Each step sends that idea to Gemini’s free tier (`GEMINI_API_KEY`, `gemini-flash-lite-latest`). `OPENAI_API_KEY` is the paid fallback when that key is empty. An empty answer stays on the step. A wrong or thin answer stays on the step and shows a written review. A sound answer shows a written review too, then the next idea, and that idea is stored as a `LearnerNote` (the explanation and the review). Notes are personal and stay on the request. `/notes` is in the sidebar. Opening Notes also keeps a pass that was recorded before notes existed. The stage is recorded only after every idea has passed: one `ExplainBackAttempt` and `StageCompletion.explainBackPassed`. The next stage stays shut until this one is passed. Every stage on a free path can be passed. With no key, a timeout, or a reply that is not a review, nothing is saved. The preview id `__explain_input__` still uses the mock walkthrough. `/notes/practice` grades an idea against a third-party page, a dropped text file, or pasted text, and stores a practice note when it holds. The page text is read on the server and cached for every learner under `practice-source`. The note itself is personal. It does not pass a stage, write a `Resource`, or call `invalidateCatalog()`. Every free path can have one personal plan: preferences live on `LearningPlan`, and plain code builds the schedule from that path’s stages. The setup is on that path’s roadmap, including paths that are not followed yet. Saving the plan follows the path. The roadmap shows the weeks and links each one into the stage. Gemini only turns a learning description into those preferences, or suggests resource tags for an admin to review. Undo on the roadmap hides that schedule and shows the shared stages again. It does not change those stages or their resources. While the plan is on, opening a stage lists the selected resources in that order and marks the extra ones Optional.
- Career-fit test (`/career-test`, report at `/career-test/report`, PNG at `/career-test/report/image`). It is not part of onboarding: Home shows a card above everything else (`components/dashboard/CareerTestCard.tsx`) that invites, resumes, or links to the report. Two published instruments, item text copied word for word into `lib/career/items.ts` (generated, do not edit): the IPIP-NEO-120 (Johnson, 2014; public domain; 30 facets of 4 items, 55 reverse-keyed) on a 1–5 accuracy scale, and the O*NET Interest Profiler Short Form (USDOL/ETA, CC BY 4.0, with the required attribution on the report and image) on the 0–4 web scale, 10 items per RIASEC area, in the official order, with the two items revised in 2018. Do not reword, reorder, or add items. 18 pages of ten, saved after every page to `CareerAssessment.answers` (one row per learner, cleaned by `cleanAnswers`). Scoring is plain code in `lib/career/score.ts` (unit-tested): facet 4–20, domain 24–120, area 0–40, bands at 35% and 65% of the scale; scores are never described as percentiles or compared with a population. Path fit is SkillFlow's own map in `lib/career/meta.ts` (`PATH_FIT`, every free path, three Holland areas plus helpful traits): 80% interest, 20% traits. `writeReport` sends only scores, onboarding context, and the top five paths with their real first three stage titles to Gemini (`askModelJson`), parses with the lenient `lib/career/report-schema.ts`, and falls back to `rulesReport` in plain code. The model never sees answers, names, or emails. Everything here is personal: read on the request, never cached, no `invalidateCatalog()`. The PNG is drawn with `next/og` `ImageResponse` and sent `private, no-store`; the JPG is made in the browser from that PNG on a canvas, so no image package is imported. Retake and Delete my results both delete the row. It is self-discovery, not a clinical assessment or career counselling, and the copy says so.
- The quiz feature was dropped on 1 October 2026. The explain-back gate is the only mastery check. The `Quiz`, `QuizQuestion`, and `QuizAttempt` tables and `StageCompletion.quizPassed` are still in the schema because the database was not changed. Nothing reads or writes them. Do not build on them.
- Progress, analytics, and home read explain-back attempts. Mastery for a skill is the share of its stages with a passed explain-back. A passed stage is 100 on the lane. A streak day is a UTC day with a saved explain-back or a saved note. The current run stays alive through today and yesterday, and a gap sets it back to 0. The longest run is kept. Those reads stay on the request. Saving a streak or a mastery percent does not call `invalidateCatalog()`. With no attempts, the numbers are zero. The charts are not a mock learner with a streak of 12.
- Open Source is a post a learner submits. A moderator publishes it, and only then is it public. The stored status for a published post is still `MERGED`. Community content never goes into `Resource`, `RoadmapStage`, or any catalog table, and community writes never call `invalidateCatalog()`. `/submit` (`ResourceSubmission`) is a separate feature. Coming-soon niches have communities too.
  - Routes. `/open-source` is the feed for followed skills, with a niche rail and a “My contributions” link. `/open-source/[slug]` has Contributions, Contributors, and a Maintainers tab that only moderators see. `/open-source/[slug]/contribute` is the form: text, an uploaded image or an image link, and source links. `/open-source/[slug]/c/[id]` is the post. A published post has one question per learner, and the author writes one answer. There is no thread, no likes, and no view count. `/open-source/me`, `/open-source/me/[id]`, and `/open-source/me/[id]/edit` are the author’s pages. `/open-source/review` and `/open-source/review/[id]` are the review queue. `/admin/community` is admin only. `/profile/[userId]` has an Open Source section.
  - Roles. `ADMIN` reviews and moderates everywhere and grants either role. A `MAINTAINER` (`CommunityRole`) reviews and moderates one niche and grants or revokes reviewers there. A `REVIEWER` reviews one niche. Nobody reviews their own contribution or changes their own role. Granting a role someone holds is a no-op success. Rules live in `lib/services/community/permissions.ts`. Pages check them and return `notFound()`. Every action checks again in the service.
  - Review. Approve publishes (`OPEN` → `MERGED`). Reject keeps it off the list (`OPEN` → `CLOSED`) and needs a reason and a note. The review page shows the link check and possible duplicates. Those notes do not publish the post. The form carries the revision the reviewer saw. The write only applies if the status and revision still match, otherwise “This contribution changed since you opened it…”. After a decision the reviewer lands on the next waiting item. The sidebar shows Review with an open count to admins and role holders, computed on the request.
  - Author. Edit is allowed while the post is waiting and returns it to `OPEN` with revision + 1. Editing a published one warns first, takes it off the public list, and sends it back to review. Withdraw closes a waiting one. `CLOSED` is final.
  - Hide. Maintainers and admins only. A published post becomes `CLOSED` with a reason. `/admin/community` lists the last 20.
  - Cache. Published lists, a published post, member counts, contributors, and contributor profiles use `use cache` with the `community` tag. Every write that changes them calls `invalidateCommunity()`. Questions on a post stay on the request. The review queue, the sidebar count, the author’s pages, the maintainers panel, and `/admin/community` are per request.
- Creator studio (`/creator`) is where a signed-in person uploads a video they own, keeps the draft, and sends it for review. Admin approval at `/admin/creator` marks it live. A live video joins that niche’s clip feed and the public profile at `/profile/[userId]`. The studio shows that creator’s views, watch time, and how many plays reached most of the video. Those numbers stay off the feed and off the profile. Replacing the file on a live video sends it back to review. A creator rating and earnings are not part of the product. Publishing, withdrawing, or editing a live video calls `invalidateCatalog()`.
- Learner map lives on the Nearby page (`/nearby`, Learners tab). `/map` redirects there. Settings stores a city, a country, and the city-centre coordinates. Saving a city is free, so Nearby can open on it. “Show me on the learner map” is Premium. The public count includes only admins and accounts with an active or trialing subscription. Saving a city before onboarding creates a profile with placeholder path fields. The map never receives names or one pin per person, and it never reads GPS. Cities under `MAP_MIN_LEARNERS` (default 5) are omitted. A niche filter puts followed niches first; that order is personal and stays outside the cache. City totals use `use cache`, `cacheLife("hours")`, and `MAP_TAG`. Saving a city, the toggle, or a subscription change calls `invalidateMap()`. Nominatim search uses `use cache`, `cacheLife("days")`, and `GEOCODE_TAG`. In development the totals are read fresh so `scripts/map-demo.ts` shows up on refresh. That script refuses to run in production or against a database that is not on this machine. Clustering lives in `app/(app)/map/_components/MapCanvas.tsx`. The geocoding cache lives in `lib/geo/nominatim.ts`.
- Nearby events (`/nearby/events`) reuse that map, the saved city, and the niche filter. The map opens on that city. Ticketmaster pins use the venue coordinates. Google events have no coordinates, so each venue is geocoded and cached; a miss stays off the map instead of sitting on the city centre. Pins cluster when zoomed out. Cards show the event photo with the title on the picture. They sit beside the map and below it on a phone. Clicking a pin highlights its card and the other way around. Filters are niche (followed first), this week / this month / next 3 months, and 25/50/100/200 km. Online events are a separate list. A missing city shows a Settings card and still lists online events. Each card is a link. There is no booking or RSVP.
- Event sources sit behind one adapter each: Ticketmaster Discovery (`TICKETMASTER_API_KEY`, 5,000 calls a day in code), Google Events via SerpApi (`SERPAPI_API_KEY`, hard cap 200 searches a month in code), and community submissions. Google retired the separate Events tab in September 2026, so the SerpApi call is a normal Google search (`engine=google`) and the events carousel comes back as `events_results`. A card with no ticket link opens a Google search for that title. A missing key turns that source off, and the page only names connected sources. Keywords for every free path are in `lib/events/keywords.ts`. Any other niche searches on its name.
- Free visitors never call those APIs. Rows are saved per city and niche and refreshed at most every 12 hours (`EVENTS_TTL_HOURS`). A stale pair refreshes in the background after the page responds. `GET /api/cron/events` with `Authorization: Bearer <CRON_SECRET>` refreshes the most popular city and niche pairs (`EVENTS_CRON_PAIRS`). Usage is counted in `ApiUsage`. Live search (any keyword and city, not saved) is `canUseLiveSearch()` in `lib/events/access.ts`. It is part of Premium. An admin can use it without a charge. A free account sees a link to `/upgrade`. Every free path has its own search words in `lib/events/keywords.ts`. Any other niche searches on its name.
- Community events: any signed-in learner submits one, at most 3 a day. Admins and that niche’s Open Source reviewers approve or reject it, using `canReviewContribution`. Pending events stay off the public list. Writes that change the public list call `invalidateEvents()`. The list itself uses `use cache`, `cacheLife("hours")`, and `EVENTS_TAG` in production. The learner’s city, the followed-niche order, and live-search permission stay on the request. Development reads events fresh.

Also wired, with these limits:

- Notes from an accepted explain-back idea are stored at `/notes`, can be downloaded as Word or PDF, and a stage can be summarized from those notes alone. Those notes are not turned into lessons.
- A transcript at `/transcript/[userId]/[skillSlug]` lists the stages this learner has passed, with the real dates, and downloads as PDF. Progress links to it after the first pass on a followed path.
- A certificate at `/certificate/[userId]/[skillSlug]` appears only when every stage on that path is passed. A free path can earn one. It is SkillFlow’s own record and is not a license or a degree.
- A passed stage idea comes back twice, 18 hours apart, as a card over the app until the learner writes an answer. A thin answer still opens the app and lowers Retention on Progress. The stage pass stays. Closing the browser is what clears the hold for the next idea.
- Onboarding (`/onboarding`, `components/onboarding/OnboardingWizard.jsx`) is eight steps: how others see you (display name and photo, above), about you (age range, current stage, an optional headline), city (optional, the same Nominatim search and `saveMapCity` as Settings), paths (any of the thirty free paths, search and group filter, up to five), goals (several) and experience, time (pace, hours a week, formats, languages; formats and languages take several), accent, and a summary. Every choice and its validation live in `lib/onboarding-options.ts`. Under 13 cannot continue; 13–17 needs the parent-or-guardian box (`guardianConsent`). Saving writes the new `LearnerProfile` columns, keeps `skillSlug` and `goal` as the first path and goal for older screens, and follows every chosen path; it never unfollows. The free-path list for the picker uses the `catalog` cache; the saved answers are per request. A profile without `ageRange` (older accounts, or one made by saving a city first) can still open onboarding; `/onboarding?edit=1` (Settings → Edit profile answers) reopens it for a finished one. The headline shows on `/profile/[userId]`, read on the request. The career-fit test is not part of onboarding. Settings can follow any of the thirty free paths, and a Premium niche while the subscription is active. Pace does not decide which stages are open.
- Event search keywords are set for every free path (`lib/events/keywords.ts`). Every other niche searches on its name. The daily streak reminder is saved on `LearnerProfile`. The bell shows it when yesterday counted and today has not. Saving it does not call `invalidateCatalog()`.
- Stage photos exist for every stage on the thirty free paths, under `public/stages`. Premium niches have no stages and no photos. The importer leaves `image` unset.
- Stripe Checkout is wired at `/upgrade`, which stays out of the main nav. The page compares Free and Premium, and a free account continues to Stripe Checkout. The card form stays on Stripe. `POST /api/stripe/checkout` starts a subscription, `POST /api/stripe/webhook` verifies the signature and writes `Subscription`, and `POST /api/stripe/portal` opens the customer portal. Active and trialing count as Premium. An admin counts as Premium without a charge. Missing keys leave the upgrade page unconfigured and do not pretend a charge happened. The subscription check stays on the request. It is not inside `"use cache"`. The price label is cached for an hour. A failed Stripe read is not stored. Keys are `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_PRICE_ID`, and optional `STRIPE_PRICE_LABEL`.

Not built:

- There is no leaderboard and no peer review. A creator rating and earnings are not part of the product.
- `requireLearner()` exists and is not used by pages. `requireAdmin()` is: no session goes to `/login`, any other role gets `notFound()`.
- There is no production host, no CI, no error monitoring, and no end-to-end test. Uploads live on the server's disk under `public/uploads` (gitignored). `next start` serves only the `public` files that existed at build time, so `app/uploads/[file]/route.ts` serves later uploads (allow-listed names and types, `immutable` caching, byte ranges for video). New niche covers from the CMS are stored there too; the committed covers stay in `public/skills`. More than one server, or a replaced container, needs object storage behind `lib/uploads.ts`. Unit tests cover mastery, streaks, explain-back judging, plans, events, and community rules.
- `next build` passes. Request data (the session, `searchParams`, Premium) stays inside `Suspense` or a `loading.tsx`; the `(app)` layout streams Premium into context with `PublishPremiumAccess`. A new page that awaits request data outside a boundary will break the prerender again.

## Stack facts that are easy to get wrong

- Next.js 16.3.4, React 19.2.8, Tailwind v4, Prisma 6.19.3, NextAuth v5 beta.32. `trustHost: true`. Sessions are JWT. Credentials needs JWT. Do not describe database sessions.
- Google sign-in is live when `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET` are set (`googleAuthEnabled()` in `lib/google-auth.ts`); without them the provider and the buttons are left out. Login and signup show "Continue with Google" / "Sign up with Google" (`components/forms/GoogleButton.tsx`), which lands on `/auth/continue`: onboarding for a new learner, Home otherwise. The `signIn` callback only accepts a Google profile with `email_verified`. Linking is never by email match alone: a signed-out Google sign-in whose email already has a password account is refused (`OAuthAccountNotLinked`, explained on `/login?error=`); the learner logs in with the password and connects Google from Settings → Sign-in, which links to the signed-in user. The `linkAccount` event sets `emailVerified`, and moves an unverified account email to the verified Gmail when no other account uses it. Disconnect is refused when the account has no password. Emails are lowercased on signup and login (`normalizeEmail`). Login and signup are static pages, so a deploy needs the Google keys at build time for the buttons to render.
- `cacheComponents` is on in `next.config.ts`. Shared niches, stages, resources, the niche grid, lesson screens, clips, and the submit picker use `use cache` with the `catalog` tag. Merged community lists, a published post, member counts, gaps, the changelog, contributors, and contributor profiles use the `community` tag. The Stripe price label uses `use cache` for an hour and has no tag. Learner-map city totals use the `learner-map` tag. Nominatim city search uses the `geocode` tag. Saved nearby events use the `nearby-events` tag. Text read from a public page for a practice note uses the `practice-source` tag. The onboarding path picker (`loadFreePaths` in `app/onboarding/page.tsx`) and the landing Clips showcase (`loadLandingReels`) also use the `catalog` tag. The career-fit test, the profile overview, the activity heatmap, and Home's At a glance and For you are personal and stay on the request. The niches page shows 32 cards at a time in the browser, so the page number is not a cache key. Home and the roadmap index reuse a cached teaser of the first rows. Catalog CMS writes and an approved submission call `updateTag`. Progress, streaks, settings, joined state, and “N new” stay on the request. The account menu streams beside that shell. A learner’s own city and map toggle stay on the request.
- `proxy.ts` exports `export const proxy = auth(...)`. `middleware.ts` was deleted. Do not restore it. The proxy only checks that someone is signed in.
- Postgres database name is `skillflow` on localhost:5432. `prisma.config.ts` loads `.env` with dotenv because Prisma 6 does not.
- Migrations: the 24 folders in `prisma/migrations`, `20260923010253_init` to `20261008190000_contribution_review_unmerge`, all applied. The last one adds `ContributionReview.unmerge` with `IF NOT EXISTS` (it was in the schema without a migration file). A fresh database from `prisma migrate deploy` matches `schema.prisma` apart from two harmless `updatedAt` defaults. The development database also has two migrations the repo lacks (`20261003062015_learner_location`, `20261003063619_nearby_events`) and an unused `GeocodeCache` table, so write new migrations by hand, keep them additive, and apply them with `migrate deploy`; a generated diff would drop those extras. Do not create a migration unless the schema changes. Do not run `prisma migrate reset`.
- `tsx` top-level await fails under CommonJS. Wrap scripts in `async function main()`. PowerShell has no `&&` and no bash heredoc. It also eats `$disconnect` inside `tsx -e`. Use a temp script, then delete it.
- Full-repo `eslint` still fails on older files. Lint the files you touched. `tsc --noEmit` is the type check. `next build` is a project check and passes.
- Do not start a second `npm run dev` if one is already answering on port 3000.
- Known failure strings, left in on purpose: catalog title `fail this save`, settings name `fail this save`, submit title `fail this submit`, review notes `fail this review`, creator title `fail this upload`, Open Source review feedback `fail this merge`.
- Placeholder video id constant is `skillflow-placeholder`. Do not use it to replace a real catalog id.

## UI conventions

Polished in October 2026 (`UI-AUDIT.md`, before and after shots in `docs/ui-audit/`). Keep new screens on these.

- Words in visible copy: **Path** for the ordered list of stages (the sidebar and the index say "Paths"; the route stays `/roadmap`), **niche** for a subject, **stage** for a step, **contribution** in Open Source, **Explain-back** for the check. A pending label ends in the ellipsis character: "Saving…".
- Tokens live in `app/globals.css`. Type: body `--text-body` 0.9375rem, sm 0.875, xs 0.8125, 2xs 0.75, 3xs 0.6875. Motion: `--ease-out`, `--dur-fast` 150ms, `--dur-base` 220ms. `--text-faint` is decoration, never body text. Light borders and `--state-pass` were measured to reach 3:1 and 4.5:1.
- Buttons: `Button` (`components/core/Button.jsx`) takes `variant`, `size`, `pending`, and `pendingLabel`; pending shows a spinner, keeps the width, and sets `aria-busy`. A link that should look like a button uses `className="sf-btn sf-btn--gradient sf-btn--md"` (or `--outline`). Hover, press, focus, and disabled live in CSS.
- Dialogs trap focus with `useFocusTrap` (`components/feedback/useFocusTrap.ts`). Success notes use `useToast()` from `components/feedback/Toast.tsx` (mounted in `AppShell`); errors stay inline next to the field.
- Empty states have one action. `EmptyState` takes `titleAs` (`h1`, `h2`, `h3`); use `h2` when it sits right under the page `h1`.
- Explain-back runs in focus mode: `components/learning/FocusMode.tsx` sets `data-focus` on `<html>` while mounted, which hides the sidebar and narrows the column. Drafts stay in `localStorage` under `skillflow-explain:<stageId>` until the stage is saved.
- Path page: cover hero with progress and one primary action, an "Up next" card, then `RoadmapStage` cards with a photo, a state chip (passed, up next, locked with the reason), and a cue. Lesson page: breadcrumbs, the stage title as `h1`, a "Watch first" clip, numbered resource cards with "What you will learn", and an "Explain it back" panel.
- Touch targets: a standalone text link or a small icon button gets an invisible 44px hit area with `.sf-hit` (or one of the selectors listed under "Touch targets" in `globals.css`). Step dots are 24px buttons.
- Images: `SkillImage` (`next/image`) for local files. Event art, contribution links, and Google avatars come from hosts nobody knows ahead of time, so they stay `<img>` with `loading="lazy"` or `decoding="async"` and a reserved box. Do not open `remotePatterns` to every host.
- Landing hero: `public/landing/posters/hero.jpg` paints first on every screen. The 4K videos mount only after hydration, at 960px and up, without reduced motion and without Save-Data. The feature images are real screens in `public/landing/shots/`.
- `html { scrollbar-gutter: stable; }` keeps streamed pages from shifting sideways. Do not remove it.
- `/privacy` and `/terms` are real documents built on `components/legal/LegalDocument.tsx` (short version, table of contents, numbered sections, contact card). The contact email and the "Last updated" date live in `lib/legal.ts`. They are static and prerender. They describe what the app actually collects and who handles it (Gemini or OpenAI, Stripe, OpenStreetMap, YouTube, Ticketmaster, SerpApi), Indian law and the DPDP Act 2023, and the age rule (18, or 13–17 with a parent's consent). When a feature changes what is collected, shared, or public, update `app/privacy/page.tsx` in the same change.
- `scripts/a11y-scan.js` can be pasted into the console on any page: overflow, unnamed controls, missing alt, unlabeled inputs, small targets, heading skips.
- `devIndicators` sits bottom-right in `next.config.ts`. A running dev server needs a restart to pick that up.

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
