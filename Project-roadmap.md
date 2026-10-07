# SkillFlow — Master Project Roadmap

This file is two things at once:

1. **Revision notes** for explaining the project in a pitch or a technical interview.
2. **The build order** for what is still left.

Tick a box only when that exact piece is really finished. A screen that looks done on mock data is not the same as the backend for that feature.

**How to talk about it.** The product idea, the database, sign-in, onboarding, the niche list, and thirty free paths are real. All thirty of those paths have catalogs, and lessons on them play the stored resources. Every niche outside that list is Premium and has no resources. Premium is one Stripe subscription: niches outside the thirty, and appearing on the learner map. There is no quiz: the feature was dropped, and the explain-back gate is the only check. A real stage walks one learning objective at a time. Gemini’s free tier writes a review for each answer, and the step stays put until that idea holds. An idea that holds is kept in Notes. The notebook can download those notes as Word or PDF, and a stage can be summarized from those notes alone. The stage is recorded only when every idea has passed. That call needs an API key. Mastery is the share of open stages passed. A streak day is a UTC day with a saved explain-back or a saved note. There is no leaderboard and no peer review. Stripe Checkout is wired. Missing keys do not charge anyone. A creator rating and earnings are not part of the product.

`AGENTS.md` is the short context a new session should read. This file is the longer record.

Last aligned with the working tree on 7 October 2026.

---

## Where the project stands

| Area | State | What that means in a sentence |
| --- | --- | --- |
| Product shape, tokens, component kit | Done | Dark/light theme, accent presets, shared buttons, cards, charts |
| Public pages | Done | Landing, login, signup, privacy, terms. Landing names Travel Vlogging with the other two free paths |
| Database schema and local Postgres | Done | Prisma models and migrations, through creator studio, the learner map, and nearby events |
| Open Source community | Done | Contribute, review (approve, request changes, close), author edit, resubmit and withdraw, unmerge, roles, gaps, the maintainers panel, `/admin/community`, and a contributor profile with a heatmap. Only merged work is public |
| Auth | Done for email/password | Auth.js, bcrypt passwords, JWT session, route protection. Google is configured in code. The login screen is email and password |
| Onboarding | Done and saved | Skill, pace, goal, and accent are written to Postgres |
| Niches and roadmaps | Done for all thirty free paths | Every free path has a catalog and is available. Art stays a flagship and has stages. Every other niche is Premium and has no stages |
| Lessons and clips | Done for all thirty free paths | The player reads `Resource` rows. YouTube watch links are rewritten into an embed |
| Admin catalog and submissions | Done | An admin can edit stages and resources, and an approval creates a resource |
| Caching | Done for shared catalog and community lists | Niche grid, lessons, clips, and the submit picker share the catalog tag. Merged community pages share the community tag. The learner map shares city totals. Progress and the account menu stay per person |
| Learner map | Done | Opt-in city counts on Nearby → Learners. Saving a city is free. Appearing on the map is Premium. No names. Cities under the env minimum stay hidden |
| Nearby events | Done | Saved events per city and niche, refreshed on a cap. The map opens on the saved city, and each pin is a venue. Community events need a review. Live search stays admin-only |
| Settings follow | Done | Add and remove on the settings page write `UserSkillProgress`. A Premium niche can be followed only with an active subscription. Home links to the niche list instead of a fake Add |
| Explain-back | Wizard, one idea at a time | Each learning objective is its own step. A written review comes back whether the idea holds or not. The step moves on only when it holds. The stage is recorded after the last idea. No key means no pass. Every stage on a free path can be passed |
| Notes | Accepted ideas | `/notes` is in the sidebar. Each idea that holds is stored with the explanation and the review. The list is personal |
| Unlock by mastery | The next stage | A pass opens the next stage for that learner. Every stage on a free path is structurally open, so the certificate can be earned |
| Premium | Stripe Checkout | One subscription. It opens niches outside the thirty and appearing on the learner map. The card form stays on Stripe. Missing keys do not pretend a charge happened |
| Tests, deploy, monitoring | Unit tests only | Mastery, streaks, explain-back judging, plans, events, and community rules have unit tests. No end-to-end pass, no production host, no Sentry |

---

## Revision: explain the product first

SkillFlow is a learning app that checks whether someone understood a lesson, instead of counting how long they watched.

The loop, as designed:

1. Follow one or more skills. Home shows a row for each skill on the feed.
2. Follow that skill's stages in order.
3. Open a lesson made of real external resources (a video, a doc, a course link), or bring your own resource.
4. Pass the explain-back gate: one idea at a time, with a written review on every step. A step moves on only when that idea holds.
5. A real pass is supposed to open the next stage.

There is no quiz. That feature was dropped, and the explain-back is the mastery check. A pass opens the next stage for that learner. Every stage on a free path is open.

What the product refuses: comments, likes, view counts, trending, a score leaderboard, peer review, and guilt copy when a streak breaks. Progress is meant to be verified understanding, not time spent.

**Free catalogs**

