# SkillFlow — Master Project Roadmap

This file is two things at once:

1. **Revision notes** for explaining the project in a pitch or a technical interview.
2. **The build order** for what is still left.

Tick a box only when that exact piece is really finished. A screen that looks done on mock data is not the same as the backend for that feature.

**How to talk about it.** The product idea, the database, sign-in, onboarding, the niche list, and the three free roadmaps are real. Lessons on those paths play the stored resources. There is no quiz: the feature was dropped, and the explain-back gate is the only check. Explain-back grading is still a mock screen. Streaks display a stored number and do not advance. Stripe and the leaderboard score are not running.

`AGENTS.md` is the short context a new session should read. This file is the longer record.

Last aligned with the working tree on 1 October 2026.

---

## Where the project stands

| Area | State | What that means in a sentence |
| --- | --- | --- |
| Product shape, tokens, component kit | Done | Dark/light theme, accent presets, shared buttons, cards, charts |
| Public pages | Done | Landing, login, signup, privacy, terms. Landing names Travel Vlogging with the other two free paths |
| Database schema and local Postgres | Done | Prisma models and migrations, through the open-source community tables |
| Open Source community | Done | Contribute, review (approve, request changes, close), author edit, resubmit and withdraw, unmerge, roles, gaps, the maintainers panel, `/admin/community`, and a contributor profile with a heatmap. Only merged work is public |
| Auth | Done for email/password | Auth.js, bcrypt passwords, JWT session, route protection. Google is configured in code. The login screen is email and password |
| Onboarding | Done and saved | Skill, pace, goal, and accent are written to Postgres |
| Niches and roadmaps | Done for three paths | Full-Stack, Travel Vlogging, and Content Creation are free and available. Art stays a coming-soon flagship |
| Lessons and clips | Done for stored resources | The player reads `Resource` rows. YouTube watch links are rewritten into an embed |
| Admin catalog and submissions | Done | An admin can edit stages and resources, and an approval creates a resource |
| Caching | Done for shared catalog and community lists | Niche grid, lessons, clips, and the submit picker share the catalog tag. Merged community pages share the community tag. Progress and the account menu stay per person |
| Settings follow | Done | Add and remove on the settings page write `UserSkillProgress`. Home links to the niche list instead of a fake Add |
| Explain-back AI | Not started | Prompts are stored. The explain-back screen still reads mock data. The quiz feature was dropped |
| Unlock by mastery | Not in Version 1 | A free path locks its last three stages. A pass does not open the next one |
| Tests, deploy, monitoring | Not started | No test suite, no production host, no Sentry |

---

## Revision: explain the product first

SkillFlow is a learning app that checks whether someone understood a lesson, instead of counting how long they watched.

The loop, as designed:

1. Follow one or more skills. Home shows a row for each skill on the feed.
2. Follow that skill's stages in order.
3. Open a lesson made of real external resources (a video, a doc, a course link), or bring your own resource.
4. Pass the explain-back gate: explain the idea in your own words. The product asks one follow-up on the weak part of the answer.
5. A real pass is supposed to open the next stage.

There is no quiz. That feature was dropped, and the explain-back is the mastery check. Steps 4 and 5 are designed and partly stored. They are not what opens a stage today. On a free available path, every stage is open except the last three.

What the product refuses: comments, likes, view counts, trending, prize leaderboards, and guilt copy when a streak breaks. Progress is meant to be verified understanding, not time spent.

**Version 1 free flagships**

- Full-Stack Web Development (`full-stack-web-dev`) — 12 stages, 64 resources, 17 marked for review. Stages 1–9 open.
- Travel Vlogging (`travel-vlogging`) — 8 stages, 46 resources, 9 marked for review. Stages 1–5 open. This replaced Art as the third free path.
- Content Creation (`content-creation`) — 10 stages, 57 resources, 13 marked for review. Stages 1–7 open.

