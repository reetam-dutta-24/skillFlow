# SkillFlow — Master Project Roadmap

This file is two things at once:

1. **Revision notes** for explaining the project in a pitch or a technical interview.
2. **The build order** for what is still left.

Tick a box only when that exact piece is really finished. A screen that looks done on mock data is not the same as the backend for that feature.

**How to talk about it.** Say what is live, then say what is still a designed screen on sample data. The product idea, the database, sign-in, and onboarding are real. Lessons, quizzes, explain-back grading, streaks, and the charts are a complete front end on mock data. The AI calls, Stripe, and the leaderboard score are not running yet.

Scope of the MVP: three flagship skills (Full-Stack Web Development, Art & Painting, Content Creation). Full-Stack is the only skill with roadmap stages in the database. The other skills exist as names. One person follows one skill at a time. The feed does not mix niches.

---

## Where the project stands

| Area | State | What that means in a sentence |
| --- | --- | --- |
| Product shape, tokens, component kit | Done | Dark/light theme, accent presets, shared buttons, cards, charts |
| Public pages | Done | Landing, login, signup, privacy, terms |
| Database schema and local Postgres | Done | Prisma models, three migrations, seed of skills and Full-Stack stages |
| Auth | Done for email/password | Auth.js, bcrypt passwords, JWT session, route protection. Google is configured in code. The login screen people use is email and password |
| Onboarding | Done and saved | Skill, pace, goal, and accent are written to Postgres |
| Signed-in screens | Built, mostly mock | Home, clips, roadmaps, lesson, quiz, explain-back, progress, analytics, settings, submit, admin |
| Version 2 screens | UI preview only | Upgrade, leaderboard, transcript, notes, project review, creator, bring-your-own-resource, usage cutoff. Not in the main sidebar. No Stripe, no real score, no real AI |
| Quiz and explain-back AI | Not started | The screens walk through a scripted result. Nothing is graded by a model, and a pass is not saved |
| Tests, deploy, monitoring | Not started | No test suite, no production host, no Sentry |

The old note at the bottom of this file said the repo had been reset and Phase 2 had not started. That is no longer true. Ignore that story.

---

## Revision: explain the product first

SkillFlow is a learning app that checks whether someone understood a lesson, instead of counting how long they watched.

The loop, as designed:

1. Pick one skill.
2. Follow that skill's stages in order.
3. Open a lesson made of real external resources (a short clip, a doc, a course link).
4. Take a short quiz grounded in that lesson.
5. Explain the idea in your own words. The product asks one follow-up on the weak part of the answer.
6. Only a real pass opens the next stage.

What the product refuses: comments, likes, view counts, trending, prize leaderboards, and guilt copy when a streak breaks. Progress is verified understanding, not time spent.

Three flagship skills are named in the product: Full-Stack Web Development, Art & Painting, and Content Creation. Photography and Music Production are shown as coming soon so the taxonomy is honest about what is not ready.

Two roles exist in the schema and on the session: `USER` and `ADMIN`. An admin is the only person who can open the submission queue. Everyone else gets a not-found page, so the URL does not advertise that the tool exists.

---

## Revision: stack, and why each piece is there

