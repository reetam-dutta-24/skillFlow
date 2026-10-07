# SkillFlow

A mastery-first learning platform. Curated roadmaps, your own resources, and an explain-back check are the product. Version 1 ships the roadmaps, the lessons, and an explain-back that walks one idea at a time. There is no quiz.

## Status

Thirty paths are free. All thirty have catalogs:

- Full-Stack Web Development — 12 stages, 64 resources. Stages 1–9 are the open stretch.
- Travel Vlogging — 8 stages, 46 resources. Stages 1–5 are the open stretch.
- Content Creation — 10 stages, 57 resources. Stages 1–7 are the open stretch.
- Music Production — 8 stages, 45 resources. Stages 1–5 are the open stretch.
- Self Grooming — 8 stages, 47 resources. Stages 1–5 are the open stretch.
- Animation & VFX (`animation`) — 8 stages, 41 resources. Stages 1–5 are the open stretch.
- IoT & Robot Automation — 8 stages, 46 resources. Stages 1–5 are the open stretch.
- Screenwriting — 8 stages, 21 resources. Stages 1–5 are the open stretch.
- Graphic Design — 8 stages, 18 resources. Stages 1–5 are the open stretch.
- SEO — 8 stages, 15 resources. Stages 1–5 are the open stretch.
- AI Tools — 8 stages, 15 resources. Stages 1–5 are the open stretch.
- Cybersecurity — 8 stages, 47 resources. Stages 1–5 are the open stretch.
- Digital Marketing — 8 stages, 44 resources. Stages 1–5 are the open stretch.
- Personal Finance — 8 stages, 45 resources. Stages 1–5 are the open stretch.
- Public Speaking — 8 stages, 44 resources. Stages 1–5 are the open stretch.
- Sound Design — 8 stages, 24 resources. Stages 1–5 are the open stretch.
- Nutrition — 8 stages, 22 resources. Stages 1–5 are the open stretch.
- Psychology — 8 stages, 13 resources. Stages 1–5 are the open stretch.
- Podcasting — 8 stages, 12 resources. Stages 1–5 are the open stretch.
- Guitar — 8 stages, 10 resources. Stages 1–5 are the open stretch.
- Chess — 8 stages, 10 resources. Stages 1–5 are the open stretch.
- Art & Painting — 8 stages, 43 resources. Stages 1–5 are the open stretch. Two links are marked for review and stay until a working page is chosen.
- Photography — 8 stages, 41 resources. Stages 1–5 are the open stretch. One link is marked for review and stays until a working page is chosen.
- Emergency Preparedness — 8 stages, 40 resources. Stages 1–5 are the open stretch. One link is marked for review and stays until a working page is chosen.
- Badminton — 8 stages, 41 resources. Stages 1–5 are the open stretch. One link is marked for review and stays until a working page is chosen.
- Relationships — 8 stages, 11 resources. Stages 1–5 are the open stretch.
- Socializing — 8 stages, 8 resources. Stages 1–5 are the open stretch.
- Interior Design — 8 stages, 8 resources. Stages 1–5 are the open stretch.
- Freelancing — 8 stages, 8 resources. Stages 1–5 are the open stretch.
- Travel Planning — 8 stages, 8 resources. Stages 1–5 are the open stretch.

The next stage on a free path opens after the explain-back. Every stage is open, so finishing the path can earn the certificate. A stage waiting on that pass stays readable, with a lock. Art & Painting stays a flagship. Every other niche is Premium, with no stages and no resources, until a subscription opens it.

The niche list shows 32 cards a page. Home and roadmaps show the first 12, a blurred peek of the next row, and a link to the full list.

Signed-in learners can keep a preset accent, turn on Spectrum for a slow dark wash of one color pair, or build their own gradient from a color palette, a hex value, or RGB. Public pages stay on Dusk.

Open Source is a per-niche community of posts. A learner shares text, an image, and source links. The post stays hidden until a moderator publishes it or rejects it. Signed-in learners can read a published post and ask the author one question. The author writes one answer. There is no comment thread. A moderator can hide a published post. Authors track and edit their work at `/open-source/me`. Reviewers work from `/open-source/review`. Admins manage roles at `/admin/community`. A public profile shows a person's published posts. Community posts never enter the catalog.