- Full-Stack Web Development (`full-stack-web-dev`) — 12 stages, 64 resources, 17 marked for review. Stages 1–9 open. Flagship.
- Travel Vlogging (`travel-vlogging`) — 8 stages, 46 resources, 9 marked for review. Stages 1–5 open. Flagship.
- Content Creation (`content-creation`) — 10 stages, 57 resources, 13 marked for review. Stages 1–7 open. Flagship.
- Music Production (`music-production`) — 8 stages, 45 resources, 9 marked for review. Stages 1–5 open.
- Self Grooming (`self-grooming`) — 8 stages, 47 resources, 15 marked for review. Stages 1–5 open.
- Animation & VFX (`animation`) — 8 stages, 41 resources, 11 marked for review. Stages 1–5 open. The researched slug was `animation-vfx`. The live slug stays `animation`.
- IoT & Robot Automation (`iot-robot-automation`) — 8 stages, 46 resources, 11 marked for review. Stages 1–5 open.
- Screenwriting (`screenwriting`) — 8 stages, 21 resources, 3 marked for review. Stages 1–5 open.
- Graphic Design (`graphic-design`) — 8 stages, 18 resources, 3 marked for review. Stages 1–5 open.
- SEO (`seo`) — 8 stages, 15 resources, 3 marked for review. Stages 1–5 open.
- AI Tools (`ai-tools`) — 8 stages, 15 resources, 3 marked for review. Stages 1–5 open. The OWASP prompt-injection page returned HTTP 403 and was left in place.
- Cybersecurity (`cybersecurity`) — 8 stages, 47 resources, 11 marked for review. Stages 1–5 open.
- Digital Marketing (`digital-marketing`) — 8 stages, 44 resources, 8 marked for review. Stages 1–5 open.
- Personal Finance (`personal-finance`) — 8 stages, 45 resources, 15 marked for review. Stages 1–5 open.
- Public Speaking (`public-speaking`) — 8 stages, 44 resources, 9 marked for review. Stages 1–5 open.
- Sound Design (`sound-design`) — 8 stages, 24 resources, 3 marked for review. Stages 1–5 open.
- Nutrition (`nutrition`) — 8 stages, 22 resources, 3 marked for review. Stages 1–5 open.
- Psychology (`psychology`) — 8 stages, 13 resources, 3 marked for review. Stages 1–5 open.
- Podcasting (`podcasting`) — 8 stages, 12 resources, 2 marked for review. Stages 1–5 open.
- Guitar (`guitar`) — 8 stages, 10 resources, 3 marked for review. Stages 1–5 open.
- Chess (`chess`) — 8 stages, 10 resources, 1 marked for review. Stages 1–5 open.
- Art & Painting (`art-painting`) — 8 stages, 43 resources, 11 marked for review. Stages 1–5 open. Flagship. Two dead links stay until a working page is chosen.
- Photography (`photography`) — 8 stages, 41 resources, 13 marked for review. Stages 1–5 open. One dead link stays until a working page is chosen.
- Emergency Preparedness (`emergency-preparedness`) — 8 stages, 40 resources, 13 marked for review. Stages 1–5 open. One dead link stays until a working page is chosen.
- Badminton (`badminton`) — 8 stages, 41 resources, 13 marked for review. Stages 1–5 open. One dead link stays until a working page is chosen.
- Relationships (`relationships`) — 8 stages, 11 resources, 1 marked for review. Stages 1–5 open. RAINN's consent page returned HTTP 403 to the checker and was left in place.
- Socializing (`socializing`) — 8 stages, 8 resources, 1 marked for review. Stages 1–5 open.
- Interior Design (`interior-design`) — 8 stages, 8 resources. Stages 1–5 open. The Pima and Boise State pages returned HTTP 403 to the checker and were left in place.
- Freelancing (`freelancing`) — 8 stages, 8 resources. Stages 1–5 open.
- Travel Planning (`travel-planning`) — 8 stages, 8 resources. Stages 1–5 open. The four State Department pages returned HTTP 403 to the checker and were left in place.

Every niche outside the thirty free paths is Premium and has no resources. A niche card is a link only when the skill is available and has at least one stage.

Two roles exist: `USER` and `ADMIN`. An admin is the only person who can open the catalog and the submission queue. Everyone else gets a not-found page.

Landing, the auth carousel, and onboarding name Travel Vlogging with Full-Stack and Content Creation. The unwired milestone mock in `lib/mock/catalog.ts` still uses Art.

---

## Revision: stack, and why each piece is there

- **Next.js 16.3.4 App Router.** Pages are Server Components by default. Data loading stays on the server. A file is `"use client"` only when it needs a click, a form, or a chart. Read `node_modules/next/dist/docs/` before using a Next API. This release does not match older Next.js habits. `middleware.ts` is gone. `proxy.ts` is the signed-in gate. Cache Components are on. The niche grid, lesson screens, clip list, and submit picker are cached for every learner. Admin saves expire that cache. Progress and the account menu stay per person.
- **React 19.2.8 and TypeScript.** The page, the view models, and the Prisma models share shapes.
- **Tailwind v4 and CSS variables.** Colors, type, and spacing live in `app/globals.css`. Dark and light are a class on `<html>`. The accent is a `data-accent` value. Public pages stay on the Dusk accent. Inside the app, the person can pick one of ten presets, Spectrum (one color pair drifting around the wheel, with dark type on light shades), or a custom two-stop gradient. A custom choice is stored as `custom:#start:#end` on the profile and in the accent cookie, and it paints before the page loads.
- **PostgreSQL and Prisma 6.19.3.** Local database name is `skillflow` on port 5432. Migrations are SQL files in `prisma/migrations`. `prisma.config.ts` loads `.env` with `dotenv/config` because Prisma 6 stopped doing that by itself.
- **Auth.js (NextAuth v5 beta).** Email and password today. Passwords are bcrypt hashes on `User.password`. Sessions are JWTs. `trustHost` is true. The Credentials provider needs the JWT strategy, so this app does not use database sessions. The JWT callback copies `id` and `role` onto the token. The session callback copies them onto `session.user`.
- **`lib/prisma.ts`.** One Prisma Client for the process, stored on `globalThis` in development.
- **`proxy.ts`.** If there is no session, a visit to a signed-in URL redirects to `/login`. Role checks are not done here. Admin pages call `requireAdmin()` themselves.
- **`lib/data`.** Each loader starts with `import "server-only"`. Catalog, lesson, clips, dashboard, settings, submissions, admin catalog, creator studio, and the explain-back milestone read Prisma. The preview id `__explain_input__` and the remaining Version 2 previews still read `lib/mock`.

---

## Revision: caching

Public pages are static. `/`, `/login`, `/signup`, `/privacy`, and `/terms` do not read a session, so Next.js builds them once and does not ask the server for that HTML on every visit.

Signed-in pages are not fully static. Follow marks, mastery, and the account menu differ per person. `cacheComponents` is on in `next.config.ts`. The part that is the same for every visitor is cached with `"use cache"`:

- The niche grid, including the card template
- Lesson screens, including a stage that is waiting on the previous explain-back. Every stage on a free path can be opened. A later stage stays shut until this learner has passed the earlier ones
- Clip items from open stages
- The submit-a-resource skill picker
- The public catalog those screens read (`lib/data/public-catalog.ts`)