- **Next.js 16 App Router.** Pages are Server Components by default. Data loading stays on the server. A file is `"use client"` only when it needs a click, a form, or a chart.
- **TypeScript.** The page, the mock data, and the Prisma models share shapes. A wrong field fails at compile time.
- **Tailwind v4 and CSS variables.** Colors, type, and spacing live in `app/globals.css`. Dark and light are a class on `<html>`. The accent is a `data-accent` value. Public pages stay on the Dusk accent. Inside the app, the person can pick another preset and it is stored.
- **PostgreSQL in Docker, Prisma 6.** Local database is the same on every machine. Migrations are SQL files in `prisma/migrations`, so the history of the schema is in git. `prisma.config.ts` loads `.env` with `dotenv/config` because Prisma 6 stopped doing that by itself.
- **Auth.js (NextAuth v5).** Email and password today. Passwords are bcrypt hashes on `User.password`. Sessions are JWTs. The Credentials provider in Auth.js needs the JWT strategy, so this app does not use database sessions. The JWT callback copies `id` and `role` onto the token. The session callback copies them onto `session.user`.
- **`lib/prisma.ts`.** One Prisma Client for the process, stored on `globalThis` in development, so hot reload does not open a new database connection every save.
- **`proxy.ts`.** Next.js 16's middleware file. If there is no session, a visit to a signed-in URL redirects to `/login` with no callback URL. The matcher lists each path on its own. Role checks are not done here. Admin pages call `requireAdmin()` themselves.
- **Mock data in `lib/mock`, read through `lib/data`.** Each data file starts with `import "server-only"`. Pages do not import the mock catalog. Later, swapping a screen onto Prisma is a change inside `lib/data` only. In development those loaders wait 800ms so the skeleton can be seen.

---

## Revision: the database, table by table

Auth.js tables: `User`, `Account`, `Session`, `VerificationToken`. `User` also has `role` (`USER` or `ADMIN`), `password`, `currentStreak`, `longestStreak`, and `lastActivityDate`.

`LearnerProfile` is one row per user: `skillSlug`, `pace`, `goal`, `accent`. Added in migration `20260928092404_add_learner_profile`. This is the source of truth for which skill they follow. The password column was added in `20260925094514_add_paddword_field` (the migration folder name has that spelling). The first migration is `20260923010253_init`.

Content tables, ready but mostly empty:

- `Skill` → `RoadmapStage` → `Resource`. A stage belongs to one skill. `@@unique([skillId, order])` stops two stages sharing the same position. A resource stores a snapshot (`title`, `description`, `keyPoints`, `transcript`) so a dead URL can still show what the lesson covered, and so a future quiz can be written from that text instead of from a live scrape.
- `ResourceSubmission` is the waiting room. A suggestion stays here until an admin approves it. Approval is supposed to create a real `Resource`. That promotion is not built yet. The admin screen is a mock.
- `Quiz`, `QuizQuestion`, `QuizAttempt`. `Quiz.version` is there so a later prompt change can be compared with older attempts.
- `ExplainBackPrompt`, `ExplainBackAttempt`. The attempt stores the first explanation, the follow-up, the verdict (`PASSED` or `NEEDS_IMPROVEMENT`), and the feedback.
- `UserSkillProgress` is one row per user per skill: `masteryPercent`, `currentStageOrder`.
- `StageCompletion` is one row per user per stage: `quizPassed`, `explainBackPassed`, `completedAt`. Both flags are meant to be true before the next stage opens. The screens do not write this row yet.

Seed today: five skills, and five Full-Stack stages (React Fundamentals, Hooks & State, Server Actions, Auth & Sessions, Database & Prisma). No resources, quizzes, or explain-back prompts are in the database yet. The rich lesson content lives in `lib/mock/catalog.ts`.

---

## Revision: what a person can do in the app today

**Account.** Sign up with name, email, and password. Log in with email and password. Log out from the account menu. After signup the app sends them to onboarding, then home.

**Onboarding.** Pick a skill, a pace (steady, focused, or deep), a goal, and an accent. Save writes `LearnerProfile` and, when that skill exists in the database, a `UserSkillProgress` row. Focused pace is defined as opening the first two stages. Any other pace opens the first stage. The home feed still reads the mock catalog, so that pace rule is not what the home screen uses yet.

**Shell.** Every signed-in page sits in `app/(app)`. The URL does not contain `(app)`. Desktop shows a fixed sidebar from 960px up. Below that, the sidebar is a dialog drawer. The top bar has the page title, theme toggle, a quiet notification dot (not a number), and the account menu. There is no search box. Main nav: Home, Clips, Roadmaps, Progress, Analytics, Submit a resource, Settings. Admin appears only when `role === ADMIN`.

