# SkillFlow — Master Project Roadmap

**This is the single source of truth for build order.** Tick items as completed. Do not
start a phase's items until the previous phase's checklist is fully ticked, and do not
touch anything under "Phase 2+ / Post-MVP" until every box under Phase 0–10 is checked.

Scope = the locked MVP: 3 flagship niches (Full-Stack Web Development, Art/Painting,
Content Creation), one-niche-first sequencing (Full-Stack Web Dev built and fully working
end-to-end before the other two are added).

**This document has two versions. Version 1 is what you are building right now. Version 2
does not get touched — not one line of code — until every box in Version 1 is ticked.**

---

## Guiding Principles & Industry Standards Applied Throughout

These aren't a separate phase — they're checked against *every* phase below, and worth
naming explicitly so nothing is applied accidentally or inconsistently:

- [ ] **Twelve-Factor App methodology** — config via env vars, stateless processes, explicit dependency declaration, dev/prod parity
- [ ] **REST maturity / resource-based API design** — nouns not verbs in routes, correct HTTP status codes, consistent response shapes
- [ ] **Separation of concerns** — service layer between routes and Prisma; presentation logic never tightly coupled to data-fetching logic
- [ ] **DRY within reason** — centralized design tokens, shared components, no copy-pasted logic across routes
- [ ] **Idempotency on all mutating operations that can be retried** (quiz submission, webhook processing)
- [ ] **Semantic versioning awareness** on any package/schema versioning decisions (e.g. `Quiz.version`, `ExplainBackPrompt.version`)
- [ ] **Conventional commits** (`feat:`, `fix:`, `chore:`, `docs:`) — clean, readable git history
- [ ] **OWASP-basics security hygiene** — no secrets committed, input validation server-side (never trust the client), signed/httpOnly cookies
- [ ] **Accessibility basics (WCAG-adjacent)** — semantic HTML, sufficient color contrast in both themes, keyboard-navigable forms
- [ ] **Testing pyramid** — more unit tests than integration, more integration than e2e
- [ ] **Documentation as a deliverable, not an afterthought** — README, architecture decisions, case study

## Non-Functional Requirements (NFRs) Tracked Across the Build

Functional requirements are "what it does" (covered phase by phase below). These are
"how well it does it" — checked at the relevant phase, called out here so they're never
silently dropped:

- [ ] **Scalability** — stateless design confirmed; scaling architecture documented even if not run live at scale
- [ ] **Security** — auth correctly implemented, secrets never exposed, validated inputs, signed sessions
- [ ] **Performance** — no N+1 queries, indexed foreign keys, Redis caching where it matters
- [ ] **Reliability / graceful degradation** — resource snapshot fallback if a source URL dies; AI call failures don't crash the core loop
- [ ] **Maintainability** — centralized design tokens, service-layer separation, typed schema (Prisma + TypeScript end to end)
- [ ] **Observability** — error monitoring (Sentry) wired before shipping, not after something breaks
- [ ] **Usability / accessibility** — both themes tested, empty/loading/error states designed for every screen, keyboard navigation works

---

# VERSION 1 — MVP (build this now)

## PHASE 0 — Setup & Foundation
**Status: ✅ COMPLETE**

- [x] Feature list finalized
- [x] 3 flagship niches locked: Full-Stack Web Development, Art/Painting, Content Creation
- [x] Skill taxonomy drafted
- [x] Repo created (`reetam-dutta-24/skillFlow`), Next.js 16 scaffolded
- [x] Git initialized, conventional commit style adopted
- [x] Dependencies installed (Prisma, next-auth, ioredis, etc.)

## PHASE 1 — UI/UX Design
**Status: ✅ COMPLETE**

- [x] Core user flow mapped screen by screen
- [x] AniVerse design system reviewed for reuse (structure/components reused, palette changed)
- [x] Palette shifted: magenta-pink → cyan-blue, dark violet base retained, light mode added
- [x] Design tokens defined as CSS custom properties + Tailwind v4 `@theme`
- [x] Claude Design used to generate full component library + tokens, grounded in AniVerse repo/Figma
- [x] Output reviewed via rendered screenshots (Home, Roadmap View, Explain-Back Gate, Progress, Library) — matched spec, calm non-gamified tone confirmed
- [x] Components + tokens integrated into real repo via Claude Code (Tailwind v4 fixes, `lucide-react` swap, `dark`/`light` class toggle)
- [x] Build verified (`tsc --noEmit`, `npm run build` passing)

## PHASE 2 — Data Model, Auth & System Architecture
**Status: ⬜ NOT STARTED**