The lifetime is `cacheLife("hours")`. The tag is `catalog` (`lib/cache/tags.ts`). An admin catalog save and an approved submission call `invalidateCatalog()`, which is `updateTag`, so the edit shows up immediately. A catalog import run from a script cannot call `updateTag`. That change shows up when the hour-long cache refreshes.

The niches page does not cache each page separately. It caches the full list once, then the browser shows 4 columns by 8 rows (32 cards) and turns the page locally. Home and the roadmap index use a second cached render of that same catalog: 4 columns by 3 rows, a blurred peek of the next row, and a link to `/skills`.

Progress, streaks, follow state, explain-back history, and the account menu stay on the request. The account name is cached per user under `account:${userId}` and expires when that person saves their name. A cached function returns plain data. It does not call `auth()`, `cookies()`, or `headers()`.

Other shared caches, each with its own tag: merged community lists (`community`), learner-map city totals (`learner-map`), Nominatim city search (`geocode`, lifetime `days`), saved nearby events (`nearby-events`), and text read from a public page for a practice note (`practice-source`). A write that changes one of those calls the matching invalidate function. Development reads map totals and events fresh.

Roadmap stage status (passed, in progress, ready) stays personal, so the roadmap page is not one cached component. It reads the cached catalog and overlays that person's progress.

Public Open Source data (merged lists, member counts, gaps, the changelog, contributors, contributor profiles) is cached with the `community` tag. A merge, an unmerge, a resubmission, a role change, a gap change, a join, or a useful mark calls `invalidateCommunity()`. The review queue, the sidebar Review count, the author's own pages, the maintainers panel, and `/admin/community` stay on the request.

There is no Redis layer. The cache is Next's own store. `ioredis` is in the dependencies and is unused.

---

## Revision: the database, table by table

Auth.js tables: `User`, `Account`, `Session`, `VerificationToken`. `User` also has `role` (`USER` or `ADMIN`), `password`, `currentStreak`, `longestStreak`, and `lastActivityDate`.

`LearnerProfile` is one row per user: `skillSlug`, `pace`, `goal`, `accent`. The feed is no longer limited to that one slug. Settings can follow more skills through `UserSkillProgress`.

Content tables:

- `Skill` has `status` (`AVAILABLE` or `COMING_SOON`), `offer` (`FREE` or `MONETIZED`), `nicheGroup`, `isFlagship`, `order`, and a cover `image`.
- `RoadmapStage` belongs to one skill. `@@unique([skillId, order])`. Optional `image` is the stage photo. `learningObjectives` is a string list. `monetized` defaults to false.
- `Resource` stores a snapshot (`title`, `description`, `keyPoints`, `transcript`, `provider`, `author`, `videoId`) so a dead URL can still show what the lesson covered. `isFree`, `language`, `needsReview`, `sourceStatus` (`ACTIVE` or `UNAVAILABLE`), and `lastVerifiedAt` are the catalog fields. There is no note column. `@@unique([stageId, url])` and `@@unique([stageId, order])`.
- `ResourceSubmission` is the waiting room. Approval creates a real `Resource` on that stage. Rejection stores the note.
- `Quiz`, `QuizQuestion`, `QuizAttempt`. Left in the schema after the quiz feature was dropped. Nothing reads or writes them.
- `ExplainBackPrompt` is one per stage. The importer writes the question and the rubric. A finished explain-back writes `ExplainBackAttempt`, and a pass sets `StageCompletion.explainBackPassed`.
- `UserSkillProgress` is one row per user per skill: `masteryPercent`, `currentStageOrder`.
- `StageCompletion` is one row per user per stage: `explainBackPassed` and `completedAt` (`quizPassed` is unused). A stage counts as passed when the explain-back passed. The free-path lock does not read these flags.

Migrations run from `20260923010253_init` through `20261001104500_creator_studio`, plus `community_unmerge_flag` (`ContributionReview.unmerge`), `20261005193000_learner_map`, and `20261005220000_nearby_events`. The folder `20260925094514_add_paddword_field` has that spelling. Do not create a migration unless the schema changes. Do not run `prisma migrate reset`.

Seed: base skills are Full-Stack, Travel Vlogging, Content Creation, Art & Painting, Photography, and Music Production, then the extra niches. Every skill is available. Offer is free when the slug is one of the thirty free paths, and Premium otherwise. The seed then imports the Full-Stack, Content Creation, Travel Vlogging, Music Production, Self Grooming, Animation, IoT, Screenwriting, Graphic Design, SEO, AI Tools, Cybersecurity, Digital Marketing, Personal Finance, Public Speaking, Sound Design, Nutrition, Psychology, Podcasting, Guitar, Chess, Art & Painting, Photography, Emergency Preparedness, Badminton, Relationships, Socializing, Interior Design, Freelancing, and Travel Planning catalog files. The dead links in Art & Painting, Photography, Emergency Preparedness, and Badminton stay until a working page is chosen. Do not run it against a database that already has accounts. It resets admin passwords.

---

## Revision: what a person can do in the app today

**Account.** Sign up with name, email, and password. Log in with email and password. Log out from the account menu. After signup the app sends them to onboarding, then home.

**Onboarding.** Pick a skill, a pace, a goal, and an accent. Save writes `LearnerProfile` and a `UserSkillProgress` row when that skill exists. Pace does not decide which stages are open. The skill choices are Full-Stack, Travel Vlogging, Content Creation, Photography, and Music Production.

**Shell.** Every signed-in page sits in `app/(app)`. The URL does not contain `(app)`. Desktop shows a fixed sidebar from 960px up. Below that, the sidebar is a dialog drawer. Main nav is Home, Niches, Clips, Creator studio, Roadmaps, Nearby, Open Source, Progress, Notes, Analytics, Submit a resource, and Settings. Admin appears only when `role === ADMIN`. Review appears for admins and community role holders, with an open count.

**Niches (`/skills`).** Search and group filters, then 32 cards a page (4 columns by 8 rows). A free skill with stages is a link to its roadmap. Open means the thirty free paths. Every free path has stages, so the card says "Free · N stages". Every other niche shows "Premium". A free account is not a link to that roadmap. A subscriber is. Narrow screens stack the same 32 cards into fewer columns.