**Home.** Streak banner, four stats, one horizontal row per followed skill, and an explore area for skills they have not followed. The numbers on this page are the mock learner (streak 12, longest 21, 3 milestones this week, 28 quizzes, 2 skills). They are not read from `User.currentStreak`.

**Clips.** A separate sidebar section for short-form video, filtered by niche, without comments. Added because the product needed a designated clip feed. It is mock content.

**Roadmaps, lesson, quiz, explain-back.** Full-Stack stages match the seed names. Stage 1 is shown as passed. Stage 2 (Hooks & State) is in progress, with a 5-question quiz. Pass mark is `QUIZ_PASS_THRESHOLD = 0.8` (4 of 5), stored as a placeholder constant. A miss shows a written explanation. Explain-back asks why `useEffect` needs a dependency array, then one follow-up, then a pass or a retry. Voice input is a mock transcript, not a real microphone upload. A locked stage does not include its resources. One Hooks & State resource is marked unavailable so the lesson can show the saved snapshot instead of a broken embed. Videos use a click-to-play facade and the id `skillflow-placeholder`. Nothing is embedded until play is pressed. A pass on the quiz or the explain-back is not written to the database, so a refresh returns to the mock state.

**Progress.** Same stat idea as home, a mastery ring per followed skill, a six-month line, a table alternative, and a weak-topic list (useEffect cleanup, colour temperature) with a review link.

**Analytics.** Extra sidebar page, built with Recharts. It shows the week's check-ins (Wednesday empty, Saturday busiest), mastery split, growth since April, quiz outcomes, and explain-back outcomes, plus short sentences about what those numbers mean. The series are mock, consistent with the 28 quizzes.

**Settings.** Name can be saved in the browser session of that page. Email is read-only. Skills can be added or removed with a note that progress is kept. Daily streak reminder toggle. Theme and accent apply immediately. Log out uses the real `signOut`. In development, a button opens the usage-cutoff dialog. These skill and reminder changes are not written to Postgres. Refreshing brings back the mock list.

**Submit and admin.** The suggestion form checks for an https link, a title, a skill, and a stage. `?stageId=` can prefill the stage. The person's own list shows pending, approved, and rejected, including a rejection note. The admin table is denser, with status tabs and a review dialog. Approve asks for confirmation that it would publish to the roadmap. Reject requires a note. Typing the notes `fail this review` shows the error state. None of this inserts a `ResourceSubmission` or a `Resource`. A non-admin who opens `/admin/submissions` gets not-found, from `requireAdmin()` on the page and on the review action.

**Version 2 previews, not linked from the main nav.** Each one is labeled "Version 2 preview".

- `/upgrade` — one premium tier, free versus premium, price text is the word Placeholder. The Stripe button only describes what Checkout would do. No card fields.
- `/leaderboard` — Global, Country, and City in the URL. Rank, name, city, score. The signed-in row is highlighted. Score is described as verified mastery. No prizes.
- `/transcript/[userId]/[skillSlug]` — shareable page, `noindex`. Milestones with quiz and explain-back dates. The owner (`me` or their user id) can copy a link or pretend to download a PDF.
- `/notes` — one sample note, search, and a mock "Summarize with AI".
- `/projects/[stageId]/review` — submit a project, or score a peer on a 1–4 rubric. No comment thread. Stage `stage_fs_5` shows "waiting for a peer".
- `/creator` — apply, or preview pending and verified with `?status=`. The verified view shows quiz success rate, not view counts.
- `/submit/byor` — paste an https link and get a mock 5-question preview. The URL `https://example.com/unsupported` is the error case.
- Usage-cutoff dialog — "You have done a solid session today." Take a break, or continue anyway. It is a soft cutoff.
- `/dev/routes` — a list of the screens, for review. It 404s when `NODE_ENV` is production.

**Errors and empty screens.** Root `app/not-found.tsx` and `app/error.tsx` are themed. `app/global-error.tsx` is the last resort. Inside the app, `app/(app)/error.tsx` and `app/(app)/not-found.tsx` keep the shell. Dev-only routes can throw those states on purpose: `/dev/error`, `/dev/missing`, `/dev/root-error`, `/dev/root-missing`. There is no root `app/loading.tsx` yet. Each main signed-in route has its own `loading.tsx`.