**Database:**
- [ ] Full Prisma schema written (Auth models, Skill → RoadmapStage → Resource, Quiz/QuizQuestion/QuizAttempt, ExplainBackPrompt/ExplainBackAttempt, UserSkillProgress/StageCompletion)
- [ ] Docker Compose Postgres container running locally
- [ ] `DATABASE_URL` configured in `.env`
- [ ] Migration run (`prisma migrate dev`), verified live in Prisma Studio

**Auth:**
- [ ] `@auth/prisma-adapter` installed
- [ ] `auth.ts` created (NextAuth config, GitHub provider)
- [ ] `lib/prisma.ts` singleton created
- [ ] GitHub OAuth app registered, callback URL set
- [ ] `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET` in `.env`
- [ ] `AUTH_SECRET` generated
- [ ] API route handler created (`app/api/auth/[...nextauth]/route.ts`)
- [ ] Database session strategy confirmed working (not JWT)
- [ ] Basic sign-in test page built and verified end to end
- [ ] Protected-route check implemented (`await auth()`)

**System design checkpoints for this phase:**
- [ ] Stateless session strategy confirmed (database sessions, no in-memory state)
- [ ] Prisma Client singleton pattern verified (no connection exhaustion on hot reload)
- [ ] Why database sessions over JWT documented/understood (contrast with AniVerse's JWT approach)

## PHASE 3 — Core Backend: Content & Roadmap System
**Status: ⬜ NOT STARTED**

- [ ] Skill selection / onboarding API built
- [ ] Roadmap CRUD (admin-side; v1 roadmaps are manually curated, not AI-generated)
- [ ] Resource ingestion: YouTube embed/iframe (never scraped), doc/course links, full metadata snapshot captured at ingestion (title, description, key points, transcript — for graceful degradation + AI grounding)
- [ ] Segmented feed query logic (per-skill, never blended)
- [ ] Zod validation on all API inputs
- [ ] Service-layer separation maintained (no business logic directly in route handlers)
- [ ] Integration tests on roadmap/resource retrieval

**NFR checkpoints:** indexed foreign keys confirmed · no N+1 queries in feed/roadmap fetches

## PHASE 4 — AI Quiz Engine + Socratic Explain-Back Gate
**Status: ⬜ NOT STARTED — hardest phase, do not rush**

**Quiz engine:**
- [ ] Pipeline: lesson content → Anthropic/OpenAI call → structured JSON quiz
- [ ] Quizzes versioned and stored for eval tracking
- [ ] Mistake-explanation flow (wrong answer → grounded AI explanation)
- [ ] Manual eval set built, prompts tested and iterated, results logged
- [ ] Graceful failure handling (API timeout/malformed output doesn't crash the loop)

**Explain-back Socratic gate (headline differentiator):**
- [ ] Milestone boundaries defined per roadmap (stage-level, not per-lesson)
- [ ] Text input flow built
- [ ] Voice input flow built (transcription), added *after* text-based grading is proven, not simultaneously
- [ ] Grading rubric designed per milestone, grounded in actual lesson content
- [ ] Multi-turn exchange built: explanation → AI identifies gap → targeted follow-up → response → full-exchange evaluation
- [ ] Own eval set built for explain-back grading (real + intentionally-shallow sample answers, manually judged)
- [ ] Tuned for both failure directions (too lenient / too strict), changes logged
- [ ] Stage-unlock logic gated on both quiz pass AND explain-back pass

**NFR checkpoints:** rate-limit/retry handling on AI API calls · reliability under AI provider failure

## PHASE 5 — Mastery Tracking, Streaks, Progress
**Status: ⬜ NOT STARTED**

- [ ] Mastery % calculation defined (quiz accuracy + completion weighting, explainable formula)
- [ ] Weak-topic flagging (derived at read time from low-scoring attempts, not a redundant stored table)
- [ ] Streak logic as a background job (daily activity check, reset rules)
- [ ] Progress dashboard data layer built

## PHASE 6 — Frontend Build-Out (Real Data)
**Status: ⬜ NOT STARTED — UI shells already exist on mock data, this phase wires real data in**

- [ ] Onboarding + skill selection wired to real backend
- [ ] Dashboard segmented feed wired to real data
- [ ] Roadmap view wired (locked/unlocked states from real `StageCompletion` data)
- [ ] Lesson player wired
- [ ] Quiz UI wired
- [ ] Explain-back gate UI wired to real grading pipeline
- [ ] Progress/mastery screens wired
- [ ] Responsive pass (mobile web)
- [ ] Micro-interaction polish pass (after functionality confirmed, not before)

**NFR checkpoints:** accessibility pass (contrast, semantic HTML, keyboard nav) · both themes verified on every wired screen

## PHASE 7 — Content Seeding
**Status: ⬜ NOT STARTED**

- [ ] Full-Stack Web Development fully seeded (15–20+ real items, complete roadmap) — **this niche must be 100% done before starting the other two**
- [ ] Art/Painting seeded (scoped to testable technical subset only)
- [ ] Content Creation seeded (scoped to testable technique/mechanics subset only)
- [ ] Every explain-back/quiz item spot-checked against scope rules (no subjective/unscoreable content slipped in)
- [ ] Remaining taxonomy skills present with minimal placeholder content, honestly labeled

## PHASE 8 — Testing
**Status: ⬜ NOT STARTED**

- [ ] Unit tests: mastery calculation, streak logic, quiz/explain-back error handling
- [ ] Integration tests: roadmap/resource/quiz API layer
- [ ] End-to-end test of full core loop (signup → skill → lesson → quiz → explain-back → progress update)
- [ ] Manual QA on empty/error/loading states
- [ ] External AI API calls mocked in test suite (fast, deterministic tests)

## PHASE 9 — DevOps & Deployment
**Status: ⬜ NOT STARTED**

- [ ] Dockerized app
- [ ] CI/CD pipeline (GitHub Actions: lint → test → build → deploy)
- [ ] Deployed: Vercel (app) + real hosted Postgres (AWS RDS or Neon/Supabase — separate decision from local Docker DB)
- [ ] Sentry or equivalent error monitoring wired
- [ ] Environment configs separated (dev/staging/prod), no secrets committed
- [ ] Migrations run as an explicit deploy step

**NFR checkpoints:** scaling architecture documented (even if not run live) · observability confirmed working in deployed environment

## PHASE 10 — Documentation & Case Study
**Status: ⬜ NOT STARTED**

- [ ] README: what it does, stack, architecture decisions and why, how to run it
- [ ] Case study: problem, real competitive research (Nibble/Headway/Class Central/Zigazoo/roadmap.sh), design decisions made in response, what's next
- [ ] Short demo video/GIF of the core loop
- [ ] Codebase cleaned for public viewing
- [ ] Architecture diagram included

---

# VERSION 2 — POST-MVP (do not start until every Version 1 box above is ticked)

Full specs for each feature below live in `SkillFlow-Product-Description.md`'s "Full
Product Vision" section — this tracks build order and concrete tasks, not the full
rationale for each. Order below is suggested priority, not a hard dependency chain
(V2 Phase 1 and V2 Phase 2 can be reordered relative to each other; V2 Phase 3 depends
on V2's explain-back-driven data existing at real scale, so it belongs later regardless).

## V2 PHASE 1 — Premium Tier & Stripe Integration
**Status: ⬜ NOT STARTED**

- [ ] Stripe account + test-mode API keys configured
- [ ] `tier` field added to `User` model (`FREE` / `PREMIUM` enum), plus `stripeCustomerId` / `stripeSubscriptionId`
- [ ] Migration run for the schema change
- [ ] Stripe Checkout session creation endpoint built
- [ ] Checkout redirect flow wired into the Settings/upgrade UI
- [ ] Webhook endpoint built (`/api/webhooks/stripe`)
- [ ] Webhook signature verification implemented
- [ ] `checkout.session.completed` handler — upgrades user to Premium
- [ ] `customer.subscription.deleted` handler — downgrades user to Free
- [ ] Idempotency check on webhook processing (same event ID doesn't double-apply)
- [ ] Premium-gated features identified and gated server-side (AI Mentor deeper explanations, advanced analytics, premium roadmaps)
- [ ] Manual end-to-end test with Stripe test cards

**NFR checkpoints:** no card data ever touches your own servers (Checkout is hosted) · webhook idempotency verified with a manually resent test event

## V2 PHASE 2 — Mastery Score & Leaderboard
**Status: ⬜ NOT STARTED**

- [ ] Scoring formula finalized (weighted quiz accuracy + stages completed — mastery-verified actions only, never raw activity/time)
- [ ] `city` field added to user profile (self-reported, optional, never geolocated)
- [ ] Score calculation as a background job, triggered on quiz/stage completion (not real-time client-side)
- [ ] Leaderboard query: global
- [ ] Leaderboard query: per-country
- [ ] Leaderboard query: per-city
- [ ] User's own rank/position displayed on Home dashboard
- [ ] No prize/gift/unlock logic attached to rank anywhere (status-only, verified in code review)
- [ ] Ship v1 as global-only; monitor engagement/drop-off by rank tier before deciding on matched-cohort fallback

## V2 PHASE 3 — Verified-Explanation Content Flywheel
**Status: ⬜ NOT STARTED — depends on real explain-back attempt volume existing**

- [ ] Define "strong" threshold for an explain-back attempt to qualify for surfacing (e.g. passed on first attempt, no follow-up needed)
- [ ] Opt-in flow: user consents to their explanation being surfaced (anonymized or credited, their choice)
- [ ] Storage: link a qualifying `ExplainBackAttempt` as an alternate resource for that milestone
- [ ] Surface logic: show alternate explanations to learners who fail/retry that same milestone
- [ ] Moderation pass on surfaced explanations (still subject to the same on-topic/no-political scope rules)
- [ ] Attribution display (credited name or "Anonymous learner")

## V2 PHASE 4 — Verifiable Mastery Transcript
**Status: ⬜ NOT STARTED**

- [ ] Transcript data model: per-skill summary of milestones passed, quiz accuracy, explain-back pass rate
- [ ] Shareable public transcript page (`/transcript/[userId]/[skillSlug]`)
- [ ] PDF/image export option
- [ ] "Share to LinkedIn" formatted link/preview
- [ ] Privacy control: user chooses what's public vs private

## V2 PHASE 5 — Smart Notes
**Status: ⬜ NOT STARTED**

- [ ] `Note` model added (linked to `User` + `RoadmapStage`)
- [ ] Manual note-taking UI on the Lesson Player screen
- [ ] AI-summarized note generation option (from lesson content)
- [ ] Notes organized/filterable by skill and stage
- [ ] Full-text search across a user's own notes
- [ ] Export (Markdown / PDF)

## V2 PHASE 6 — Peer-Verified Project Reviews
**Status: ⬜ NOT STARTED**

- [ ] Identify which roadmap milestones support a project submission (not all will)
- [ ] Project submission model + upload/link flow
- [ ] Matching logic: pair two learners at a similar stage for review exchange
- [ ] Structured review rubric (not freeform comments)
- [ ] Review submission + notification flow
- [ ] Basic reporting/flagging for abuse, since this is the first genuinely open-ended user-to-user text in the product

**NFR checkpoints:** this is the one V2 feature that reopens user-to-user free text — apply the same moderation discipline as the core product's "no comments" philosophy, scoped narrowly

## V2 PHASE 7 — Creator Platform
**Status: ⬜ NOT STARTED — largest V2 feature, expect it to take longer than others**

- [ ] Creator verification/application flow
- [ ] Creator-authored roadmap/lesson/quiz submission tools
- [ ] Same moderation standard applied to creator content as curated content
- [ ] Creator track record tracked by downstream quiz-success correlation, not view counts
- [ ] Creator-authored content surfaced distinctly from founder-curated content (clear labeling)
- [ ] Revenue-share consideration if tied to Premium tier (design decision, not committed yet)

## V2 PHASE 8 — Dynamic AI-Generated Roadmaps
**Status: ⬜ NOT STARTED — depends on real usage data existing**

- [ ] Collect enough usage data first (which lesson sequences correlate with quiz/explain-back success)
- [ ] Design the roadmap-generation prompt/pipeline
- [ ] A/B or shadow-test AI-generated roadmaps against the manually curated ones before replacing them
- [ ] Fallback to manual roadmap if AI generation produces a low-confidence result

## V2 PHASE 9 — Additional Niches Beyond the 3 Flagship Skills
**Status: ⬜ NOT STARTED**

- [ ] New niche selection filtered through the same testability rule (real checkable knowledge, not purely experiential)
- [ ] Content fully seeded (15–20+ items) before the niche is enabled for users — never launch a thin/empty niche
- [ ] Roadmap + quiz + explain-back rubrics built for the new niche

## V2 PHASE 10 — Smaller Stretch Features
**Status: ⬜ NOT STARTED**

- [ ] "You've learned enough today" soft usage-cutoff screen
- [ ] Spaced repetition scheduling (SM-2 style) on quiz content
- [ ] Bring-your-own-resource (user pastes a link, gets a quiz generated + added to personal library)
- [ ] Shareable mastery certificate/summary per skill (lighter version of V2 Phase 4's transcript)

---

**Right now:** Version 1, Phase 0 and 1 complete. Repo was reset (`git reset --hard`) back to commit `0f01162c595b3112d40e017e38ada0fa02533f83` — Version 1 Phase 2 is NOT STARTED at this commit (database and auth both to be done from scratch). Nothing in Version 1 Phase 3 onward starts until every Version 1 Phase 2 box is ticked. Version 2 does not start until all of Version 1 (Phases 0–10) is complete.