**Home.** Streak banner, four stats from the signed-in user (zeros until there are attempts), and one horizontal row per followed skill. Open stages link to the lesson. Locked stages do not. Explore shows 4 columns by 3 rows of niche cards, a blurred peek of the next row, and Explore all the niches. The real follow is Settings.

**Roadmaps.** The index says thirty paths are free, the next stage opens after the explain-back, and every stage on a free path is open. A followed skill has Continue and Open path. More skills is the same short niche teaser as Home. A path page shows the stage photo and the real description. A stage they have not reached yet stays readable, with a lock and "Pass the previous stage to open this one." A stage they have not reached yet stays readable, with a lock. A Premium path with no stages says the catalog is not ready yet. Stage photos are 16:9 files in `public/uploads`. That folder is gitignored, so a clone does not include them.

**Lesson.** The first video is the clip. Other resources are sources. A course link is labeled "Course". Pressing play loads `youtube-nocookie.com/embed/...`. A locked lesson shows the stage title and the skill name, and does not include the resource text. Direct visits to a locked stage id behave the same way.

**Clips.** Short-form resources from the database, without comments.

**No quiz.** The quiz feature was dropped. There is no `/quiz` route, no quiz stat, and no “Continue to quiz” button. The lesson's next step is the explain-back.

**Explain-back.** Every imported stage has learning objectives, a question, and a rubric. The lesson’s continue button opens `/milestone/[stageId]`. A real stage is a wizard: one objective per step, animated between steps. `GEMINI_API_KEY` sends that step to Gemini’s free tier (`gemini-flash-lite-latest`). `OPENAI_API_KEY` is used only when the Gemini key is empty. The model writes a review whether the idea holds or not. An empty answer, or one the model does not accept, stays on the step. An accepted idea is stored as a note: the explanation and the review. The stage is saved only after every idea has passed: one `ExplainBackAttempt` and `StageCompletion.explainBackPassed`. The next stage stays shut until this one is passed. Every stage on a free path can be passed. With no key, a timeout, or a reply that is not a review, nothing is saved. `review failed` still shows the error and saves nothing. The preview id `__explain_input__` keeps the old mock walkthrough.

**Notes.** `/notes` is in the sidebar. It lists that learner’s accepted ideas, grouped by skill and stage. Opening one shows what they wrote and the review. Search and a skill filter narrow the list. Download Word and Download PDF save the notebook. Summarize this stage writes a short restatement of that stage’s notes and nothing else. The page reads the signed-in user on the request.

**Progress and analytics.** Counts, mastery, streaks, weak topics, and the charts come from `ExplainBackAttempt` and `StageCompletion`. Home and Progress show “Explain-backs passed”.

**Settings.** Name saves to `User`. Email is read-only. Add follows an available skill. Coming-soon skills have no Add button. Remove drops `UserSkillProgress` and keeps attempts. The daily reminder toggle is still local to the page. Theme and accent apply immediately. The accent row keeps the ten presets, adds Spectrum (one neighboring pair moves around the wheel and the type goes dark on a light shade; reduced motion holds one hue), and adds a custom gradient: a color palette, a hex field, and R, G, and B for each stop. Log out uses the real `signOut`.

**Submit and admin.** Submit writes `ResourceSubmission`. Approve appends a `Resource` on that stage. Reject requires a note. `fail this submit` and `fail this review` are the built-in error cases. A non-admin who opens an admin URL gets not-found.

**Admin catalog.** Lists every niche, with Flagship and Available or Coming soon. The stage editor includes every skill that already has stages, which is all thirty free paths. Needs review only filters the resource list. Saving a resource titled `fail this save` is the built-in error.

**Personal plan.** A followed skill can store preferences on `LearningPlan`. Plain code builds a schedule from the shared stages. Gemini only turns a written description into those preferences, or suggests resource tags for an admin to review. Undo hides the schedule and shows the shared stages again.

**Version 2 previews, not linked from the main nav.** Each one is labeled "Version 2 preview".

- `/upgrade` — Stripe Checkout for one Premium tier. The card form stays on Stripe. Without keys, the page says Stripe is not configured.
- `/transcript/[userId]/[skillSlug]` — the stages this learner has passed, with the real dates. PDF download. `noindex`.
- `/certificate/[userId]/[skillSlug]` — issued only when every stage on that path is passed. SkillFlow’s own record. `noindex`.
- `/notes` — in the main nav. An accepted explain-back idea is stored with its review. The notebook downloads as Word or PDF, and each stage can be summarized from those notes only.
- `/submit/byor` — bring your own resource and get a sample explain-back gate prompt.
- Usage-cutoff dialog — a soft stop. Not stored.
- `/dev/routes` — screen list. It 404s in production.

**Open Source.** A learner submits a post: text, an image, and source links. It stays hidden until an admin or a niche moderator publishes it. Reject needs a note and keeps it off the list. A published post can take one question from each learner, and the author writes one answer. There is no thread, no likes, and no view count. Reviewers work from `/open-source/review` and can hide a published post. Admins grant moderators at `/admin/community`.

**Errors and empty screens.** Root and in-app `not-found` and `error` pages are themed. Dev-only routes can throw those states: `/dev/error`, `/dev/missing`, `/dev/root-error`, `/dev/root-missing`.

---

## Revision: the catalog pipeline

Researched paths live in `content/catalog/*.json`. The importer is server-only.

```bash
npx tsx scripts/verify-catalog.ts <slug>
npx tsx --conditions=react-server scripts/import-catalog.ts <slug>
npx tsx --conditions=react-server scripts/import-catalog.ts <slug> --apply
```

`FILE_BY_SLUG` maps `full-stack-web-dev` to `full-stack-web-development.json` only. The other files match their slugs. The JSON slug must equal the file name.

A dry-run is the default. Apply updates that skill's stages, resources, and explain-back prompts in one transaction. It updates the skill name and description. It does not set status, offer, the cover, the flagship flag, or stage images. A second dry-run should print "Nothing to change."

The Full-Stack and Travel files still say `COMING_SOON` because that is the researched text. The live rows are `AVAILABLE` and `FREE`. Content Creation's file says `AVAILABLE`. Do not expect a reimport to flip status.