---

## Revision: decisions worth saying out loud

- **JWT sessions, not database sessions.** Auth.js Credentials does not support database sessions. The session cookie is a signed JWT. Role is read from that token. Tradeoff: revoking one session means changing the secret or waiting for expiry, not deleting a `Session` row.
- **Google is in `lib/auth.ts`. The login form does not show a Google button.** Sign-in on the page is `signIn("credentials")`. Do not describe Google sign-in as a finished user flow.
- **Proxy is not the admin check.** The proxy only asks "is someone signed in?". `requireAdmin()` asks "is this person an admin?" and calls `notFound()` otherwise.
- **Public pages stay static.** `/`, `/login`, `/signup`, `/privacy`, and `/terms` do not call `auth()` or read cookies in the root layout. Signed-in routes are dynamic on purpose.
- **One skill in the feed.** The mock home shows the two followed skills from the sample learner (Full-Stack and Art). The saved profile is a single `skillSlug`. Those two facts are not connected yet. When the feed is wired, home should show the profile skill only.
- **Mock today, Prisma tomorrow, same page components.** That split is why `lib/data` exists.
- **AniVerse was a structural reference.** Sidebar, cards, charts, and spacing were reused as patterns. The magenta palette, likes, and follower counts were not.

---

## Do not claim these in an interview yet

- A model writes or grades quizzes and explanations.
- Passing a quiz or an explain-back unlocks the next stage in the database.
- Streaks update overnight.
- Mastery percent is calculated from attempts.
- An admin approval creates a live resource.
- Stripe charges anyone, or a leaderboard score is computed.
- The app is deployed, monitored, or covered by tests.
- Every accent and a 375px phone width were fully audited. Dark, light, and more than one accent were checked on the main learning screens. A full phone-width pass was not.

---

# VERSION 1 — MVP (build order)

Do not start a later phase's backend until the previous phase's open boxes are done. The presentation screens above are allowed to exist early. They do not count as the phase being finished.

## Guiding principles

Checked when the related phase is real, not when a screen merely looks right.

- [ ] **Twelve-factor** — config in env vars, stateless processes, dependencies declared. Env vars and a stateless JWT are in place. This stays open until deploy and prod parity exist.
- [ ] **Resource-shaped server API** — the app uses Server Actions and server loaders, not a separate REST API. Validation with a shared schema (Zod) is not in place.
- [x] **Separation of page and data** — pages call `lib/data`. They do not embed the mock arrays. The data functions still return mocks, except onboarding, which writes Prisma.
- [x] **Shared tokens and components** — colors and type come from `globals.css`. Screens reuse the component kit.
- [ ] **Idempotent writes** — not relevant until quiz submit and webhooks save.
- [x] **Version fields on quiz and explain-back** — `version` columns exist on `Quiz` and `ExplainBackPrompt`. No second version has been stored.
- [x] **Conventional commits** — history uses `feat`, `fix`, and `chore` style messages.
- [ ] **OWASP baseline** — passwords are hashed, secrets stay in `.env`, admin routes check role. Server-side validation of every input is not done. Https checks on submit are client-side.
- [ ] **Accessibility** — semantic headings, labels, focus, and live regions are designed in. A full keyboard and contrast pass across every accent is not done.
- [ ] **Tests** — none yet.
- [ ] **README, case study, diagram** — README exists and is short. It still says the project is in Phase 3, which is ahead of the real backend. The case study is not written.

## Non-functional requirements

- [ ] Scalability documented for a real deploy
- [ ] Security: auth works for email/password; input validation and a threat pass are still open
- [ ] Performance: foreign keys exist in the schema; feed queries and caching are not built
- [x] Reliability of a dead link, on the mock lesson only — one resource renders its saved snapshot instead of a blank embed
- [x] Maintainability of the UI layer — tokens, typed view models, `lib/data` boundary
- [ ] Observability (Sentry or equivalent)
- [ ] Usability signed off on every screen in both themes

