# SkillFlow — handoff for testing and deployment

This brief is for someone (a person or a chat assistant) who will help test and operate SkillFlow without reading the code. It says what the app is, how it runs, what it needs from the outside world, how it is deployed today, and what is known to be missing. It is accurate as of 16 October 2026.

**SkillFlow is live** at `https://app.32-236-251-56.sslip.io` (a temporary domain) on one AWS EC2 instance running Docker Compose. Section 10 describes the deployment as it is, and section 11 is the redeploy runbook. The product is feature-complete and frozen (the feature list closed on 16 October 2026); deploying the 16 October work needs `prisma migrate deploy` for its two new migrations; the open work is operations (section 9).

The other documents go deeper: `AGENTS.md` (working rules and every wired feature), `Project-roadmap.md` (the full record and the phase list), `README.md` (overview, architecture diagrams, setup, and service keys), `STUDY-GUIDE.md` (every concept end to end, including the incident log), and `UI-AUDIT.md` (a dated design audit).

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
| Wellbeing | `/detox`, `/detox/check`, `/detox/report/image` | Dopamine Detox: an original 20-question self-check, a Detox Score worked out in code that only verified learning moves, weekly check-ins, focus sessions (a pill in the top bar), Swap a scroll, a before/after PNG. Off the public profile unless switched on |
| Search and help | Top bar (Ctrl or Cmd + K), `/api/search`; the guided tour on Home | Search covers pages, features, settings, niches, stages, resources, and published posts. The tour has sixteen stops with sandboxed demos |
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
- Other notable packages: `stripe`, `maplibre-gl` with `supercluster` (maps), `recharts`, `framer-motion`, `docx` and `pdf-lib` (exports), `zod`, and `ioredis` (Redis, used only for rate limits).
- **Node.** Developed on Node 20.17; the production image uses Node 22 (`node:22-bookworm-slim`). Next 16 needs Node 20.9 or later.
- Scripts: `npm run dev`, `npm run build`, `npm start` (port 3000, or `-p`), `npm run lint`, `npm test` (Vitest, 40 files and 236 tests on 16 October 2026), `npm run test:e2e` (Playwright). `npx tsc --noEmit` is the type check. Full-repo ESLint still fails on some older files.

---

## 3. Running it

### Local