Link check results worth remembering:

- Full-Stack has a from-database report. Dead stored links can be marked `UNAVAILABLE` without losing the title and notes.
- Content Creation: one fetch failed (an Adobe Premiere page) and several official sites returned 403. Those URLs were kept.
- Travel Vlogging: 38 OK, 0 failed, 8 sites returned 403 (timeanddate, Rick Steves, B&H, StudioBinder, Videomaker, NewsLab). Those URLs were kept.

`needsReview` is for the `[CONFIRM]` items, which are the videos. A 403 is "needs manual check" in the report. It does not by itself set `needsReview`.

Stage photos were generated for all 10 Content Creation stages and all 8 Travel stages, and Full-Stack already had them. The other free paths have no committed stage photos. The importer leaves `image` unset so a reimport does not clear a photo.

---

## Revision: decisions worth saying out loud

- **JWT sessions, not database sessions.** Auth.js Credentials does not support database sessions. Revoking one session means changing the secret or waiting for expiry.
- **Google is in `lib/auth.ts`. The login form does not show a Google button.**
- **Proxy is not the admin check.** The proxy only asks "is someone signed in?". `requireAdmin()` asks "is this person an admin?".
- **Public pages stay static.** `/`, `/login`, `/signup`, `/privacy`, and `/terms` do not call `auth()` in the root layout.
- **Shared screens are one cached copy. Personal progress is not.** The niche grid, lessons, clips, and the submit picker use the `catalog` tag. Admin saves expire it at once. Follow marks, mastery, and the account menu stay on the request.
- **The feed can hold more than one skill.** Onboarding saves one profile skill. Settings can add more available skills. Home renders one row per followed skill. The old "one skill only" rule is not what the screen does.
- **Every stage on a free path is open.** A pass opens the next stage. Passing all of them earns the certificate.
- **The quiz was dropped.** One explain-back gate per stage is the check, plus a bring-your-own-resource prompt. The quiz tables stay in the schema unused, so the database did not change. Coming-soon and monetized skills open no stages.
- **Four flagships.** Full-Stack, Travel Vlogging, Content Creation, and Art & Painting are flagships. All four have catalogs. The other twenty-six free paths are not flagships.
- **The importer must not own availability.** A researched file can say coming soon while the product decision is to open the path. Status is set on the row, and the seed special-cases Art so a later seed does not undo that.
- **Do not run the full seed to reload one path.** Use the importer, then a targeted update for status and offer.
- **Open Source is review-gated, not a forum.** Contributions never enter the catalog tables. A review is one decision with a reason, not a thread. Every decision only applies if the status and revision still match what the reviewer opened, so two reviewers cannot both act on one item.
- **AniVerse was a structural reference.** The magenta palette, likes, and follower counts were not copied.

---

## Do not claim these in an interview yet

- SkillFlow has a quiz, a score leaderboard, or peer review.
- A Premium niche has a catalog. It does not. Stripe charges someone when the keys are missing. It does not.
- A creator has a rating or earnings.
- The app is deployed, monitored, or covered by an end-to-end test.
- Every accent was checked for contrast on both themes.
- Onboarding offers all thirty paths. It offers five. Settings can follow any free path.

---

# VERSION 1 — MVP (build order)

Do not start a later phase's backend until the previous phase's open boxes are done. The presentation screens above are allowed to exist early. They do not count as the phase being finished.

## Guiding principles

- [ ] **Twelve-factor** — config in env vars, stateless JWT. Open until deploy and prod parity exist.
- [x] **Resource-shaped writes** — Server Actions and Zod on catalog, settings, and submission writes. There is no separate REST API.
- [x] **Separation of page and data** — pages call `lib/data`. Catalog paths do not embed the mock arrays. Milestone and Version 2 still do.
- [x] **Shared tokens and components** — colors and type come from `globals.css`.
- [x] **Idempotent writes** — catalog reimport is idempotent. A passed explain-back writes one attempt. The Stripe webhook upserts one subscription per account.
- [x] **Version fields on explain-back** — columns exist. No second version has been stored.
- [x] **Conventional commits** — history uses `feat`, `fix`, and `chore`.
- [ ] **OWASP baseline** — passwords are hashed, secrets stay in `.env`, admin routes check role. A full threat pass is not done.
- [ ] **Accessibility** — semantic headings, labels, and focus are in the kit. A full keyboard and contrast pass is not done.
- [ ] **Tests** — unit tests cover mastery, streaks, explain-back judging, plans, events, and community rules. Integration tests and an end-to-end pass are not written.
- [x] **README and agent context** — `README.md`, `AGENTS.md`, and this file match the thirty free paths and the shared-content cache. The case study is not written.

## Non-functional requirements

- [ ] Scalability documented for a real deploy
- [ ] Security: auth works for email/password; a threat pass is still open
- [x] Performance of shared catalog reads — one cached copy of the niche grid, lessons, clips, and the submit picker. Personal progress stays a small query. A production host and CDN are still open
- [x] Reliability of a dead link — a stored source can be marked unavailable and the lesson keeps the snapshot
- [x] Maintainability of the UI layer — tokens, typed view models, `lib/data` boundary
- [ ] Observability (Sentry or equivalent)
- [ ] Usability signed off on every screen in both themes

---

## PHASE 0 — Setup and foundation
**Status: ✅ COMPLETE**

- [x] Feature list locked. The first three free paths were Full-Stack, Travel Vlogging, and Content Creation. The free list is now thirty paths, and all thirty have catalogs. Art remains a flagship and has stages
- [x] Repo, Next.js 16, TypeScript, git
- [x] Dependencies: Prisma, Auth.js, bcrypt, Tailwind, Recharts

## PHASE 1 — UI foundation
**Status: ✅ COMPLETE**

- [x] Tokens in `app/globals.css` (Tailwind v4 `@theme`)
- [x] Dark and light, class on `<html>`, cookie `skillflow-theme`. Default is dark
- [x] Accent presets, plus Spectrum and a custom gradient from the palette, hex, or RGB. Public pages force Dusk. The signed-in app uses the saved accent
- [x] Component kit, including the compact stage card with the photo on the right
- [x] Landing, login, and signup

