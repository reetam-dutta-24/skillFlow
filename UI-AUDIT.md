# SkillFlow UI/UX audit

This is a dated record of the October 2026 polish, kept as written. Since then the catalog editor it mentions was replaced by the Catalog CMS (8 October 2026); `AGENTS.md` and `HANDOFF.md` describe the current app.

Phase 0 of the final polish. No product code was changed for this audit. It was written on 7 October 2026 against the working tree at `445edab`.

## How this was checked

- **Screens.** Headless Microsoft Edge, driven over the DevTools protocol (no new dependency), signed in as a fresh account `ui-audit@skillflow.local` on the local dev database. Captured at 1440×900 and 375×812, in dark and light, with `prefers-reduced-motion` both ways. The before screenshots are in `docs/ui-audit/before/`.
- **Contrast.** Computed from the tokens in `app/globals.css` for all ten color presets, with translucent text composited over the real surface. Results are in the contrast table below.
- **Code.** Component kit, shared CSS, and every route's page file.
- **Not seen on screen yet.** Admin pages, creator studio upload, Open Source detail and review, certificate, transcript, and a passed or "needs another look" explain-back. The audit account is a new learner with no admin role and no passes. Those rows are marked *code review*.

Severity: **High** blocks or misleads a learner, or fails WCAG AA. **Med** visibly unpolished or inconsistent. **Low** cosmetic.

---

## Top 15

| # | Issue | Where | Principle | Severity |
| --- | --- | --- | --- | --- |
| 1 | Key points render as one run-on paragraph: `keyPoints.join(" ")` drops the boundary between points ("…apart from castling Set up with a light square…"). Other resources appear as untitled paragraphs, not resource cards. | Lesson | 4, 1, 19 | High |
| 2 | Roadmap stage list is a column of identical text cards. 27 of 30 paths have no stage image, type is 11–13px, every stage carries the same visual weight, and locked stages look like open ones apart from a small chip. | Roadmap `/roadmap/[slug]` | 1, 3, 4, 20 | High |
| 3 | About 216 stages (27 paths × 8) have no photo. The 30 existing photos live in `public/uploads`, which is gitignored, so a clone or a deploy has none of them. | Roadmap, lesson, Home lanes | 16, 2 | High |
| 4 | Landing hero streams 4K MP4s of 9–45 MB each (111 MB in `public/landing`), on phones too, with no poster frame. | Landing | 16 | High |
| 5 | Light theme fails contrast: `--text-faint` is 2.3–2.5:1, `--text-muted` is 4.35–4.46:1 on seven of ten accents, input and card borders are 1.2–1.7:1 (need 3:1), success green as text is 3.4–3.6:1. Dark theme `--text-faint` is 3.5:1 and is used as text in 32 places. | Everywhere | 11 | High |
| 6 | Mobile top bar truncates the page title to "oa…" / "es…": theme toggle, bell, and the full account name take the row. The menu button sits under the brand. | Every signed-in page at 375px | 15, 14 | High |
| 7 | Mobile landing header wraps "Log in" and "Get started" onto two lines and stacks a Menu row under it: about 140px of header before the hero. | Landing at 375px | 15, 1 | High |
| 8 | Log in and Sign up at 375px: the niche carousel fills the first screen; the form starts below the fold. | Auth | 1, 15 | High |
| 9 | Explain-back is not distraction-free: the full sidebar and top bar stay; the step dots are 28px (under the 44px target); "Back to the path" skips the lesson the learner came from. | `/milestone/[stageId]` | 19, 11, 14 | High |
| 10 | Accent differs page to page for an account whose accent cookie is not set yet: most pages paint the public Dusk accent, Settings syncs the stored Tide accent. | All signed-in pages | 2 | Med |
| 11 | No toast or shared status component. `Button` has hover only (JS state), no pressed, focus, or loading state; 19 pages hand-roll `<button className>`. Pending text differs ("Saving…", "Saving...", "Searching"). | System | 6, 2 | Med |
| 12 | Six separate dialog implementations; the confirm dialog, the catalog editor, and the admin queue do not trap focus. | Dialogs | 11 | Med |
| 13 | Every page shows its title twice (top bar and `h1`). Sidebar labels truncate at 168px ("Creator stu…", "Submit a re…"). | App shell | 14, 3 | Med |
| 14 | The free-plan upsell is the first and largest block on Home, repeated on Niches, and nested card-in-card on Settings. It competes with the learner's next step. | Home, Niches, Settings | 1, 18 | Med |
| 15 | Terminology drifts: "path" (70) vs "roadmap" (42), "niche" (84) vs "skill" (68), "milestone" vs "stage", "contribution" vs "post". The breadcrumb on a roadmap reads "All roadmaps / Open Source". | Copy | 17, 14 | Med |