**Art & Painting** (`art-painting`) is still a flagship. It is coming soon, not free, and has no stages. It was not deleted. Photography and Music Production are coming soon and are not flagships. The rest of the niche list is coming soon and monetized. A niche card is a link only when the skill is available and has at least one stage.

Two roles exist: `USER` and `ADMIN`. An admin is the only person who can open the catalog and the submission queue. Everyone else gets a not-found page.

Landing, the auth carousel, and onboarding name Travel Vlogging with Full-Stack and Content Creation. The unwired milestone mock in `lib/mock/catalog.ts` still uses Art.

---

## Revision: stack, and why each piece is there

- **Next.js 16.3.4 App Router.** Pages are Server Components by default. Data loading stays on the server. A file is `"use client"` only when it needs a click, a form, or a chart. Read `node_modules/next/dist/docs/` before using a Next API. This release does not match older Next.js habits. `middleware.ts` is gone. `proxy.ts` is the signed-in gate. Cache Components are on. The niche grid, lesson screens, clip list, and submit picker are cached for every learner. Admin saves expire that cache. Progress and the account menu stay per person.
- **React 19.2.8 and TypeScript.** The page, the view models, and the Prisma models share shapes.
- **Tailwind v4 and CSS variables.** Colors, type, and spacing live in `app/globals.css`. Dark and light are a class on `<html>`. The accent is a `data-accent` value. Public pages stay on the Dusk accent. Inside the app, the person can pick one of ten presets or a custom two-stop gradient. A custom choice is stored as `custom:#start:#end` on the profile and in the accent cookie, and it paints before the page loads.
- **PostgreSQL and Prisma 6.19.3.** Local database name is `skillflow` on port 5432. Migrations are SQL files in `prisma/migrations`. `prisma.config.ts` loads `.env` with `dotenv/config` because Prisma 6 stopped doing that by itself.
- **Auth.js (NextAuth v5 beta).** Email and password today. Passwords are bcrypt hashes on `User.password`. Sessions are JWTs. `trustHost` is true. The Credentials provider needs the JWT strategy, so this app does not use database sessions. The JWT callback copies `id` and `role` onto the token. The session callback copies them onto `session.user`.
- **`lib/prisma.ts`.** One Prisma Client for the process, stored on `globalThis` in development.
- **`proxy.ts`.** If there is no session, a visit to a signed-in URL redirects to `/login`. Role checks are not done here. Admin pages call `requireAdmin()` themselves.
- **`lib/data`.** Each loader starts with `import "server-only"`. Catalog, lesson, clips, dashboard, settings, submissions, admin catalog, and creator studio read Prisma. Milestone (explain-back) and the remaining Version 2 previews still read `lib/mock`.

---

## Revision: caching

Public pages are static. `/`, `/login`, `/signup`, `/privacy`, and `/terms` do not read a session, so Next.js builds them once and does not ask the server for that HTML on every visit.

Signed-in pages are not fully static. Follow marks, mastery, and the account menu differ per person. `cacheComponents` is on in `next.config.ts`. The part that is the same for every visitor is cached with `"use cache"`:

- The niche grid, including the card template
- Lesson screens, including a locked stage. The lock is the last three stages of a free path, so it is the same for every learner
- Clip items from open stages
- The submit-a-resource skill picker
- The public catalog those screens read (`lib/data/public-catalog.ts`)

The lifetime is `cacheLife("hours")`. The tag is `catalog` (`lib/cache/tags.ts`). An admin catalog save and an approved submission call `invalidateCatalog()`, which is `updateTag`, so the edit shows up immediately. A catalog import run from a script cannot call `updateTag`. That change shows up when the hour-long cache refreshes.

The niches page does not cache each page separately. It caches the full list once, then the browser shows 4 columns by 8 rows (32 cards) and turns the page locally. Home and the roadmap index use a second cached render of that same catalog: 4 columns by 3 rows, a blurred peek of the next row, and a link to `/skills`.