---

## PHASE 0 — Setup and foundation
**Status: ✅ COMPLETE**

- [x] Feature list and three flagship skills locked
- [x] Repo `reetam-dutta-24/skillFlow`, Next.js 16, TypeScript, git
- [x] Dependencies: Prisma, Auth.js, bcrypt, Tailwind, and later Recharts for the analytics page

**What was done.** The app is a Next.js App Router project. Server Components are the default. TypeScript is strict. Docker Compose runs Postgres for local development so the database is not "whatever is installed on the laptop."

## PHASE 1 — UI foundation
**Status: ✅ COMPLETE for the design system. The signed-in product screens came later and are listed under Phase 6's presentation notes.**

- [x] Tokens in `app/globals.css` (Tailwind v4 `@theme`)
- [x] Dark and light, class on `<html>`, cookie `skillflow-theme`. Default is dark
- [x] Accent presets (tide, iris, grove, ember, dusk, bloom, pulse, volt, ion, nova). Public pages force Dusk. The signed-in app uses the saved accent
- [x] Component kit: buttons, chips, stat cards, skill rows, lesson cards, roadmap stages, lesson player, quiz question, explain-back gate, donut and line charts, empty and error states, settings controls, sidebar and top bar
- [x] Landing, login, and signup are real pages. Landing stays on the public accent. Login and signup use a split layout. The left side is a coverflow of skill images

**What was done.** The first UI pass reused AniVerse's structure and replaced the palette. Later, the signed-in screens were rebuilt on that kit, on mock data, screen by screen: shell, home, roadmaps, lesson, quiz, explain-back, progress, settings, submit, admin, then the version 2 previews, clips, and analytics.

**Button detail worth remembering.** Primary buttons keep their gradient on hover and get slightly brighter. They do not turn into an empty outline.

## PHASE 2 — Data model, auth, and architecture
**Status: 🔶 IN PROGRESS — database and email/password auth are done. GitHub login and database sessions were the original plan and were not what got built.**

**Database (done):**

- [x] Prisma schema for auth, skills, stages, resources, submissions, quizzes, explain-back, progress, and `LearnerProfile`
- [x] Docker Compose Postgres
- [x] `DATABASE_URL` in `.env`
- [x] `prisma.config.ts` imports `dotenv/config`
- [x] Migrations applied: init, password column, learner profile
- [x] Seed: five skills, five Full-Stack stages

**What to say about the schema.** A stage is its own row, not JSON inside a skill, because it has order, resources, a quiz, and completions. Submissions are a separate table so a learner's link cannot appear on a roadmap by itself. The resource snapshot is how a dead URL still teaches, and how a future model would be grounded.

**Interview bugs already hit.** Prisma 6 does not auto-load `.env`; the config file imports dotenv. Docker named volumes keep the first Postgres password forever; changing `docker-compose.yml` later does nothing until the volume is removed.

**Auth (done, with two plan changes):**

- [x] `@auth/prisma-adapter` installed and passed into Auth.js
- [x] `lib/auth.ts` — Credentials provider plus a Google provider in config
- [x] `lib/prisma.ts` singleton
- [x] `AUTH_SECRET` is what signs the JWT (the app cannot sign in without it)
- [x] `app/api/auth/[...nextauth]/route.ts` exports the Auth.js handlers
- [x] Email/password sign-in and sign-up work end to end
- [x] `proxy.ts` redirects anonymous visitors to `/login`
- [x] `(app)` layout also calls `auth()` and redirects if the session is missing
- [ ] GitHub OAuth app, `AUTH_GITHUB_ID`, `AUTH_GITHUB_SECRET` — not built. Google is the OAuth provider in code, and the login form does not offer it yet
- [ ] Database session strategy — not used. JWT is required for Credentials. Do not describe this app as using database sessions

**System design:**