Primary buttons keep their gradient on hover and get slightly brighter. They do not turn into an empty outline.

## PHASE 2 — Data model and auth
**Status: ✅ COMPLETE for what Version 1 uses. GitHub login and database sessions were dropped on purpose.**

- [x] Prisma schema for auth, skills, stages, resources, submissions, explain-back, progress, and `LearnerProfile` (the quiz tables are unused)
- [x] Catalog fields: offer, flagship, niche group, resource metadata, source status, stage image
- [x] Docker Compose Postgres and `DATABASE_URL`
- [x] `prisma.config.ts` imports `dotenv/config`
- [x] Migrations listed above are applied
- [x] Seed imports all thirty free catalogs. Art stays a flagship. Do not re-run it casually
- [x] Email/password sign-in and sign-up
- [x] `proxy.ts` redirects anonymous visitors
- [x] JWT session strategy
- [ ] GitHub OAuth — not built. Google is in config only, and the form does not offer it
- [ ] Database sessions — not used, and not the plan anymore

**Interview bugs already hit.** Prisma 6 does not auto-load `.env`. Docker named volumes keep the first Postgres password forever.

## PHASE 3 — Catalog, roadmap, and admin
**Status: ✅ COMPLETE for all thirty free paths**

- [x] Roadmap, lesson, clips, home, and niches read Prisma
- [x] Admin catalog editor for stages, resources, explain-back prompts, and the needs-review filter
- [x] Niche list with available and coming soon
- [x] Submit creates `ResourceSubmission`. Approval creates `Resource`
- [x] Zod on those writes
- [x] Free paths used to hold the last three stages. Those stages are open now, so a finished path can earn the certificate
- [x] YouTube links play inside the lesson
- [ ] Tests for roadmap and resource reads

## PHASE 4 — AI explain-back
**Status: ✅ ONE IDEA AT A TIME. THE GATE IS WRITTEN FROM THE STAGE’S RESOURCES.**

**Already stored or on screen:**

- One explain-back question, a rubric, and learning objectives per imported stage
- The gate is a wizard, one learning objective per step. The lesson’s continue button opens `/milestone/[stageId]`
- A chat model writes a review for that idea, whether it holds or not. Keyword overlap cannot pass the step
- An empty or rejected answer stays on the step. An accepted idea is stored as a note. The stage is recorded only after every idea has passed
- A pass sets `StageCompletion.explainBackPassed` and does not open a locked stage
- No key, a timeout, or a reply that is not a review saves nothing
- `lib/explain/judge.test.ts` checks that a full set of concepts can pass and a remaining gap cannot
- The preview id `__explain_input__` still has the mocked voice path, follow-up, pass, retry, and the `review failed` error

**Still open:**

- [x] Opening a stage writes the explain-back ideas from that stage’s resources. Every key point is kept. A blocked article is skipped. With no model key, the catalog questions stay.
- [x] Timeout and bad JSON leave the stage unpassed instead of inventing a grade
- [x] Milestone page reads the stage concepts
- [x] After every idea passes, one `ExplainBackAttempt` is saved
- [x] An eval set: every concept understood passes; a gap does not
- [x] A pass updates `StageCompletion` and opens the next stage, including the last three

## PHASE 5 — Mastery, streaks, progress data
**Status: ✅ WIRED TO EXPLAIN-BACK**

- [x] Progress, analytics, and home read real explain-back attempts
- [x] Mastery is the share of open stages with a passed explain-back. Locked stages stay out of the count
- [x] Weak topics are stages with a needs-another-look attempt that are not passed yet
- [x] A streak is consecutive UTC days with a saved explain-back or a saved note, stored on `lastActivityDate`
- [x] Week and month charts are drawn from those attempts

## PHASE 6 — Frontend on real data
**Status: ✅ THE LEARNING PATH, EXPLAIN-BACK, NOTES, PLANS, MAP, AND EVENTS ARE ON REAL DATA. STRIPE IS NOT**

- [x] App shell, home, clips, roadmaps, lesson, settings, submit, admin catalog
- [x] Shared catalog cache for the niche grid, lessons, clips, and the submit picker. Admin saves expire it
- [x] Loading skeletons, empty states, and the locked-stage state
- [x] Stage photos on Full-Stack, Content Creation, and Travel Vlogging. The other free paths have no committed stage photos
- [x] Settings follow and unfollow
- [x] Explain-back UI calling a real grader
- [x] Home and roadmap no longer show a preview Add. Explore links to the niche list. Follow stays on Settings
- [x] A full responsive pass, including 375px
- [x] Landing, auth carousel, and onboarding name Travel Vlogging instead of Art

## PHASE 7 — Content seeding
**Status: ✅ COMPLETE for all thirty free paths.**

- [x] All thirty free catalogs loaded from `content/catalog/`. Full-Stack uses `full-stack-web-development.json`. The live slug stays `full-stack-web-dev`. Animation uses `animation.json`. The live slug stays `animation`
- [x] Explain-back prompt on every imported stage
- [x] Art & Painting is loaded and stays a flagship
- [ ] Five dead URLs still need a working page: ACMI seals, the UCL Slade page, the Nikon focal-length article, the NDMA earthquake page, and the Western Australia badminton court page. Do not swap them until that page is chosen
- [ ] The 403 links still need a person to confirm the page. Do not replace a link just because the bot was blocked. That includes RAINN, Pima, Boise State, the four State Department travel pages, and the OWASP prompt-injection page

The mock catalog in `lib/mock/catalog.ts` is leftover sample data for the screens that are not wired. It is not the seed.

## OPEN SOURCE — Community contributions
**Status: ✅ COMPLETE**

- [x] Contribute form with type, text, an image, source links, stage, tags, and disclosure. Links are checked; duplicates against the niche and the official roadmap are shown to the reviewer
- [x] Review queue. Approve publishes the post. Reject needs a note and keeps it off the list. The link check and possible duplicates are notes, not a decision
- [x] Author pages: list, owner view, edit, and withdraw. Editing a published post takes it off the list until it is published again
- [x] Hide a published post, with a reason
- [x] One question per learner on a published post, answered once by the author. No thread and no likes
- [x] Roles: admin grants either role, maintainers grant reviewers, nobody changes their own
- [x] Maintainers tab and `/admin/community`
- [x] Contributor section on the public profile with a 12-month heatmap
- [x] `community` cache tag for public data; per-request queue, counts, and author pages
- Author is not notified when a decision lands. The result shows on My contributions.
- [ ] Integration tests for review, edit, and hide

