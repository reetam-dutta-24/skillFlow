# syntax=docker/dockerfile:1

# ── Base: Linux + Node 22 + what Prisma needs ─────────────────────────
FROM node:22-bookworm-slim AS base
RUN apt-get update \
 && apt-get install -y --no-install-recommends openssl ca-certificates \
 && rm -rf /var/lib/apt/lists/*
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# ── 1. deps: install every package (cached until package files change) ─
FROM base AS deps
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci

# ── 2. build: compile the app, then drop dev-only packages ────────────
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# The build reads the catalog from Postgres (cacheComponents prerenders it).
# The env file is mounted only for this step as /app/.env; it is never saved in the image.
ENV SKIP_TYPECHECK=1
RUN --mount=type=secret,id=buildenv,target=/app/.env \
    npx prisma generate \
 && npm run build \
 && npm prune --omit=dev

# ── 3. runner: only what is needed to run, as a non-root user ─────────
FROM base AS runner
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0

COPY --from=build --chown=node:node /app/package.json ./
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/.next ./.next
COPY --from=build --chown=node:node /app/public ./public
COPY --from=build --chown=node:node /app/prisma ./prisma
COPY --from=build --chown=node:node /app/prisma.config.ts /app/next.config.ts ./

# Uploads are written here at runtime (mount a volume over it so they survive restarts).
RUN mkdir -p public/uploads && chown -R node:node public/uploads

USER node
EXPOSE 3000

# Docker marks the container unhealthy when /api/health stops answering 200.
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD node -e "fetch('http://localhost:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

# Run next directly (not through npm) so stop signals reach the app.
CMD ["node_modules/.bin/next", "start"]
