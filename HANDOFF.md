# SkillFlow — handoff for testing and deployment

This brief is for someone (a person or a chat assistant) who will help test SkillFlow and put it on AWS without reading the code. It says what the app is, how it runs, what it needs from the outside world, and what is known to be missing. It is accurate as of 8 October 2026.

The other documents go deeper: `AGENTS.md` (working rules and every wired feature), `Project-roadmap.md` (the full record and the phase list), `README.md` (setup and service keys), and `UI-AUDIT.md` (a dated design audit).

---

## 1. The product in one minute

SkillFlow is a learning app built on mastery. A learner follows a skill, called a **path**. A path is an ordered list of **stages**. Each stage is a set of real external resources: YouTube videos played inside the app, articles, docs, and courses. A stage counts as passed only after an **explain-back**: the learner explains each idea in their own words, an AI model (Gemini) reviews it, and the step moves on only when the idea holds. The next stage opens after the current one is passed. There is no quiz, no comments, no likes, no view counts, and no leaderboard.

- **Free.** Thirty paths with full catalogs, every stage, explain-back, notes, transcripts, certificates, Nearby events, and the learner map.
- **Premium.** One Stripe subscription. It opens the other niches (there are about 145, none with stages yet) and lets the learner appear on the learner map.
- **Roles.** `USER` and `ADMIN`. Admins use the Catalog CMS (`/admin/catalog`, reached from the account menu), the submission queue, creator video review, and community role management. Community moderators (`MAINTAINER`, `REVIEWER`) moderate one niche's Open Source posts.

### Main features, by area