Progress, streaks, follow state, explain-back history, and the account menu stay on the request. The account name is cached per user under `account:${userId}` and expires when that person saves their name. A cached function returns plain data. It does not call `auth()`, `cookies()`, or `headers()`.

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
- `ExplainBackPrompt` is one per stage. The importer writes the question and the rubric. `ExplainBackAttempt` is ready for a later grader. The milestone screen does not read this table yet.
- `UserSkillProgress` is one row per user per skill: `masteryPercent`, `currentStageOrder`.
- `StageCompletion` is one row per user per stage: `explainBackPassed` and `completedAt` (`quizPassed` is unused). A stage counts as passed when the explain-back passed. The free-path lock does not read these flags.

Migrations, in order: `20260923010253_init`, `20260925094514_add_paddword_field` (the folder name has that spelling), `20260928092404_add_learner_profile`, `20260930032000_add_niche_enum`, `20260930040000_drop_niche_enum`, `20260930043000_add_skill_image`, `20260930113000_catalog_metadata`, `20260930140000_skill_offer`, `20260930150000_stage_image`.

Seed: base skills are Full-Stack, Travel Vlogging, Content Creation, Art & Painting, Photography, and Music Production, then the extra niches. Flagships are available and free, except Art, which the seed forces to coming soon and monetized. The seed then imports the three catalog files. Do not run it against a database that already has accounts. It resets admin passwords.

---

## Revision: what a person can do in the app today

**Account.** Sign up with name, email, and password. Log in with email and password. Log out from the account menu. After signup the app sends them to onboarding, then home.

**Onboarding.** Pick a skill, a pace, a goal, and an accent. Save writes `LearnerProfile` and a `UserSkillProgress` row when that skill exists. Pace does not decide which stages are open. The last-three lock does. The skill choices are Full-Stack, Travel Vlogging, Content Creation, Photography, and Music Production.

**Shell.** Every signed-in page sits in `app/(app)`. The URL does not contain `(app)`. Desktop shows a fixed sidebar from 960px up. Below that, the sidebar is a dialog drawer. Main nav includes Home, Clips, Roadmaps, Progress, Analytics, Submit a resource, and Settings. Admin appears only when `role === ADMIN`.

**Niches (`/skills`).** Search and group filters, then 32 cards a page (4 columns by 8 rows). An available skill with stages is a link to its roadmap. A coming-soon skill is a card, not a link. Travel shows "Free · 8 stages". Art shows "Coming soon". Narrow screens stack the same 32 cards into fewer columns.

**Home.** Streak banner, four stats from the signed-in user (zeros until there are attempts), and one horizontal row per followed skill. Open stages link to the lesson. Locked stages do not. Explore shows 4 columns by 3 rows of niche cards, a blurred peek of the next row, and Explore all the niches. The real follow is Settings.

**Roadmaps.** The index says the three free paths by name. A followed skill has Continue and Open path. More skills is the same short niche teaser as Home. A path page shows the stage photo, the real description when the stage is open, and "This part of the path stays locked." when it is not. Stage photos are 16:9 files in `public/uploads`. That folder is gitignored, so a clone does not include them.

**Lesson.** The first video is the clip. Other resources are sources. A course link is labeled "Course". Pressing play loads `youtube-nocookie.com/embed/...`. A locked lesson shows the stage title and the skill name, and does not include the resource text. Direct visits to a locked stage id behave the same way.

**Clips.** Short-form resources from the database, without comments.

**No quiz.** The quiz feature was dropped. There is no `/quiz` route, no quiz stat, and no “Continue to quiz” button. The lesson's next step is the explain-back.

**Explain-back.** The question and rubric are in the database for every imported stage. The screen at `/milestone/[stageId]` still looks up the old mock catalog, so a real stage id does not open it. Grading is not a model call. `review failed` is still the mock error string.