Creator studio is a signed-in library for a video the learner owns. An admin approves it onto that niche’s clip feed and the creator’s public profile. View counts stay in the studio.

The learner map counts people who opted in, one number per city. It lives under Nearby → Learners. Settings stores the city, the country, and the city centre. The map does not show names, and it does not use GPS. Set `MAP_MIN_LEARNERS` to hide cities below that count (the default is 5). Use `1` on your machine while you are the only person on the map. City search uses OpenStreetMap Nominatim. A `GEOCODER_USER_AGENT` value with a way to reach you is the polite way to call it.

Nearby → Events lists upcoming events for that saved city. The map opens on the city, and each pin is the venue. Ticketmaster and Google Events are optional. Leave a key empty and that source stays off. Community events need a review. Visitors read a saved copy that refreshes at most every 12 hours. Live search is part of Premium. An admin can use it without a charge. Every free path has its own search words.

A dead stored link can be marked unavailable. The lesson keeps the saved title, description, and key points.

## Tech stack

- Next.js 16.3.4, React 19, TypeScript, Tailwind CSS v4. Landing and auth pages are static. A signed-in visit to `/` goes to `/dashboard`. Shared catalog screens (niche grid, lessons, clips, submit picker) are cached for every visitor under the `catalog` tag. Public community lists, a published post, and contributor profiles are cached under the `community` tag. The Stripe price label is cached for an hour. Learner-map totals are cached under the `learner-map` tag, city search under `geocode`, and saved nearby events under `nearby-events`. Progress, the account menu, the review queue, and a person's own contributions stay per request
- PostgreSQL and Prisma 6
- Auth.js v5 — email and password with bcrypt, JWT sessions. Google is configured in code and is not on the login form
- Explain-back grading uses Gemini’s free tier when `GEMINI_API_KEY` is set. `OPENAI_API_KEY` is the fallback when that key is empty. With no key, the catalog questions stay and a stage cannot be passed

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

Check a researched file. This does not change stored resources. `<slug>` is any of the thirty free paths. The Full-Stack slug is `full-stack-web-dev` and its file is `content/catalog/full-stack-web-development.json`.

```bash
npx tsx scripts/verify-catalog.ts <slug>
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

## Open Source roles

Admins review, moderate, and grant roles in every niche. A maintainer reviews and moderates one niche and can grant reviewers there. A reviewer reviews one niche. Nobody reviews their own contribution or changes their own role.

To make someone a reviewer or maintainer, sign in as an admin, open `/admin/community`, find the person by their exact email, choose the niche and the role, and grant it.

Typing `fail this merge` as review feedback shows the review error state without saving anything.

## Nearby event keys

Copy the names from `.env.example`. Leave a key blank to turn that source off.

- `TICKETMASTER_API_KEY` — a free Consumer Key from [developer.ticketmaster.com](https://developer.ticketmaster.com/). Create an app, then copy the Consumer Key. The free tier is 5,000 calls a day. The app stops at that number.
- `SERPAPI_API_KEY` — a private key from [serpapi.com](https://serpapi.com/) (Dashboard → Your Private API Key). The free plan includes 250 searches a month. The app stops at 200.
- `CRON_SECRET` — any long random string. `openssl rand -hex 32` is enough. Call `GET /api/cron/events` with `Authorization: Bearer <that secret>` when you want to refresh the popular city and niche pairs.
- `EVENTS_TTL_HOURS` — how long a saved city and niche stays fresh. The default is 12.
- `EVENTS_CRON_PAIRS` — how many city and niche pairs that cron route refreshes. The default is 20.
- `GEOCODER_USER_AGENT` — already used by city search. Put an email or a site you control in it.

## Stripe

Premium is one subscription. Checkout and the customer portal run on Stripe. The app never collects a card. Leave the keys blank and `/upgrade` says Stripe is not configured.

- `STRIPE_SECRET_KEY` — the secret key from the Stripe dashboard.
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` — the publishable key. Checkout uses it on Stripe's page. The upgrade button sends the browser there.
- `STRIPE_PRICE_ID` — the price for that subscription.
- `STRIPE_WEBHOOK_SECRET` — the signing secret for `POST /api/stripe/webhook`.
- `STRIPE_PRICE_LABEL` — optional fallback if Stripe cannot be read. The upgrade page caches the real price for an hour. Checkout shows that price.