## PHASE 8 — Testing
**Status: 🔶 MASTERY AND STREAK TESTS EXIST. THE REST DOES NOT**

- [x] Unit tests for the open-stage rule, mastery, and streaks
- [ ] Integration tests for catalog import and lesson reads
- [ ] One end-to-end pass: signup → onboarding → lesson → explain-back → progress
- [ ] Manual pass of empty, error, and loading
- [ ] Model calls mocked in tests

## PHASE 9 — Deploy
**Status: ⬜ NOT STARTED**

- [ ] App container
- [ ] GitHub Actions: lint, test, build
- [ ] Hosted app and hosted Postgres
- [ ] Error monitoring
- [ ] Separate env files, no secrets in git
- [ ] Migrate as a deploy step
- [ ] Stage photos are not in git. A deploy needs those files, or the cards render without them

## PHASE 10 — Documentation and case study
**Status: 🔶 THE WORKING DOCS MATCH THE APP. THE CASE STUDY IS NOT WRITTEN**

- [x] README aligned with the thirty free paths and the catalog commands
- [x] `AGENTS.md` aligned so a new chat does not revive the mock-catalog story
- [x] This file aligned
- [ ] Case study: the problem, what existing products optimize for, and what SkillFlow refused to copy
- [ ] A short recording of the loop
- [ ] A diagram of browser → Server Component → `lib/data` → Prisma

---

# VERSION 2 — after Version 1

Explain-back, streaks, notes, transcripts, certificates, personal plans, creator studio, the learner map, and nearby events are built. Stripe Checkout is wired. A real charge still needs the keys in the environment. Tests and deploy are still open.

## V2 PHASE 1 — Premium and Stripe
**Status: 🔄 IN PROGRESS. Checkout, the webhook, and the two Premium gates are in the app. A charge starts only when the Stripe keys are set.**

Premium is the niches outside the thirty free paths, and appearing on the learner map. Those niches still have zero stages.

- [x] Stripe customer and subscription ids on `Subscription`
- [x] Checkout session, webhook with signature check, idempotent upgrades and downgrades
- [x] Premium features gated on the server
- [x] No card fields on our origin
- [ ] A live test charge against Stripe test keys

## V2 PHASE 2 — Score and leaderboard
**Status: 🚫 REMOVED. A score ranking is the FOMO the product refuses.**

There is no `/leaderboard` route. Verified understanding stays on the learner’s own progress.

## V2 PHASE 3 — Explanations reused as lessons
**Status: 🚫 REMOVED.**

An accepted explanation stays in Notes. It is not turned into a lesson for other learners. The shared path stays the researched catalog. A learner who wants to share a concept uses Open Source.

## V2 PHASE 4 — Transcript
**Status: ✅ BUILT FROM PASSED STAGES.**

`/transcript/[userId]/[skillSlug]` lists the stages this learner has passed and the date each one was recorded. It does not include the written explanations. Progress links to it after the first pass on a followed path. The PDF is a download of that list.

## V2 PHASE 5 — Notes
**Status: ✅ STORED, EXPORTABLE, AND SUMMARIZED. PRACTICE NOTES STAY OFF THE PATH.**

`/notes` is in the sidebar. When an idea holds, `LearnerNote` keeps the explanation and the written review. A pass recorded before that still becomes notes the next time the page is opened. The page is a notebook: one skill, its stages in path order, and every idea on that stage with the review under it. Practice notes sit in a Practice chapter after the stages. Download Word and Download PDF save that notebook. Summarize this stage asks the same model for a short restatement of that stage’s notes and nothing outside them. `/notes/practice` lets a learner start from a link. SkillFlow reads that public page, and the review uses the page text. A dropped text file or a pasted passage works the same way. An idea that holds is saved. It does not pass a stage or enter the catalog. Notes are personal and are read on the request. The fetched page is shared for an hour.

## V2 PHASE 6 — Peer project review
**Status: 🚫 REMOVED.**

There is no `/projects` route. Learners are not matched to review each other’s work.

## V2 PHASE 7 — Creators
**Status: ✅ STUDIO IS LIVE. A RATING AND EARNINGS ARE NOT PART OF THE PRODUCT.**

A signed-in learner uploads a short clip or a longer video they own, picks one available niche, and sends it for review. `/admin/creator` approves it onto that niche’s clip feed and `/profile/[userId]`. The studio keeps drafts and shows views, watch time, and how many plays reached most of the video. The feed and the public profile do not show those numbers. Replacing the file on a live video sends it back for review. A creator rating and earnings are not part of the product.

## V2 PHASE 8 — Generated roadmaps
**Status: ⬜ NOT STARTED. Hand-written paths stay the default.**

A model does not research or compile a niche. Personal plans are a different feature: one shared catalog, and a schedule built in code from the learner's preferences.

## Personalized learning plans
**Status: ✅ ONE SHARED CATALOG, A PERSONAL SCHEDULE.**

Preferences are per learner and per skill: level, time, deadline, resource types, language, goal, low data, captions, and topics they already know. They are collected when a skill is followed, and edited from the roadmap or Settings. A free-text description can be sent to Gemini, which returns those same fields for the learner to adjust. The description is data, not instructions.

The plan itself is plain code. It does not skip stages or explain-backs. Earlier open stages can be labeled Test out when the learner's level is past them, and passing that stage's explain-back still completes it. A missing language falls back to English with a note. A short deadline marks extra resources Optional and says when the core path does not fit. The saved row is `LearningPlan`. It is rebuilt when the preferences or the catalog change. Undo on the roadmap hides that schedule and shows the shared stages again. It does not change those stages or their resources. Opening a stage uses that same selection: preferred language and type first, extra resources marked Optional. Resource tags (`durationMinutes`, `depth`, `isCore`, `captionLanguages`) are optional on the catalog import. An admin can ask Gemini to suggest them, then save. A suggestion never replaces a value the admin already saved. `scripts/suggest-resource-tags.ts` writes a dry-run report and applies only with `--apply`.