```bash
npm install
docker compose up -d          # Postgres 16 (user and database skillflow, port 5432) and Redis 7 (port 6379)
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

On start, the server checks every environment variable (`instrumentation.ts` calls `validateEnv()` in `lib/env.ts`). A missing or malformed value stops it with a list of variable names, never values. The check is skipped during `next build`. The build itself still reads the database, because Cache Components prerender the catalog; section 10 explains how the Docker build gets `DATABASE_URL` without storing it.

The app is a long-running Node server (`next start`). It is not built with `output: "standalone"`. Two things read from disk at runtime and must be present next to the running server:

- `node_modules/maplibre-gl/dist/` is served by `app/vendor/maplibre/[file]/route.ts` (the map's web worker). A standalone or trimmed bundle must keep those two files.
- `public/uploads/` holds user uploads (see section 7).

### Database rules

- Apply migrations with `prisma migrate deploy`. Never run `prisma migrate dev` or `prisma migrate reset` against a database that matters.
- On 8 October 2026 a fresh, empty database was built from the repository's migrations and compared with `schema.prisma`. They match, apart from a default on two `updatedAt` columns, which Prisma fills itself. There are 28 migrations. `20261008200000_drop_quiz` drops the unused quiz tables and `StageCompletion.quizPassed`; `20261014120000_notification_settings` adds the notification switches and the read time on `LearnerProfile`; `20261016120000_product_tour` adds `LearnerProfile.tourCompletedAt`; the last, `20261016140000_dopamine_detox`, adds the Detox tables and two profile switches.
- New migrations are written by hand, only add things, and are applied with `migrate deploy`. The original development database has two extra migration rows and an unused `GeocodeCache` table, so a generated diff against it would try to drop them.

### Filling a new database

A fresh database has tables but no niches, paths, or resources. There are two ways to fill it:

1. **The seed, run once on the empty database:** `npx prisma db seed`. It creates every niche and imports the thirty catalogs from `content/catalog/*.json`. Admin accounts come from `.env`: `SEED_ADMIN_EMAILS` (comma-separated) and `SEED_ADMIN_PASSWORD` (12 characters or more); without both, no admin is created. An account that already exists is only made an admin, and its password is never reset. In production the seed refuses to run unless `ALLOW_PROD_SEED=yes` is set; set it for that one run on the empty database, then remove it. Never run the seed again after that, because it rewrites every niche. The seed does not set stage photos. Those come from a separate script, `scripts/fetch-stage-photos.ts`, or from copying the data.
2. **Copy the development data** with `pg_dump` and restore it. Stage photo paths, flagship flags, and the CMS edits come across as they are. Also copy `public/uploads/` (section 7), or any row that points at an uploaded file will 404.

To make someone an admin, run `UPDATE "User" SET role = 'ADMIN' WHERE email = '<their email>';`. There is no admin sign-up screen. The intended admin is `rdutta_be23@thapar.edu`.

---

## 4. Environment variables

All of these are read on the server unless the name starts with `NEXT_PUBLIC_`. `.env.example` lists them with comments. Never commit `.env`.

| Variable | Needed | What it does |
| --- | --- | --- |
| `DATABASE_URL` | Yes | Postgres connection string. Must start with `postgresql://` |
| `AUTH_SECRET` | Yes | Signs the session JWTs. At least 32 characters; generate with `npx auth secret`. Changing it signs everyone out |
| `REDIS_URL` | Yes, in production | `redis://` or `rediss://`. Holds the rate-limit counters. Without it locally, the limits are off |
| `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` | For Google sign-in | Set both or neither. Without them the Google buttons are hidden. **Needed at build time too**: login and signup are static pages, so the buttons are decided when you build |
| `GEMINI_API_KEY` | For explain-back | Free tier, model `gemini-flash-lite-latest`. Without any model key, no stage can be passed |
| `GEMINI_MODEL` | No | Overrides the Gemini model |
| `OPENAI_API_KEY` | No | Used only when the Gemini key is empty |
| `EXPLAIN_MODEL_KEY`, `EXPLAIN_MODEL_URL`, `EXPLAIN_MODEL_NAME` | No | Any OpenAI-compatible endpoint. These win when `EXPLAIN_MODEL_KEY` is set |
| `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_PRICE_ID`, `STRIPE_WEBHOOK_SECRET` | For Premium | All four or none (prefixes `sk_`, `pk_`, `price_`, `whsec_`). Without them, `/upgrade` says Stripe is not configured and nothing is charged |
| `STRIPE_PRICE_LABEL` | No | Price text shown if Stripe cannot be read |
| `GEOCODER_USER_AGENT` | Yes, in production | Sent to OpenStreetMap Nominatim for city search. Their policy needs a real contact |
| `MAP_MIN_LEARNERS` | No | Hides cities with fewer opted-in learners than this. Default 5 |
| `TICKETMASTER_API_KEY` | No | Ticketmaster events. The code caps it at 5,000 calls a day |
| `SERPAPI_API_KEY`, `SERPAPI_MONTHLY_CAP` | No | Google events through SerpApi. Default cap 200 searches a month |
| `EVENTS_TTL_HOURS`, `EVENTS_CRON_PAIRS` | No | How long saved events stay fresh (12 hours), and how many city and niche pairs the cron refreshes (20) |
| `CRON_SECRET` | Yes, in production | Bearer token for `GET /api/cron/events`. At least 32 characters (`openssl rand -hex 32`) |
| `GIT_SHA` | No | Shown as `commit` by `/api/health`, so you can see which version is live. Defaults to `dev` |
| `SEED_ADMIN_EMAILS`, `SEED_ADMIN_PASSWORD` | Seed only | Admin accounts the seed creates (section 3) |
| `ALLOW_PROD_SEED` | Seed only | `yes` lets the seed run once in production. Remove it afterwards |
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
- **Account deletion** is self-serve in Settings → Danger zone. It needs `DELETE` typed and the password (tries share the log-in limit), refuses the last admin, and cancels the Stripe subscription before deleting anything; if Stripe is unreachable it stops. The person's contributions, events, requests, and uploaded files go with the account. With S3 later, `removeUploadedFile` in `lib/uploads.ts` must delete from the bucket too.
- Uploads are checked by extension, size, and magic bytes. Images go up to 6 MB, PDFs 12 MB, and videos 40 MB. `next.config.ts` raises the Server Action body limit and the proxy body limit to 45 MB, so a load balancer or reverse proxy in front must allow bodies of at least 45 MB.
- The privacy policy (`/privacy`) lists what is collected and who processes it. Indian law and the DPDP Act 2023 apply. Contact: `rdutta_be23@thapar.edu`. Update it when a feature changes what is collected or shared.
- **Rate limits** (Redis, numbers in `lib/limits.ts`): log-in 5 tries per email and 30 per IP every 15 minutes, sign-up 5 per IP an hour, every AI call 20 a minute and 400 a day per learner (raised from 10 and 200 on 13 October 2026, because one stage can have 15–20 ideas), uploads 20 an hour per learner. A blocked log-in looks like a wrong password. If Redis errors, log-in is blocked (fails closed) and everything else is allowed (fails open).
- **AI timeout.** A model call is aborted after 50 seconds (`TIMEOUT_MS` in `lib/explain/judge.ts`). Gemini's free tier sometimes queues a request for 30–48 seconds; the earlier 25-second limit made explain-back fail in production. A timeout saves nothing.
- **Client IP.** `clientIp()` takes the first value of `X-Forwarded-For`. The proxy in front must overwrite that header with the real client address. Caddy does this by default (it does not trust forwarding headers from clients), so the production setup is safe. A proxy that appends to a header sent by the client (AWS ALB does this by default) would let someone spoof the per-IP log-in and sign-up limits. The per-email log-in limit still holds.
- **Headers** on every response (`next.config.ts`): `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, a `Permissions-Policy` that turns off camera, microphone, geolocation, and payment, and HSTS for two years in production. `X-Powered-By` is removed.
- **CSP** is sent as `Content-Security-Policy-Report-Only`. It allows the app itself, OpenStreetMap tiles, YouTube frames, any https image, and form posts to Google sign-in and Stripe. It reports violations in the browser console and blocks nothing yet.
- Not done yet: a full threat review (OWASP pass), and switching the CSP to enforcing once the console shows no violations.

---

## 7. State that lives outside the database

**Uploaded files.** These are profile photos (uploads and generated avatars), creator videos, Open Source images, resource files, and new niche covers from the CMS. They are written to `public/uploads/<random>.<ext>` on the server's own disk, and that folder is gitignored. `next start` serves only the `public` files that existed at build time, so `app/uploads/[file]/route.ts` serves the later ones. It allows only known names and types, sets `Cache-Control: immutable` because names are never reused, and supports byte ranges for video.

- One server with a disk that lasts across deploys (for example EC2 with EBS) works as it is. That is the production setup: the `uploads` Docker volume is mounted at `/app/public/uploads`, so files survive rebuilds.
- Several servers, or containers that get replaced (ECS or Fargate, Elastic Beanstalk rolling deploys, App Runner), need object storage (S3, optionally behind CloudFront). The change is in `lib/uploads.ts` (`saveUploadedFile`, `saveImageBytes`, `readUploadedImage`) and in the serving route. The database stores public paths like `/uploads/abc.png`.
- Committed images are fine everywhere: stage photos in `public/stages`, covers in `public/skills`, and landing art in `public/landing`.

**Next.js cache.** Shared pages are cached with `"use cache"` and tags: `catalog`, `community`, `learner-map`, `geocode`, `nearby-events`, `practice-source`, `landing-stats` (the live landing totals), and `account:<userId>`. Writes call `updateTag` to drop them. This cache lives in each server process and in `.next/cache`. With **more than one instance**, an edit drops the cache only on the instance that handled it, and the others serve old content for up to an hour. Run one instance, or set up a shared cache handler, before scaling out. Image optimization also caches under `.next/cache`.

**Redis.** Only rate-limit counters live there, each expiring with its window. Losing Redis resets the counters and loses nothing else. Compose runs it with append-only persistence, which is the production setup; ElastiCache becomes worth it only with several app instances. The app connects lazily with a 500 ms command timeout, so a slow Redis cannot slow a page.

**Background work.** A stale events refresh runs after the response, through Next's `after()`. That suits a long-running Node server. The event cron is `GET /api/cron/events` with `Authorization: Bearer $CRON_SECRET`, and something has to call it on a schedule. On the production instance that will be a `crontab` line calling the HTTPS URL with `curl` (not scheduled yet; it only matters once the event keys are set).

---

## 8. Testing status

- **Done.** 236 unit tests in 40 files (Vitest): mastery, streaks, the open-stage rule, explain-back judging, plans, events, community permissions, career scoring, the report schema, display names, avatars, env validation, the rate limiter, weak topics, notification counts, the product tour, and the Detox Score. `next build` and `tsc` pass.
- **End-to-end (Playwright, `e2e/`, `npm run test:e2e`).** Six tests in Chromium: the landing page, `/api/health` reporting the database up, sign-up landing on onboarding, a wrong password, logging in and opening the first Full-Stack stage, and the signed-out redirect. The config reuses a server on port 3000 or starts `npm run dev`, keeps a trace and a screenshot on failure, and retries once when `CI` is set. They need a seeded database, and each run adds one learner (`e2e+<timestamp>@skillflow.test`). Run `npx playwright install chromium` once first.
- **Checked by hand in a headless browser on production builds.** Onboarding, the Catalog CMS (create, edit, and delete for niches, stages, and resources), profile photos, and the UI audit pages at 375px and desktop.
- **Not done.** Integration tests (catalog import, lesson reads, Open Source review, edit and hide), the end-to-end steps after opening a lesson (explain-back → progress, which needs the model mocked), a live Stripe test charge, a load test, and model calls mocked in tests.
- **Built-in failure strings** that show error states without saving: catalog or settings name `fail this save`, submit title `fail this submit`, review notes `fail this review`, creator title `fail this upload`, and Open Source review feedback `fail this merge`.
- **Test account** (local only): `ui-audit@skillflow.local`, a normal learner used for screenshots.

---

## 9. Deploy checklist

Done:

- [x] Postgres 16, in a container on the instance (`pgdata` volume), bound to `127.0.0.1` only
- [x] `prisma migrate deploy` as a release step, before the new version starts (section 11)
- [x] Database filled by restoring the development dump; development and test accounts removed afterwards
- [x] Environment variables set in `.env` and `.env.build` on the server (`chmod 600`). `REDIS_URL`, `CRON_SECRET`, and `GEOCODER_USER_AGENT` are set
- [x] Redis 7 in a container, reachable only inside the Compose network
- [x] Storage for `public/uploads`: the `uploads` volume on one instance
- [x] One app instance, so the per-process Next cache stays correct
- [x] HTTPS only (Caddy redirects HTTP), request bodies up to 50 MB
- [x] The proxy overwrites `X-Forwarded-For` (Caddy's default)
- [x] Container health check on `GET /api/health`
- [x] The real admin promoted and the password reset

Open:

- [ ] Daily `pg_dump` to a private S3 bucket by cron, with a tested restore
- [ ] Grow the EBS volume from 20 to 30 GB (`growpart` and `resize2fs`), and prune the build cache after every deploy
- [ ] Google OAuth: add the production origin and redirect URI, put the keys in `.env` **and** `.env.build` (login and signup are static, so the buttons are decided at build time), rebuild. Google may refuse an sslip.io domain; the final domain fixes that
- [ ] Stripe: test keys, register the webhook URL and secret, run one test charge
- [ ] Rotated Ticketmaster and SerpApi keys, then schedule `GET /api/cron/events` with the bearer secret
- [ ] Set `GIT_SHA` at build time so `/api/health` reports the live commit
- [ ] Uptime monitoring on `/api/health` and error monitoring (Sentry); nothing is set up
- [ ] CI: install, `tsc --noEmit`, `npm test`, `npm run build`, and `npm run test:e2e` against a seeded database, then deploy
- [ ] Check the browser console on the live site for CSP reports, then switch `Content-Security-Policy-Report-Only` to `Content-Security-Policy`
- [ ] The final domain: an `A` record to the Elastic IP, `DOMAIN` in `.env`, then the Google and Stripe URLs. `noindex` until then
- [ ] Session Manager instead of SSH, and a second admin on a personal email
- [ ] Upgrade or leave the AWS free plan before about 13 April 2027

---

## 10. Production as deployed

| Part | Value |
| --- | --- |
| URL | `https://app.32-236-251-56.sslip.io` (sslip.io resolves the name to the IP inside it) |
| Cloud | AWS, region `ap-southeast-2` (Sydney), free plan; the rule is to spend nothing |
| Server | EC2 `t3.small` (2 vCPU, 2 GiB), Ubuntu, 20 GB gp3, 2 GB swap (`vm.swappiness=10`), default VPC |
| Public IP | Elastic IP `32.236.251.56` |
| Firewall | Security group `skillflow-web`: 22 from the owner's IP only, 80 and 443 from anywhere. Nothing else is open |
| Software | Docker 29, Compose v2.40, Buildx 0.30, git |
| Code | `~/skillflow`, a clone of the public GitHub repository. Git is the only way code reaches the server; nothing is edited there |
| Compose | `docker-compose.prod.yml`, selected by `COMPOSE_FILE` in `.env`, so plain `docker compose` uses it |
| Services | `app` (built from `Dockerfile`, port 3000 internal only), `postgres:16` (`127.0.0.1:5432`), `redis:7-alpine` (append-only), `caddy:2` (80 and 443) |
| Volumes | `pgdata`, `redisdata`, `uploads`, `caddy_data` (certificates), `caddy_config` |
| Settings | `.env` (runtime; `DATABASE_URL` uses host `postgres`, `REDIS_URL=redis://redis:6379`) and `.env.build` (the same values with host `127.0.0.1`, used only by the build). Both `chmod 600` |

**Why two env files.** The build prerenders the catalog, so it queries Postgres. `docker compose build` runs with `network: host` and mounts `.env.build` as a BuildKit secret at `/app/.env` for that one `RUN` step only. The secret never lands in an image layer. At runtime the app is on the Compose network, where the database host is the service name `postgres`.

**HTTPS.** `Caddyfile` serves `{$DOMAIN}`, compresses responses, allows bodies up to 50 MB, and proxies to `app:3000`. Caddy obtains and renews a Let's Encrypt certificate on its own. Changing the domain is an `A` record plus `DOMAIN` in `.env` and `docker compose up -d caddy`.

**Not used, on purpose.** RDS, ElastiCache, ECR, a load balancer, S3, and EventBridge. Each one costs money or adds parts that one server does not need yet. `STUDY-GUIDE.md` §25 and §31 explain when each one becomes worth it.

**Known operational lessons.** A home IP change breaks SSH until the security group rule is updated. A rebuild can fill the 20 GB disk ("no space left on device"): prune the build cache after every deploy, and never prune volumes. Run Compose from `~/skillflow`, or it says "no configuration file provided".

---

## 11. Redeploy runbook

On the laptop:

```powershell
npm test
npm run build
git add -A ; git commit -m "feat: ..." ; git push
```

On the server:

```bash
cd ~/skillflow
docker compose exec -T postgres pg_dump -U skillflow -Fc skillflow > ~/backup-$(date +%F-%H%M).dump
df -h /                                                    # several GB free before building
git pull
docker compose build app
docker compose run --rm app node_modules/.bin/prisma migrate deploy
docker compose up -d
docker compose ps                                          # app becomes (healthy)
curl -s https://app.32-236-251-56.sslip.io/api/health
docker builder prune -af                                   # build cache only
```

- Never run `docker volume prune`, `docker system prune --volumes`, `prisma migrate reset`, `prisma migrate dev`, or the seed on the server.
- A new environment variable goes into `lib/env.ts` in the code, into `.env` on the server, and into `.env.build` too if the build needs it (the Google keys do). Then rebuild and `up -d`.
- Rollback: check out the previous commit, rebuild, `up -d`. Migrations are additive, so the previous code still runs on the newer schema. Restoring a dump (`pg_restore --clean`) is the last resort.
- Logs: `docker compose logs -f app --tail 100`. Database shell: `docker compose exec postgres psql -U skillflow -d skillflow`.