- [x] Prisma singleton, so dev reload does not exhaust connections
- [x] Session strategy is explicit: JWT, because of Credentials
- [ ] A written comparison with database sessions can live in the case study. The reason is already in this file

## PHASE 3 — Core backend: content and roadmap
**Status: ⬜ NOT STARTED, except the two pieces below**

- [x] Onboarding save is a Server Action: validates skill, pace, goal, and accent, upserts `LearnerProfile`, upserts `UserSkillProgress` when the skill row exists
- [x] `requireAdmin()` — no session redirects to login; a signed-in non-admin gets `notFound()`
- [ ] Roadmap CRUD for a real admin (stages are seeded, not edited in the app)
- [ ] Resource ingestion and snapshots written from a real submit
- [ ] Home and roadmap queries that read the signed-in profile and `StageCompletion` (the screens still call the mock catalog)
- [ ] `ResourceSubmission` create, and approval that inserts a `Resource` plus a review note
- [ ] Zod (or equivalent) on those writes
- [ ] Tests for roadmap and resource reads

The submit page and the admin queue are the right UI for this phase. They do not touch those tables yet.

## PHASE 4 — AI quiz and explain-back
**Status: ⬜ NOT STARTED as a backend. The screens and the scripted states are built.**

**Already on screen, mock only:**

- Milestone is the stage, not each resource
- Quiz is one question at a time, with a check, a written miss explanation, and a result of "4 of 5" against the 0.8 threshold
- Explain-back has text, a mocked voice path, a grading wait, one follow-up, pass, retry with the answer kept, and an error if the text is `review failed`
- A stage stays locked in the mock until the sample data says both checks passed

**Still open:**

- [ ] Lesson text → model → stored quiz JSON
- [ ] `Quiz.version` used for real evals
- [ ] Miss explanation generated, not copied from the mock
- [ ] Timeout and bad JSON handled without breaking the lesson
- [ ] Rubric per milestone, stored on `ExplainBackPrompt`
- [ ] Multi-turn grading that writes `ExplainBackAttempt`
- [ ] An eval set of good and thin answers
- [ ] Unlock that updates `StageCompletion` and `currentStageOrder`

## PHASE 5 — Mastery, streaks, progress data
**Status: ⬜ NOT STARTED. Progress and Analytics show the mock series.**

- [ ] A formula for mastery percent that can be explained (quiz accuracy and completed stages, not minutes watched)
- [ ] Weak topics computed from attempts at read time
- [ ] Streak job from `lastActivityDate`
- [ ] Progress page reading `User` and `UserSkillProgress`

## PHASE 6 — Frontend on real data
**Status: 🔶 PRESENTATION DONE. WIRING NOT DONE, except onboarding.**

**Presentation already built (mock data):**

- [x] App shell, home, clips, roadmaps, lesson, quiz, explain-back, progress, analytics, settings, submit, admin
- [x] Loading skeletons on those routes
- [x] Empty, locked, and error states on the learning screens
- [x] Version 2 preview routes, labeled, and kept out of the main sidebar
- [x] Usage-cutoff dialog
- [x] `/dev/routes` in development

**Wiring still open:**

- [x] Onboarding and skill choice saved in Postgres
- [ ] Home feed from the profile, one skill, pace deciding the open stages
- [ ] Roadmap locks from `StageCompletion`
- [ ] Lesson player from `Resource` rows
- [ ] Quiz UI calling the real quiz pipeline
- [ ] Explain-back UI calling the real grader
- [ ] Progress and analytics from real attempts
- [ ] A full responsive pass, including 375px
- [ ] Polish after the data is real, not before

## PHASE 7 — Content seeding
**Status: ⬜ NOT STARTED beyond the name seed**

- [x] Skill names and five Full-Stack stage titles in `prisma/seed.ts`
- [ ] Full-Stack filled out with real resources (the target is a full path, on the order of 15–20 items) before Art or Content Creation get the same treatment
- [ ] Art and Content Creation limited to knowledge that can be checked
- [ ] Quizzes and explain-back prompts reviewed against that rule
- [ ] Photography and Music Production stay visibly "coming soon" until they have that content