## V2 PHASE 9 — More niches
**Status: ✅ THE THIRTY FREE PATHS HAVE CATALOGS. PREMIUM NICHES DO NOT.**

Every slug in `FREE_PATH_SLUGS` has a researched JSON file and is imported. A niche outside that list is Premium: available, monetized, and zero stages. A subscriber can open the card and follow it. Do not invent those catalogs. Stripe Checkout is the payment. Without keys, the upgrade page says it is not configured.

## V2 PHASE 10 — Smaller extras
**Status: 🔶 UI ONLY for two of these**

- [x] Usage-cutoff dialog (soft: take a break, or continue)
- [x] Bring-your-own-resource page that turns a resource into a sample explain-back gate prompt
- [x] Spaced repetition: each passed idea comes back twice, 18 hours apart. A card locks the app until any written answer. Retention on Progress is the average of those answers. The stage pass stays.
- [x] A certificate when every stage on a path is passed. It is SkillFlow’s own record of those explain-backs, and it is not a license or a degree.

---

## Learner map
**Status: ✅ DONE. Counts only. No names.**

Settings can store one city: the name, the country, and the city centre from OpenStreetMap Nominatim. “Show me on the learner map” is off until the learner turns it on. Nearby → Learners draws those cities with MapLibre. `/map` redirects there. A bubble is a count. Zoomed out, nearby cities cluster and the number is the sum of learners. A niche filter lists followed niches first. A city with fewer opted-in learners than `MAP_MIN_LEARNERS` (default 5) is left off. `scripts/map-demo.ts` adds and removes fake learners on this machine only.

---

## Nearby events
**Status: ✅ DONE. Links only. No booking.**

The sidebar item is Nearby. Learners is the map above. Events is a second tab: pins on the same map, cards beside it, and online events in their own list. The city is the one saved in Settings. There is no GPS.

Ticketmaster and Google Events (SerpApi) are separate adapters. A missing key turns that source off. Community events are the third source: three submissions a day, approved by an admin or that niche’s Open Source reviewers. Free visitors read saved rows. A city and niche refresh at most every 12 hours, in the background, and a secret cron route can refresh the popular pairs. API usage is counted so the free caps hold. Live search is not saved. `canUseLiveSearch()` allows an admin until payments exist. Everyone else sees Premium · coming soon.

---

**Right now.** Thirty paths are free. Full-Stack, Travel Vlogging, Content Creation, Music Production, Self Grooming, Animation & VFX, IoT & Robot Automation, Screenwriting, Graphic Design, SEO, AI Tools, Cybersecurity, Digital Marketing, Personal Finance, Public Speaking, Sound Design, Nutrition, Psychology, Podcasting, Guitar, Chess, Art & Painting, Photography, Emergency Preparedness, Badminton, Relationships, Socializing, Interior Design, Freelancing, and Travel Planning have catalogs. Every other niche is Premium, with no resources, until a subscription opens it. A pass opens the next stage, and passing every stage earns the certificate. Phases 0, 1, 2, 3, 4, 5, and 7 are done for all thirty free paths, and the Open Source community is complete. The learner map and Nearby events are live. Explain-back asks for every idea written from that stage’s resources and passes the stage only when a model marks each one understood. An accepted idea is kept in Notes, and that notebook can be downloaded or summarized from those notes alone. A transcript lists the stages a learner has passed. A certificate is issued when every stage on a path is passed. `/notes/practice` grades an idea against a public page, a text file, or a pasted passage, and saves it without passing a stage. A followed skill can have a personal plan built in code from that learner's preferences. Mastery, streaks, weak topics, and the progress charts read explain-back attempts. A score leaderboard and peer review are not part of the product. A creator rating and earnings are not either. The accent system is complete: ten presets, a custom gradient, and Spectrum. Still open for Version 1: the rest of the test suite and an end-to-end pass (Phase 8), and deploy (Phase 9).

---

## What's left

The learning loop is in place for the thirty free paths. What remains is proof, a host, and a few content gaps. These are not part of the accent work.

**Finish Version 1**

- Phase 8. Integration tests for catalog import and lesson reads. One end-to-end pass from signup through onboarding, a lesson, explain-back, and progress. A manual pass of empty, error, and loading states. Model calls mocked in tests.
- Open Source. Integration tests for review, edit, and hide. The author is not told when a decision lands; the result only shows on My contributions.
- Phase 7. Five dead catalog URLs still need a working page chosen by hand: ACMI seals, the UCL Slade page, the Nikon focal-length article, the NDMA earthquake page, and the Western Australia badminton court page. The 403 links need a person to confirm the page. Do not swap either set until that page is chosen.
- Phase 9. A container, GitHub Actions for lint, test, and build, a hosted app and hosted Postgres, error monitoring, env files that stay out of git, migrate as a deploy step, and the stage photos that are not in git.
- Phase 10. A case study, a short recording of the loop, and a diagram of browser to Server Component to `lib/data` to Prisma.
- `next build` still fails on a prerender of uncached data in `AppShell`. Full-repo `eslint` still fails on older files. Fix those as part of the deploy check, not as catalog work.

**Leave out, on purpose**

- No leaderboard and no peer review. A creator rating and earnings are not part of the product.
- A model does not research or compile a new niche. Personal plans stay a schedule over the shared catalog.
- Premium niches stay empty until a catalog is actually written. Do not invent those stages.
- The old quiz tables are still in the schema and nothing reads them. Do not build on them.

**Smaller follow-ups**

- Stripe Checkout is wired. A real charge still needs the price and webhook keys on the host.
- Live event search is still admin-only. Everyone else sees “Premium · coming soon”.
- Event keywords are custom only for Full-Stack, Travel Vlogging, and Content Creation. Other niches search on their name.
- Stage photos exist for Full-Stack, Content Creation, and Travel Vlogging. The other paths have no committed photos.
- The daily reminder on Settings stays on that screen. It is not stored on the account.
- `requireLearner()` exists and no page uses it.