Also asked for: the landing logo overlap. The circle "N" over the wordmark is Next.js's **development** indicator (`next dev` only; it shows "Compiling…" or "1 Issue"). It never ships in a production build. It also covers the sidebar brand and the mobile menu button in development. Fix: `devIndicators: { position: "bottom-right" }` in `next.config.ts`. Severity Low (dev only), but it hides real UI while testing.

---

## Contrast, measured

WCAG ratio for text (needs 4.5:1) and UI boundaries (needs 3:1). Translucent text is composited over the real card surface. `!` fails.

| Pair | tide | iris | grove | ember | dusk | bloom | pulse | volt | ion | nova |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Dark · secondary (72%) on card | 9.17 | 9.51 | 9.16 | 9.34 | 9.50 | 9.46 | 9.58 | 9.21 | 9.34 | 9.49 |
| Dark · muted (55%) on card | 5.91 | 6.03 | 5.89 | 5.98 | 6.04 | 6.01 | 6.03 | 5.93 | 5.99 | 6.03 |
| Dark · faint (38%) on card | 3.53! | 3.55! | 3.51! | 3.56! | 3.58! | 3.54! | 3.54! | 3.55! | 3.54! | 3.54! |
| Dark · lock (45%) on card | 4.38! | 4.47! | 4.40! | 4.44! | 4.48! | 4.46! | 4.47! | 4.40! | 4.44! | 4.47! |
| Dark · accent text on card | 12.78 | 9.98 | 13.14 | 10.65 | 9.18 | 7.13 | 8.42 | 14.56 | 9.71 | 8.76 |
| White on primary button (worst gradient stop) | 5.36 | 8.98 | 5.47 | 5.18 | 10.36 | 6.32 | 6.04 | 4.99 | 6.70 | 6.32 |
| Light · muted `#64748b` on card | 4.55 | 4.35! | 4.55 | 4.44! | 4.38! | 4.46! | 4.43! | 4.57 | 4.46! | 4.42! |
| Light · faint `#94a3b8` on card | 2.45! | 2.34! | 2.45! | 2.39! | 2.36! | 2.40! | 2.39! | 2.46! | 2.40! | 2.38! |
| Light · accent text on card | 5.12 | 6.49 | 5.24 | 4.83 | 7.27 | 5.93 | 5.62 | 6.80 | 6.28 | 5.88 |
| Light · link on page | 6.37 | 8.27 | 7.36 | 6.86 | 9.60 | 8.02 | 7.15 | 8.48 | 9.60 | 7.93 |
| Light · input/card border (3:1) | 1.32! | 1.54! | 1.36! | 1.50! | 1.56! | 1.67! | 1.70! | 1.18! | 1.66! | 1.51! |
| Light · warn `#b45309` on card | 4.80 | 4.59 | 4.80 | 4.68 | 4.62 | 4.71 | 4.67 | 4.82 | 4.71 | 4.67 |
| Light · pass `#059669` on card | 3.60! | 3.44! | 3.60! | 3.51! | 3.47! | 3.53! | 3.51! | 3.62! | 3.53! | 3.50! |

Not measured by token: Spectrum (the hue drifts; its text tokens are chosen per frame) and custom gradients (the boot script picks white or ink text by luminance). Text over photos (niche cards, the landing hero) depends on the image; see the screen tables.

---

## System-level fixes

One change each, many screens fixed.