The mock catalog already has sample resources and one Hooks & State quiz, for the UI. That file is not the seed.

## PHASE 8 — Testing
**Status: ⬜ NOT STARTED**

- [ ] Unit tests for mastery, streaks, and the quiz/explain-back failure paths
- [ ] Integration tests for roadmap, resource, and quiz reads
- [ ] One end-to-end pass: signup → onboarding → lesson → quiz → explain-back → progress
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

## PHASE 10 — Documentation and case study
**Status: ⬜ NOT STARTED. This roadmap file is the revision draft. The public README is still the short version.**

- [ ] README aligned with this file: what is real, what is mock, how to run it
- [ ] Case study: the problem, what existing products optimize for, and what SkillFlow refused to copy
- [ ] A short recording of the loop
- [ ] A diagram of browser → Server Component → `lib/data` → Prisma, with the mock path drawn beside it

---

# VERSION 2 — after Version 1

Do not build the backend for these until Version 1 phases 0–10 are done. The UI previews already exist so the product can be shown. They are not these phases.

## V2 PHASE 1 — Premium and Stripe
**Status: ⬜ NOT STARTED. `/upgrade` is a mock page. Price label is "Placeholder".**

- [ ] Stripe test keys, `tier` on `User`, customer and subscription ids
- [ ] Checkout session, webhook with signature check, idempotent upgrades and downgrades
- [ ] Premium features gated on the server
- [ ] No card fields on our origin

## V2 PHASE 2 — Score and leaderboard
**Status: ⬜ NOT STARTED. `/leaderboard` is sample rows. Score is not calculated.**

- [ ] Formula from verified actions only
- [ ] Optional self-reported city, not geolocation
- [ ] Score updated when a stage is completed, not in the browser
- [ ] Global, country, and city queries
- [ ] No prizes

## V2 PHASE 3 — Explanations reused as lessons
**Status: ⬜ NOT STARTED. Needs real explain-back volume.**

- [ ] A bar for "strong enough to show someone else"
- [ ] Consent, moderation, and credit or anonymous

## V2 PHASE 4 — Transcript
**Status: ⬜ NOT STARTED as data. The page exists and is `noindex`.**

- [ ] Built from real milestone rows
- [ ] PDF and a privacy switch that is stored

## V2 PHASE 5 — Notes
**Status: ⬜ NOT STARTED. One mock note is on `/notes`.**

- [ ] `Note` model, editor on the lesson, search, export

## V2 PHASE 6 — Peer project review
**Status: ⬜ NOT STARTED. `/projects/[stageId]/review` is a rubric UI.**

- [ ] Matching two people at the same stage
- [ ] Rubric only, plus a report path. No comment thread

## V2 PHASE 7 — Creators
**Status: ⬜ NOT STARTED. `/creator` is an application preview.**

- [ ] Verification, then quality measured by learner quiz success, not views

## V2 PHASE 8 — Generated roadmaps
**Status: ⬜ NOT STARTED. Needs real outcome data first. Hand-written paths stay the default.**

## V2 PHASE 9 — More niches
**Status: ⬜ NOT STARTED. Photography and Music Production are labeled coming soon.**

## V2 PHASE 10 — Smaller extras
**Status: 🔶 UI ONLY for two of these**

- [x] Usage-cutoff dialog (soft: take a break, or continue)
- [x] Bring-your-own-resource page that pretends to generate five questions
- [ ] Spaced repetition
- [ ] A certificate that is lighter than the transcript

---

**Right now.** Version 1 Phases 0 and 1 are complete. Phase 2's database and email/password auth are complete; GitHub login was not built. Phase 3 has onboarding persistence and the admin guard only. Phases 4 through 10 are not done as backend. The signed-in product, including Version 2, can be clicked through on mock data. Next backend step, when you choose to start it, is Phase 3: make home and the roadmap read the saved profile and the stage rows, and make a submission write a real `ResourceSubmission`.