## Explain-back model

The explain-back walks one idea at a time. Set `GEMINI_API_KEY`. Opening a stage writes those ideas from the stage’s resources and keeps every key point. With no key, the questions already in the catalog stay. Each step needs a written review from the model before it moves on. An idea that holds is saved under Notes. A timeout or a reply that is not a review saves nothing, and the stage stays open.

- `GEMINI_API_KEY` — a free key from [aistudio.google.com/apikey](https://aistudio.google.com/apikey). No card. The app calls Gemini’s free tier (`gemini-flash-lite-latest`).
- `GEMINI_MODEL` — optional. The default is `gemini-flash-lite-latest`.
- `OPENAI_API_KEY` — a paid key from [platform.openai.com](https://platform.openai.com/). Used only when `GEMINI_API_KEY` is empty.
- `EXPLAIN_MODEL_KEY`, `EXPLAIN_MODEL_URL`, and `EXPLAIN_MODEL_NAME` — another OpenAI-compatible endpoint. These win when `EXPLAIN_MODEL_KEY` is set.

## Learner map demo

This only runs against a database on this machine, and it refuses to run when `NODE_ENV` is production. It does not run the seed.

```bash
npx tsx scripts/map-demo.ts add
npx tsx scripts/map-demo.ts remove
```

`add` puts six learners in Lisbon, Porto, Tokyo, and Bengaluru, and two in Reykjavik. Reykjavik stays hidden while `MAP_MIN_LEARNERS` is 5. Lisbon and Porto are close enough to form one bubble until you zoom in. In development, refresh `/map` and the new counts are there. In production they refresh when someone saves a city, or within an hour.

## Also live

Passing an explain-back records the stage and opens the next one. Every stage on a free path counts toward mastery and toward the certificate. A streak day is a UTC day with a saved explain-back or a saved note. Notes download as Word or PDF, and a stage summary uses only those notes. Progress links to a transcript of the stages already passed. A certificate is issued only when every stage on the path is passed. A passed idea comes back twice, 18 hours apart, and stays on screen until the learner writes an answer. Retention on Progress is the average of those answers. The stage pass stays. `/notes/practice` reads a public page, a text file, or a pasted passage, reviews an idea against that text, and does not pass a stage. A learner can save preferences for a skill they follow. The roadmap then shows a personal schedule built from the shared stages. Undo shows those shared stages again and leaves the resources in place. Opening a stage uses the same selection while the plan is on. The model does not invent that path. Onboarding offers five skills. Settings can follow any free path, and a Premium niche while the subscription is active. There is no leaderboard and no peer review. Stripe Checkout is at `/upgrade`. Premium is the niches outside the thirty, plus appearing on the learner map. The card form stays on Stripe. Without the keys, the page says Stripe is not configured.

## UI

The October 2026 polish is written up in `UI-AUDIT.md`, with before and after screenshots in `docs/ui-audit/`. Shared pieces: `Button` with a `pending` state, `useFocusTrap` for dialogs, `useToast` for success notes, `FocusMode` for explain-back, and `EmptyState` with one action. Every stage on the thirty free paths has a photo in `public/stages` (credits in `public/stages/credits.json`, picked by `scripts/fetch-stage-photos.ts`). Visible copy says path, niche, stage, and contribution. `scripts/a11y-scan.js` checks a page for overflow, unnamed controls, missing labels, and small targets. `AGENTS.md` lists the conventions under "UI conventions".

| Page | Performance (mobile / desktop) | Accessibility | Best practices |
| --- | --- | --- | --- |
| Landing | 69–75 / 99 | 100 | 100 |
| Home | 87 / 100 | 100 | 100 |
| A path (`/roadmap/chess`) | 89 / 100 | 100 | 100 |
| A lesson | 78 / 100 | 100 | 100 |

Lighthouse 12 against `next start`, 7 October 2026. Signed-in pages score 63 on SEO because they send `noindex` on purpose.

## What is still ahead

Integration tests and an end-to-end pass are not written. Deploy, CI, and error monitoring are not started. The case study is not written. Premium niches have no catalogs. `Project-roadmap.md` is the phase list. `AGENTS.md` is the working context for the next session.