| Fix | Repairs | Principles |
| --- | --- | --- |
| Raise `--text-faint` to about 0.55 alpha in dark and `#64748b` → `#526174`-class slate in light; use faint for decoration only, never body text | Contrast row 5, every meta line | 11 |
| Light borders: mix more accent and slate into `--border-default` so inputs reach 3:1; keep `--border-subtle` for dividers only | Every form and card in light | 11, 2 |
| Light `--state-pass` to an emerald that reaches 4.5:1 for text; keep the current one for fills | Pass chips and messages | 11, 5 |
| Type scale: collapse nine sizes to six (12 / 14 / 16 / 20 / 28 / 40), body 15–16px with 1.55 line height, meta never under 12px | Lesson, roadmap, cards, settings | 4, 1 |
| Radius scale of four (8 / 12 / 18 / 999) and an elevation scale of three; replace the 20 radii and 14 shadows | Cards, inputs, dialogs, chips | 2 |
| `Button`: CSS-driven hover, `:active` press, visible `:focus-visible` ring, and a `pending` prop that shows a spinner, keeps width, sets `aria-busy` | Every action | 6, 2, 11 |
| One `Dialog` (focus trap, Escape, return focus, labelled) used by the six dialogs | Confirm, admin, recall, usage cutoff | 11, 2 |
| A small `Toast` / status region for success, with errors staying inline next to the field | Settings, follow, review, save note | 6 |
| `EmptyState` requires one action; `Skeleton` presets shaped like a card row, a stage row, and a lesson | Every list | 7, 8 |
| `PageHeader` (eyebrow, title, one line, one primary action, optional breadcrumb) and drop the duplicate top-bar title on desktop | Every page | 14, 1 |
| Sidebar 200px with labels that wrap, or shorter labels ("Creator", "Submit") | Shell | 3, 14 |
| Mobile top bar: icon-only theme switch, avatar without the name, title gets the remaining width | Every page at 375px | 15 |
| Stage images under `public/stages/<slug>/<order>.jpg`, committed, served through `next/image` with `sizes`, one shared color grade so photos from different sources sit together | Roadmap, lesson, Home | 16, 2, 20 |
| `devIndicators.position` to bottom-right | Dev only | — |

---

## Terminology

Pick one word per idea and use it everywhere in visible copy (routes and code stay).

| Idea | Found | Proposal |
| --- | --- | --- |
| The ordered list of stages | "path" 70, "roadmap" 42 | **Path** in copy. The sidebar item and page can read "Paths". Route stays `/roadmap`. |
| A subject such as Chess | "niche" 84, "skill" 68 | **Niche** everywhere in copy ("Niches you follow"). |
| A finished stage | "stage", "milestone" ("Milestones this week") | **Stage**. "Stages passed this week". |
| An Open Source item | "contribution" 35, "post" 13 | **Post**, matching AGENTS.md. |
| The check | "Explain-back", "explain-back", "explain-back gate", "Check this idea" | **Explain-back** (capital E at the start of a label). The button: "Check my explanation". |
| Pending verbs | "Saving…", "Saving...", "Searching" | Ellipsis character, present participle: "Saving…", "Searching…". |

---

## Screens

### Landing `/`

| Issue | # | Sev | Fix |
| --- | --- | --- | --- |
| 111 MB of 4K hero video, played at every width, no poster | 16 | High | 720p/1080p encodes under 3 MB, poster image, video only at ≥ 960px and without reduced motion |
| Mobile header wraps three controls and adds a Menu row | 15, 1 | High | Brand + Menu only; theme and log in move into the menu; one "Get started" |
| Theme switch does nothing visible above the fold (hero is a dark video in both themes) | 6 | Low | Keep, but the switch belongs in the menu on phones |
| Hero lead is 3 lines of dense feature list | 4, 17 | Low | One sentence; the list belongs in Features |
| Dev "N" covers the wordmark | — | Low | `devIndicators` (dev only) |

### Log in / Sign up

| Issue | # | Sev | Fix |
| --- | --- | --- | --- |
| At 375px the carousel takes the first screen; the form is below the fold | 1, 15 | High | Form first on phones; carousel hidden or reduced to one line under 960px |
| Submit gives no pending feedback beyond disabled; a slow server looks frozen | 6 | Med | `Button pending` |
| "Already have an account? Log in" link is 13px | 11 | Low | 14px, 44px target |

### App shell (sidebar, top bar)

| Issue | # | Sev | Fix |
| --- | --- | --- | --- |
| Page title shown twice (top bar + `h1`) | 14 | Med | Top bar title only on phones, or breadcrumbs instead |
| Labels truncate at 168px | 3 | Med | 200px or shorter labels |
| At 375px the title truncates to 3 letters | 15 | High | Icon-only controls on phones |
| Active item is a pill with low-contrast fill in light | 11, 14 | Low | Accent bar + bold label |

