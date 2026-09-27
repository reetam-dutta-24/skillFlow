<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Cursor Cloud specific instructions

PostgreSQL 16 is installed on the VM. Docker is not used here. `service postgresql start` does not work because systemd is not running; start cluster `16/main` with `sudo pg_ctlcluster 16 main start`.

The dev database matches `docker-compose.yml`: user `skillflow`, password `localdev`, database `skillflow`, port `5432`. On boot, create that role and database if they are missing, write `.env` when it is absent, then run `npx prisma migrate deploy` and `npx prisma db seed`. `.env` needs `DATABASE_URL`, `AUTH_SECRET`, and `AUTH_TRUST_HOST=true`. `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET` are only required for Google sign-in.

- Dev server: `npm run dev -- --hostname 0.0.0.0 --port 3000`. Open `http://localhost:3000`. Next.js blocks dev resources when the host is `127.0.0.1`.
- `npm run lint` reports existing errors in `components/`. `npx tsc --noEmit` passes after `next dev` or `next build` has generated `.next` types. There is no test script.
- Email/password signup at `/signup` creates a `User` row. Auth.js handlers are in `app/api/auth/route.ts`, so credentials login calls to `/api/auth/*` 404 until that route is a catch-all.