**Progress and analytics.** Counts come from `ExplainBackAttempt` and `StageCompletion`. Home and Progress show “Explain-backs passed”. Weak topics are empty. The analytics series is not the old mock week.

**Settings.** Name saves to `User`. Email is read-only. Add follows an available skill. Coming-soon skills have no Add button. Remove drops `UserSkillProgress` and keeps attempts. The daily reminder toggle is still local to the page. Theme and accent apply immediately. The accent row keeps the ten presets and adds a custom gradient: a color palette, a hex field, and R, G, and B for each stop. Log out uses the real `signOut`.

**Submit and admin.** Submit writes `ResourceSubmission`. Approve appends a `Resource` on that stage. Reject requires a note. `fail this submit` and `fail this review` are the built-in error cases. A non-admin who opens an admin URL gets not-found.

**Admin catalog.** Lists every niche, with Flagship and Available or Coming soon. The stage editor includes skills that already have stages: Full-Stack, Travel Vlogging, and Content Creation. Needs review only filters the resource list. Saving a resource titled `fail this save` is the built-in error.

**Version 2 previews, not linked from the main nav.** Each one is labeled "Version 2 preview".

- `/upgrade` — one premium tier. Price text is the word Placeholder. No Stripe.
- `/leaderboard` — sample rows. Score is not calculated.
- `/transcript/[userId]/[skillSlug]` — shareable page, `noindex`. Not built from milestone rows.
- `/notes` — one sample note.
- `/projects/[stageId]/review` — rubric UI. No matching.
- `/creator` — moved to the main nav. See V2 phase 7.
- `/submit/byor` — bring your own resource and get a sample explain-back gate prompt.
- Usage-cutoff dialog — a soft stop. Not stored.
- `/dev/routes` — screen list. It 404s in production.

**Open Source.** Each niche is a community that works like pull requests. A learner shares a resource, a concept note, a learning path, or someone to follow, optionally for a reported gap. It stays hidden until a reviewer decides: approve (merged and public), request changes (with a note), or close. `/open-source/me` lists the author's own work with status filters and a count of items waiting on them. The author can edit while it is open, resubmit a merged one (it leaves the public lists until reviewed again), or withdraw. Reviewers work from `/open-source/review`, oldest first, never their own. Maintainers unmerge, label and close gaps, and grant reviewers from the niche's Maintainers tab, which also suggests people with 3 merged contributions. Admins grant any role by exact email at `/admin/community`. A profile shows merged work by niche and a 12-month heatmap. There are no comments, likes, or chat. A review is one structured decision.

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

Stage photos were generated for all 10 Content Creation stages and all 8 Travel stages, and Full-Stack already had them. The importer leaves `image` unset so a reimport does not clear the photo.

---

## Revision: decisions worth saying out loud

- **JWT sessions, not database sessions.** Auth.js Credentials does not support database sessions. Revoking one session means changing the secret or waiting for expiry.
- **Google is in `lib/auth.ts`. The login form does not show a Google button.**
- **Proxy is not the admin check.** The proxy only asks "is someone signed in?". `requireAdmin()` asks "is this person an admin?".
- **Public pages stay static.** `/`, `/login`, `/signup`, `/privacy`, and `/terms` do not call `auth()` in the root layout.
- **Shared screens are one cached copy. Personal progress is not.** The niche grid, lessons, clips, and the submit picker use the `catalog` tag. Admin saves expire it at once. Follow marks, mastery, and the account menu stay on the request.
- **The feed can hold more than one skill.** Onboarding saves one profile skill. Settings can add more available skills. Home renders one row per followed skill. The old "one skill only" rule is not what the screen does.
- **The last three stages are the Version 1 lock.** It is not a mastery gate.
- **The quiz was dropped.** One explain-back gate per stage is the check, plus a bring-your-own-resource prompt. The quiz tables stay in the schema unused, so the database did not change. Coming-soon and monetized skills open no stages.
- **Art stayed a flagship.** Travel took its place as the third free path. Art is coming soon so a card does not promise a path that has no stages.
- **The importer must not own availability.** A researched file can say coming soon while the product decision is to open the path. Status is set on the row, and the seed special-cases Art so a later seed does not undo that.
- **Do not run the full seed to reload one path.** Use the importer, then a targeted update for status and offer.
- **Open Source is review-gated, not a forum.** Contributions never enter the catalog tables. A review is one decision with a reason, not a thread. Every decision only applies if the status and revision still match what the reviewer opened, so two reviewers cannot both act on one item.
- **AniVerse was a structural reference.** The magenta palette, likes, and follower counts were not copied.