### Home `/dashboard`

| Issue | # | Sev | Fix |
| --- | --- | --- | --- |
| Upsell first, then a large "0 days in a row" banner for a new learner | 1, 18 | Med | Next step first ("Continue Chess, stage 1"); upsell once, compact, below |
| Four stat tiles of zeros; one tile ("Milestones this week") has an accent border for no reason | 1, 5 | Low | Hide zeros for a new learner, or one quiet line |
| "No skill followed yet — follow a skill below" relies on scrolling | 8 | Med | Button: "Browse niches" |

### Niches `/skills`

| Issue | # | Sev | Fix |
| --- | --- | --- | --- |
| Labels and titles sit on bright photos (Travel, Self Grooming, Animation) with no scrim | 11 | High | Bottom gradient scrim under all card text |
| Premium cards with no cover are flat black blocks | 2, 20 | Med | A designed placeholder per niche group |
| "Upgrade to open" reads as text, not an action | 1 | Low | Quiet link style with an icon |
| Free-plan banner repeated from Home | 1 | Low | Remove here |

### Roadmap `/roadmap/[slug]`

| Issue | # | Sev | Fix |
| --- | --- | --- | --- |
| 27 paths have no stage images; stage cards are text-only | 16, 20 | High | Stage photos (Pexels) in `public/stages`, card layout built around the image |
| Stage text 11–13px, every card the same weight, open and locked look alike | 1, 4 | High | Current stage as a larger "Up next" card with "Start stage"; passed stages compact with a check; locked stages dimmed with the reason |
| "Free path" pill looks like a button | 2 | Med | Use the badge style |
| Breadcrumb "All roadmaps / Open Source" — the second link is a different section | 14 | Med | "Paths / Chess", with the community link elsewhere |
| Progress bar under the meta line is 3px and unlabeled | 11 | Low | Labelled progress with "0 of 8 passed" |

### Lesson `/lesson/[stageId]`

| Issue | # | Sev | Fix |
| --- | --- | --- | --- |
| Key points joined into one paragraph | 4 | High | A bulleted list per resource |
| Only one resource gets a card; the rest are unlabeled paragraphs | 1, 2 | High | Resource cards: type (Video, Article, Course), provider, title, what you learn, "Open ↗" |
| The `h1` is the video's title, the stage name is a 10px eyebrow | 14 | Med | Stage title as `h1`, "Stage 1 of 8 · Chess" above, resource titles inside cards |
| "Hook clip" chip is unexplained | 17 | Low | "Short intro" or drop |
| No "Up next" after the resources | 19 | Low | One calm block: "When you're ready: Explain it back" |
| Next.js warns the cover image is the LCP but lazy-loaded | 16 | Low | `priority` on the poster |

### Explain-back `/milestone/[stageId]`

| Issue | # | Sev | Fix |
| --- | --- | --- | --- |
| Full app chrome around the one task that should be calm | 19 | High | Focus layout: sidebar collapsed, narrow column, "Idea 2 of 7" in words |
| Step dots 28px | 11 | High | 44px targets or a progress bar with text |
| "Back to the path" skips the lesson | 14 | Med | Breadcrumb: Chess / Stage 1 / Explain-back |
| Textarea has no character count or note that the draft is kept | 9, 10 | Med | Keep the draft locally and say so |
| Result states not seen (no model call on the audit account) | — | — | Review in Phase 2 |

### Notes `/notes`

| Issue | # | Sev | Fix |
| --- | --- | --- | --- |
| Empty state has no action; "Practice an idea" sits above it | 8 | Low | Action inside the empty state |

### Progress `/progress`, Analytics `/analytics`

| Issue | # | Sev | Fix |
| --- | --- | --- | --- |
| Empty state without an action | 8 | Med | "Browse niches" |
| "Retention —" tile for a new learner | 1 | Low | Hide until there is a recall |

### Settings `/settings`

| Issue | # | Sev | Fix |
| --- | --- | --- | --- |
| Free-plan card nested inside the Plan card | 2, 3 | Med | One card |
| "Save city" disabled with no reason | 6 | Med | Hint: "Pick a city from the list first" |
| Accent swatches have no visible names except the selected one; 32px targets | 11 | Med | Names on hover and focus, 44px |
| "Developer previews" visible in development (expected) | — | — | — |