| Area | Routes | Notes |
| --- | --- | --- |
| Public | `/`, `/login`, `/signup`, `/privacy`, `/terms` | Static pages. The landing page has a Clips reel of real catalog videos |
| Onboarding | `/onboarding` (`?edit=1` to reopen) | Eight steps: display name and photo, age range (under 13 is refused; 13–17 needs a parent's consent), current stage, city, up to five paths, goals, time and formats, accent |
| Learning | `/dashboard` (Home), `/skills` (Niches), `/roadmap`, `/roadmap/[slug]`, `/lesson/[stageId]`, `/milestone/[stageId]` (explain-back), `/clips` | |
| Records | `/progress`, `/analytics`, `/notes`, `/notes/practice`, `/transcript/[userId]/[skill]`, `/certificate/[userId]/[skill]` | Notes export as Word or PDF; the transcript and certificate as PDF |
| Self-discovery | `/career-test`, `/career-test/report` | 180 published questionnaire items, scored in code; Gemini writes the report text; PNG and JPG export |
| Community | `/open-source/...`, `/profile/[userId]` | Moderated posts, one question per learner, contributor profiles, a 12-month activity heatmap |
| Creators | `/creator` | Upload your own video; an admin approves it onto the clip feed |
| Nearby | `/nearby` (learner map), `/nearby/events` | City-level counts only. Events come from Ticketmaster, Google via SerpApi, and community submissions |
| Account | `/settings`, `/upgrade` | Display name, photo, Google connect, city, reminders, privacy toggle, theme and accent, Stripe |
| Admin | `/admin/catalog`, `/admin/submissions`, `/admin/creator`, `/admin/community` | Admin only; anyone else gets a 404 |
| Dev only | `/dev/...` | Returns 404 in production |

---

## 2. Stack

- **Next.js 16.3.4** (App Router, Turbopack builds) with **React 19.2.8** and TypeScript. This Next version has breaking changes from older ones: `middleware.ts` is replaced by `proxy.ts`, and **Cache Components** (`cacheComponents: true`) is on.
- **PostgreSQL 16** through **Prisma 6.19.3**. `prisma.config.ts` loads `.env` with dotenv.
- **Auth.js v5 (next-auth 5.0.0-beta.32)** with JWT sessions (no session table in use), email and password (bcrypt), and Google OAuth. `trustHost: true`.
- **Tailwind v4** plus one large `app/globals.css`.
- Other notable packages: `stripe`, `maplibre-gl` with `supercluster` (maps), `recharts`, `framer-motion`, `docx` and `pdf-lib` (exports), `zod`. `ioredis` is installed and unused: there is no Redis.
- **Node.** Developed on Node 20.17. Next 16 needs Node 20.9 or later; Node 20 LTS or 22 LTS is fine.
- Scripts: `npm run dev`, `npm run build`, `npm start` (port 3000, or `-p`), `npm run lint`, `npm test` (Vitest, 32 files and 121 tests on 8 October 2026). `npx tsc --noEmit` is the type check. Full-repo ESLint still fails on some older files.

---

## 3. Running it

### Local

```bash
npm install
docker compose up -d          # Postgres 16, user skillflow, database skillflow, port 5432
cp .env.example .env          # then fill in values
npx prisma migrate deploy     # create the tables
npm run dev                   # http://localhost:3000
```

### Production build

```bash
npm ci
npx prisma generate
npx prisma migrate deploy     # every deploy, before the new version starts
npm run build
npm start                     # or: npx next start -p 3000
```

The app is a long-running Node server (`next start`). It is not built with `output: "standalone"`. Two things read from disk at runtime and must be present next to the running server:

- `node_modules/maplibre-gl/dist/` is served by `app/vendor/maplibre/[file]/route.ts` (the map's web worker). A standalone or trimmed bundle must keep those two files.
- `public/uploads/` holds user uploads (see section 7).

### Database rules

- Apply migrations with `prisma migrate deploy`. Never run `prisma migrate dev` or `prisma migrate reset` against a database that matters.
- On 8 October 2026 a fresh, empty database was built from the repository's 24 migrations and compared with `schema.prisma`. They match, apart from a default on two `updatedAt` columns, which Prisma fills itself.
- New migrations are written by hand, only add things, and are applied with `migrate deploy`. The original development database has two extra migration rows and an unused `GeocodeCache` table, so a generated diff against it would try to drop them.

### Filling a new database

A fresh database has tables but no niches, paths, or resources. There are two ways to fill it:

1. **The seed, run once on the empty database:** `npx prisma db seed`. It creates every niche and imports the thirty catalogs from `content/catalog/*.json`. **Warning:** it also creates two admin accounts (`admin1.skillflow@gmail.com` and `admin2.skillflow@gmail.com`) with a fixed password that is written in `prisma/seed.ts`. Every later run resets them to that password. In production, delete those two users or change their passwords straight after seeding, and never run the seed again. The seed does not set stage photos. Those come from a separate script, `scripts/fetch-stage-photos.ts`, or from copying the data.
2. **Copy the development data** with `pg_dump` and restore it. Stage photo paths, flagship flags, and the CMS edits come across as they are. Also copy `public/uploads/` (section 7), or any row that points at an uploaded file will 404.

To make someone an admin, run `UPDATE "User" SET role = 'ADMIN' WHERE email = '<their email>';`. There is no admin sign-up screen. The intended admin is `rdutta_be23@thapar.edu`.

---

## 4. Environment variables

All of these are read on the server unless the name starts with `NEXT_PUBLIC_`. `.env.example` lists them with comments. Never commit `.env`.

| Variable | Needed | What it does |
| --- | --- | --- |
| `DATABASE_URL` | Yes | Postgres connection string |
| `AUTH_SECRET` | Yes | Signs the session JWTs. Generate with `npx auth secret`. Changing it signs everyone out |
| `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` | For Google sign-in | Without them the Google buttons are hidden. **Needed at build time too**: login and signup are static pages, so the buttons are decided when you build |
| `GEMINI_API_KEY` | For explain-back | Free tier, model `gemini-flash-lite-latest`. Without any model key, no stage can be passed |
| `GEMINI_MODEL` | No | Overrides the Gemini model |
| `OPENAI_API_KEY` | No | Used only when the Gemini key is empty |
| `EXPLAIN_MODEL_KEY`, `EXPLAIN_MODEL_URL`, `EXPLAIN_MODEL_NAME` | No | Any OpenAI-compatible endpoint. These win when `EXPLAIN_MODEL_KEY` is set |
| `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_PRICE_ID`, `STRIPE_WEBHOOK_SECRET` | For Premium | Without them, `/upgrade` says Stripe is not configured and nothing is charged |
| `STRIPE_PRICE_LABEL` | No | Price text shown if Stripe cannot be read |
| `GEOCODER_USER_AGENT` | Yes, in practice | Sent to OpenStreetMap Nominatim for city search. Their policy needs a real contact |
| `MAP_MIN_LEARNERS` | No | Hides cities with fewer opted-in learners than this. Default 5 |
| `TICKETMASTER_API_KEY` | No | Ticketmaster events. The code caps it at 5,000 calls a day |
| `SERPAPI_API_KEY`, `SERPAPI_MONTHLY_CAP` | No | Google events through SerpApi. Default cap 200 searches a month |
| `EVENTS_TTL_HOURS`, `EVENTS_CRON_PAIRS` | No | How long saved events stay fresh (12 hours), and how many city and niche pairs the cron refreshes (20) |
| `CRON_SECRET` | If the cron runs | Bearer token for `GET /api/cron/events` |
| `PEXELS_API_KEY` | No | Used only by `scripts/fetch-stage-photos.ts` |

---

## 5. External services and network calls

| Service | Called from | When |
| --- | --- | --- |
| Google Gemini (or OpenAI) | Server | Explain-back reviews, the stage idea writer, note summaries, the career report, plan setup, admin tag suggestions |
| Google OAuth | Browser and server | Sign-in. Redirect URI: `https://<domain>/api/auth/callback/google`. Add the production origin and redirect URI in Google Cloud Console |
| Stripe | Browser (Checkout page on stripe.com) and server | Checkout, the customer portal, and the webhook `POST /api/stripe/webhook`. It handles `checkout.session.completed` and `customer.subscription.created`, `.updated`, and `.deleted`. Register that URL in the Stripe dashboard and copy its signing secret |
| OpenStreetMap Nominatim | Server | City search. Results are cached for days |
| OpenStreetMap tiles (`tile.openstreetmap.org`) | Browser | Map tiles. OSM's tile policy does not allow heavy production use, so a busy site should switch to a tile provider |
| YouTube (`youtube-nocookie.com`) | Browser | Videos load only when the learner presses play |
| Ticketmaster Discovery, SerpApi | Server | Nearby events. Free visitors never trigger a live call; saved rows refresh at most every 12 hours |
| Arbitrary https pages | Server | The explain-back idea writer and practice notes read public pages; the CMS link check fetches resource URLs. Outbound HTTPS to the internet is needed |

---

## 6. Request flow, auth, and security

- `proxy.ts` only checks that someone is signed in on the app routes, and sends anyone else to `/login`. Admin checks happen in each admin page and action (`requireAdmin()`: no session goes to `/login`, any other role gets a 404).
- Every Server Action checks the session again, and checks permissions in the service layer.
- Google sign-in never takes over a password account just because the email matches. A learner links Google from Settings after logging in with the password.
- Passwords are bcrypt hashes. Emails are lowercased.
- Uploads are checked by extension, size, and magic bytes. Images go up to 6 MB, PDFs 12 MB, and videos 40 MB. `next.config.ts` raises the Server Action body limit and the proxy body limit to 45 MB, so a load balancer or reverse proxy in front must allow bodies of at least 45 MB.
- The privacy policy (`/privacy`) lists what is collected and who processes it. Indian law and the DPDP Act 2023 apply. Contact: `rdutta_be23@thapar.edu`. Update it when a feature changes what is collected or shared.
- Not done yet: a full threat review (OWASP pass), rate limiting on sign-in and signup, and security headers such as a CSP.

---

## 7. State that lives outside the database

**Uploaded files.** These are profile photos (uploads and generated avatars), creator videos, Open Source images, resource files, and new niche covers from the CMS. They are written to `public/uploads/<random>.<ext>` on the server's own disk, and that folder is gitignored. `next start` serves only the `public` files that existed at build time, so `app/uploads/[file]/route.ts` serves the later ones. It allows only known names and types, sets `Cache-Control: immutable` because names are never reused, and supports byte ranges for video.

- One server with a disk that lasts across deploys (for example EC2 with EBS) works as it is.
- Several servers, or containers that get replaced (ECS or Fargate, Elastic Beanstalk rolling deploys, App Runner), need object storage (S3, optionally behind CloudFront). The change is in `lib/uploads.ts` (`saveUploadedFile`, `saveImageBytes`, `readUploadedImage`) and in the serving route. The database stores public paths like `/uploads/abc.png`.
- Committed images are fine everywhere: stage photos in `public/stages`, covers in `public/skills`, and landing art in `public/landing`.

**Next.js cache.** Shared pages are cached with `"use cache"` and tags: `catalog`, `community`, `learner-map`, `geocode`, `nearby-events`, `practice-source`, and `account:<userId>`. Writes call `updateTag` to drop them. This cache lives in each server process and in `.next/cache`. With **more than one instance**, an edit drops the cache only on the instance that handled it, and the others serve old content for up to an hour. Run one instance, or set up a shared cache handler, before scaling out. Image optimization also caches under `.next/cache`.

**Background work.** A stale events refresh runs after the response, through Next's `after()`. That suits a long-running Node server. The event cron is `GET /api/cron/events` with `Authorization: Bearer $CRON_SECRET`, and something has to call it on a schedule (for example EventBridge Scheduler to an HTTPS endpoint, or cron on the instance).

---

## 8. Testing status

- **Done.** 121 unit tests (Vitest): mastery, streaks, the open-stage rule, explain-back judging, plans, events, community permissions, career scoring, the report schema, display names, and avatars. `next build` and `tsc` pass.
- **Checked by hand in a headless browser on production builds.** Onboarding, the Catalog CMS (create, edit, and delete for niches, stages, and resources), profile photos, and the UI audit pages at 375px and desktop.
- **Not done.** Integration tests (catalog import, lesson reads, Open Source review, edit and hide), one end-to-end run (signup → onboarding → lesson → explain-back → progress), a live Stripe test charge, a load test, and model calls mocked in tests.
- **Built-in failure strings** that show error states without saving: catalog or settings name `fail this save`, submit title `fail this submit`, review notes `fail this review`, creator title `fail this upload`, and Open Source review feedback `fail this merge`.
- **Test account** (local only): `ui-audit@skillflow.local`, a normal learner used for screenshots.

---

## 9. Deploy checklist

- [ ] Postgres 16 (for example RDS), with `DATABASE_URL` using SSL as the provider requires
- [ ] Run `prisma migrate deploy` on every release, before the new version starts
- [ ] Fill the database: seed once and then remove the seed admins, or restore a dump and copy `public/uploads`
- [ ] Set every environment variable from section 4. Set the Google keys before `npm run build`
- [ ] Add the Google OAuth production origin and redirect URI
- [ ] Register the Stripe webhook URL and secret. Run a test charge with test keys
- [ ] Storage for `public/uploads`: a lasting disk on one instance, or S3 (section 7)
- [ ] One app instance, or a shared Next cache handler (section 7)
- [ ] Allow request bodies of at least 45 MB at the load balancer or proxy. Serve HTTPS only
- [ ] Schedule `GET /api/cron/events` with the bearer secret, if Nearby events are on
- [ ] Health check: `GET /login` returns 200 without a session
- [ ] Error monitoring and log collection (nothing is set up)
- [ ] CI: install, `tsc --noEmit`, `npm test`, `npm run build`
- [ ] Promote the real admin with the SQL in section 3