---

## Do not claim these in an interview yet

- A model grades explanations.
- Passing an explain-back unlocks the next stage.
- SkillFlow has a quiz.
- Streaks update from daily activity.
- Mastery percent is calculated from attempts.
- Stripe charges anyone, or a leaderboard score is computed.
- The app is deployed, monitored, or covered by tests.
- Every accent and a 375px phone width were fully audited.
- Art & Painting has a roadmap. It does not.

---

# VERSION 1 — MVP (build order)

Do not start a later phase's backend until the previous phase's open boxes are done. The presentation screens above are allowed to exist early. They do not count as the phase being finished.

## Guiding principles

- [ ] **Twelve-factor** — config in env vars, stateless JWT. Open until deploy and prod parity exist.
- [x] **Resource-shaped writes** — Server Actions and Zod on catalog, settings, and submission writes. There is no separate REST API.
- [x] **Separation of page and data** — pages call `lib/data`. Catalog paths do not embed the mock arrays. Milestone and Version 2 still do.
- [x] **Shared tokens and components** — colors and type come from `globals.css`.
- [ ] **Idempotent writes** — catalog reimport is idempotent. Explain-back submit and webhooks are not built.
- [x] **Version fields on explain-back** — columns exist. No second version has been stored.
- [x] **Conventional commits** — history uses `feat`, `fix`, and `chore`.
- [ ] **OWASP baseline** — passwords are hashed, secrets stay in `.env`, admin routes check role. A full threat pass is not done.
- [ ] **Accessibility** — semantic headings, labels, and focus are in the kit. A full keyboard and contrast pass is not done.
- [ ] **Tests** — none yet.
- [x] **README and agent context** — `README.md`, `AGENTS.md`, and this file match the three free paths and the shared-content cache. The case study is not written.

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

- [x] Feature list locked. The three free Version 1 paths are Full-Stack, Travel Vlogging, and Content Creation. Art remains a named flagship and is coming soon
- [x] Repo, Next.js 16, TypeScript, git
- [x] Dependencies: Prisma, Auth.js, bcrypt, Tailwind, Recharts

## PHASE 1 — UI foundation
**Status: ✅ COMPLETE**

- [x] Tokens in `app/globals.css` (Tailwind v4 `@theme`)
- [x] Dark and light, class on `<html>`, cookie `skillflow-theme`. Default is dark
- [x] Accent presets, plus a custom gradient from the palette, hex, or RGB. Public pages force Dusk. The signed-in app uses the saved accent
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
- [x] Seed knows the three catalogs and the Art exception. Do not re-run it casually
- [x] Email/password sign-in and sign-up
- [x] `proxy.ts` redirects anonymous visitors
- [x] JWT session strategy
- [ ] GitHub OAuth — not built. Google is in config only, and the form does not offer it
- [ ] Database sessions — not used, and not the plan anymore

**Interview bugs already hit.** Prisma 6 does not auto-load `.env`. Docker named volumes keep the first Postgres password forever.

## PHASE 3 — Catalog, roadmap, and admin
**Status: ✅ COMPLETE for the three free paths**