### Nearby `/nearby`, `/nearby/events`

| Issue | # | Sev | Fix |
| --- | --- | --- | --- |
| Tabs above the `h1` | 14 | Low | Header, then tabs |
| Map controls are 30px | 11 | Med | 44px buttons |

### Upgrade `/upgrade`

| Issue | # | Sev | Fix |
| --- | --- | --- | --- |
| Headline uses a light weight seen nowhere else | 2, 4 | Low | Use the heading weight |
| No line on cancelling | 18 | Low | "Cancel any time from Settings" |

### Clips `/clips`

| Issue | # | Sev | Fix |
| --- | --- | --- | --- |
| Up/down arrows 40px, no keyboard hint | 11 | Low | 44px, arrow-key support stated |

### 404 and error pages

| Issue | # | Sev | Fix |
| --- | --- | --- | --- |
| Body 13px, "Back to home" is an outline button | 1 | Low | Primary button |

### Code review only (not captured on screen)

| Screen | Issue | # | Sev |
| --- | --- | --- | --- |
| Open Source review, contribution page | Tables of chips; long forms without a wizard on review | 3 | Med |
| Admin catalog, queues | Dialogs without focus trap | 11 | Med |
| Creator studio upload | Native file input with no progress | 6 | Med |
| Certificate | Plain sheet; this is the one place to be quietly beautiful | 20 | Med |
| Transcript | Plain list | 3 | Low |

---

## What was fine

No page scrolls sideways at 375px. A skip link exists. Focus outlines are visible on keyboard focus. Reduced motion is honoured in five CSS blocks and eleven components. Dark-theme body text, links, accent text, and primary buttons all pass. Empty states exist on most lists.

---

## Resolution

Phases 1–5, 7 October 2026. Commits `e936412`, `e1caf49`, `00a55ea`, `739863b`, and the Phase 5 commit after them. Screens in `docs/ui-audit/after-phase1`, `after-phase2`, `after-phase3`, and `phase4`.

| # | Issue | Status |
| --- | --- | --- |
| 1 | Key points as one paragraph | Fixed. Each resource is a card with a "What you will learn" list. Clip captions separate points with a middle dot |
| 2 | Roadmap stage list of identical text cards | Fixed. Cover hero, "Up next" card, photo stage cards with passed / up next / locked states |
| 3 | 216 stages without a photo | Fixed. 246 photos committed in `public/stages`, credits in `credits.json` |
| 4 | 111 MB of 4K hero video on phones | Fixed for phones: 49 KB poster, video only at 960px and up. Phone landing is 449 KB. The 4K files still need 1080p encodes (no ffmpeg on this machine). Follow-up, 8 October 2026: replaced by compressed `hero-1.mp4` to `hero-5.mp4`, 10.7 MB in all (was 115 MB) |
| 5 | Light-theme contrast | Fixed with measured tokens |
| 6 | Mobile top bar truncation | Fixed. Icon-only controls, 44px menu button |
| 7 | Mobile landing header on three rows | Fixed. Brand, Get started, and Menu; log in and theme moved into the menu |
| 8 | Auth form below the fold on phones | Fixed. Form first under 960px |
| 9 | Explain-back not distraction-free | Fixed. Focus mode, breadcrumbs back to the lesson, draft kept on the device |
| 10 | Accent differs page to page | Fixed. The saved accent syncs from the account menu |
| 11 | No toast, Button without states | Fixed. `Button` pending, CSS states, `useToast` |
| 12 | Dialogs without a focus trap | Fixed. `useFocusTrap` in the confirm dialog, the admin queue, and the catalog editor |
| 13 | Title twice, truncated sidebar labels | Fixed. Top-bar title on phones only, 216px sidebar |
| 14 | Upsell first on Home, repeated on Niches, nested on Settings | Fixed. One quiet line at the bottom of Home, removed from Niches, one Plan card in Settings |
| 15 | Terminology drift | Fixed in visible copy: path, niche, stage, contribution. Routes and code names stay |

Found and fixed during QA: six landing feature images were missing (400s on every visit); a CLS of 0.06 from the scrollbar appearing after streaming; MapLibre's white zoom box in dark mode; the Open Source rail crushing "Available · Followed"; the transcript's empty row squeezed into the number column.
