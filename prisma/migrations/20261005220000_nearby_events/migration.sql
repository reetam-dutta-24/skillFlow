-- Nearby events. Safe to run when the tables already exist on this machine.

DO $$ BEGIN
  CREATE TYPE "EventSource" AS ENUM ('TICKETMASTER', 'GOOGLE_EVENTS', 'COMMUNITY');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "EventStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "ApiUsage" (
  "id" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "period" TEXT NOT NULL,
  "count" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "ApiUsage_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ApiUsage_provider_period_key" ON "ApiUsage"("provider", "period");

CREATE TABLE IF NOT EXISTS "Event" (
  "id" TEXT NOT NULL,
  "source" "EventSource" NOT NULL,
  "externalId" TEXT,
  "skillId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "startsAt" TIMESTAMP(3) NOT NULL,
  "endsAt" TIMESTAMP(3),
  "venueName" TEXT,
  "address" TEXT,
  "city" TEXT,
  "countryCode" TEXT,
  "lat" DOUBLE PRECISION,
  "lng" DOUBLE PRECISION,
  "url" TEXT NOT NULL,
  "imageUrl" TEXT,
  "isOnline" BOOLEAN NOT NULL DEFAULT false,
  "status" "EventStatus" NOT NULL DEFAULT 'PENDING',
  "submittedById" TEXT,
  "reviewedById" TEXT,
  "reviewNote" TEXT,
  "fetchedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Event_source_externalId_skillId_key" ON "Event"("source", "externalId", "skillId");
CREATE INDEX IF NOT EXISTS "Event_lat_lng_idx" ON "Event"("lat", "lng");
CREATE INDEX IF NOT EXISTS "Event_skillId_status_startsAt_idx" ON "Event"("skillId", "status", "startsAt");
CREATE INDEX IF NOT EXISTS "Event_status_createdAt_idx" ON "Event"("status", "createdAt");
CREATE INDEX IF NOT EXISTS "Event_submittedById_createdAt_idx" ON "Event"("submittedById", "createdAt");

CREATE TABLE IF NOT EXISTS "EventFetch" (
  "id" TEXT NOT NULL,
  "skillId" TEXT NOT NULL,
  "cityKey" TEXT NOT NULL,
  "source" "EventSource" NOT NULL,
  "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "resultCount" INTEGER NOT NULL DEFAULT 0,
  "ok" BOOLEAN NOT NULL DEFAULT false,
  "error" TEXT,
  CONSTRAINT "EventFetch_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "EventFetch_skillId_cityKey_source_key" ON "EventFetch"("skillId", "cityKey", "source");

DO $$ BEGIN
  ALTER TABLE "Event" ADD CONSTRAINT "Event_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "Event" ADD CONSTRAINT "Event_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "Event" ADD CONSTRAINT "Event_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "EventFetch" ADD CONSTRAINT "EventFetch_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