- [x] Roadmap, lesson, clips, home, and niches read Prisma
- [x] Admin catalog editor for stages, resources, explain-back prompts, and the needs-review filter
- [x] Niche list with available and coming soon
- [x] Submit creates `ResourceSubmission`. Approval creates `Resource`
- [x] Zod on those writes
- [x] Free paths lock the last three stages without hiding the titles
- [x] YouTube links play inside the lesson
- [ ] Tests for roadmap and resource reads

## PHASE 4 — AI explain-back
**Status: ⬜ NOT STARTED as a backend. Prompts are stored. The grader is not.**

**Already stored or on screen:**

- One explain-back question and rubric per imported stage
- The old milestone screen still has text, a mocked voice path, a follow-up, pass, retry, and the `review failed` error. It does not open for a real stage id

**Still open:**

- [ ] Resource text (catalog or brought by the learner) → model → explain-back prompt and rubric
- [ ] Timeout and bad JSON handled without breaking the lesson
- [ ] Milestone page reads `ExplainBackPrompt`
- [ ] Multi-turn grading that writes `ExplainBackAttempt`
- [ ] An eval set of good and thin answers
- [ ] A pass that updates `StageCompletion` — only if the product chooses to gate on it. Version 1 does not

## PHASE 5 — Mastery, streaks, progress data
**Status: 🔶 COUNTS ARE REAL. THE FORMULAS ARE NOT**

- [x] Progress, analytics, and home read `User` streak fields and attempt counts
- [ ] A formula for mastery percent that can be explained
- [ ] Weak topics computed from attempts
- [ ] A streak update from `lastActivityDate`
- [ ] Charts drawn from those attempts rather than left empty

## PHASE 6 — Frontend on real data
**Status: 🔶 THE LEARNING PATH IS ON REAL DATA. EXPLAIN-BACK AND VERSION 2 ARE NOT**

- [x] App shell, home, clips, roadmaps, lesson, settings, submit, admin catalog
- [x] Shared catalog cache for the niche grid, lessons, clips, and the submit picker. Admin saves expire it
- [x] Loading skeletons, empty states, and the locked-stage state
- [x] Stage photos on the three paths
- [x] Settings follow and unfollow
- [ ] Explain-back UI calling a real grader
- [x] Home and roadmap no longer show a preview Add. Explore links to the niche list. Follow stays on Settings
- [ ] A full responsive pass, including 375px
- [x] Landing, auth carousel, and onboarding name Travel Vlogging instead of Art

## PHASE 7 — Content seeding
**Status: ✅ COMPLETE for the three Version 1 paths. Art is intentionally empty.**

- [x] Full-Stack path loaded from `content/catalog/full-stack-web-development.json`
- [x] Content Creation loaded from `content/catalog/content-creation.json`
- [x] Travel Vlogging loaded from `content/catalog/travel-vlogging.json`
- [x] Explain-back prompt on every imported stage
- [x] Photography, Music Production, and the extra niches stay coming soon
- [ ] Art & Painting researched and loaded, when that path is actually chosen
- [ ] The 403 links rechecked by a person. Do not replace them just because the bot was blocked

The mock catalog in `lib/mock/catalog.ts` is leftover sample data for the screens that are not wired. It is not the seed.

## OPEN SOURCE — Community contributions
**Status: ✅ COMPLETE**

- [x] Contribute form with type, sources, stage, gap, tags, and disclosure. Links are normalized and checked; duplicates against the niche and the official roadmap are refused
- [x] Review queue and review page with duplicates, author record, and history. Approve, request changes, close, with a check that nothing changed since the page was opened
- [x] Author pages: list, owner view with reasons in plain words, edit, resubmit, withdraw
- [x] Unmerge with a reason. A resolved gap reopens
- [x] Roles: admin grants either role, maintainers grant reviewers, nobody changes their own. Suggested reviewers in two groups
- [x] Maintainers tab and `/admin/community` (niche load, grant by email, revoke, recent unmerges)
- [x] Gaps: report (3 a day), good-first label, close, reopen, contribute to a gap
- [x] Contributor section on the public profile with a 12-month heatmap
- [x] `community` cache tag for public data; per-request queue, counts, and author pages
- [ ] Notify an author when a decision lands
- [ ] Integration tests for review, edit, and unmerge

## PHASE 8 — Testing
**Status: ⬜ NOT STARTED**

- [ ] Unit tests for the open-stage rule, mastery, and streaks
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

- [x] README aligned with the three free paths and the catalog commands
- [x] `AGENTS.md` aligned so a new chat does not revive the mock-catalog story
- [x] This file aligned
- [ ] Case study: the problem, what existing products optimize for, and what SkillFlow refused to copy
- [ ] A short recording of the loop
- [ ] A diagram of browser → Server Component → `lib/data` → Prisma

---

# VERSION 2 — after Version 1

Do not build the backend for these until the Version 1 gaps that are still open (explain-back, streaks, tests, deploy) are done. The UI previews already exist so the product can be shown. They are not these phases.

## V2 PHASE 1 — Premium and Stripe
**Status: ⬜ NOT STARTED. `/upgrade` is a preview. Price label is "Placeholder".**

The data model already has `Skill.offer` and `RoadmapStage.monetized`. Version 1 uses that only to keep non-free skills closed. It is not a checkout.

- [ ] Stripe test keys, customer and subscription ids
- [ ] Checkout session, webhook with signature check, idempotent upgrades and downgrades
- [ ] Premium features gated on the server
- [ ] No card fields on our origin

## V2 PHASE 2 — Score and leaderboard
**Status: ⬜ NOT STARTED. `/leaderboard` is sample rows.**

- [ ] Formula from verified actions only
- [ ] Optional self-reported city, not geolocation
- [ ] Score updated when a stage is completed, not in the browser
- [ ] No prizes

## V2 PHASE 3 — Explanations reused as lessons
**Status: ⬜ NOT STARTED. Needs real explain-back volume.**

## V2 PHASE 4 — Transcript
**Status: ⬜ NOT STARTED as data. The page exists and is `noindex`.**

## V2 PHASE 5 — Notes
**Status: ⬜ NOT STARTED. One mock note is on `/notes`.**

## V2 PHASE 6 — Peer project review
**Status: ⬜ NOT STARTED. The rubric UI exists.**

## V2 PHASE 7 — Creators
**Status: 🔶 STUDIO IS LIVE. Profile rating and earnings are not.**

A signed-in learner uploads a short clip or a longer video they own, picks one available niche, and sends it for review. `/admin/creator` approves it onto that niche’s clip feed and `/profile/[userId]`. The studio keeps drafts and shows views, watch time, and how many plays reached most of the video. The feed and the public profile do not show those numbers. Replacing the file on a live video sends it back for review. A creator rating on the profile, and any earnings, are still later.

## V2 PHASE 8 — Generated roadmaps
**Status: ⬜ NOT STARTED. Hand-written paths stay the default.**

## V2 PHASE 9 — More niches
**Status: 🔶 NAMES EXIST. PATHS DO NOT**

The extra niches are in the database and show as coming soon. A new path is a researched JSON file plus an import, not a generated roadmap. Art is the named flagship still waiting for that file.

## V2 PHASE 10 — Smaller extras
**Status: 🔶 UI ONLY for two of these**

- [x] Usage-cutoff dialog (soft: take a break, or continue)
- [x] Bring-your-own-resource page that turns a resource into a sample explain-back gate prompt
- [ ] Spaced repetition
- [ ] A certificate that is lighter than the transcript

---

**Right now.** Phases 0, 1, 2, 3, and 7 are done for the three free paths, and the Open Source community is complete. Phase 6 is done for those screens and open for explain-back. Phases 4, 5, 8, and 9 are the remaining Version 1 backend. Next product step, when you choose it, is Phase 4: make the explain-back screen read the prompt that is already saved, then grade it.
