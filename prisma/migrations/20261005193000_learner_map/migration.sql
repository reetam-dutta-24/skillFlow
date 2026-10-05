-- City, country, and city-centre coordinates for the learner map.
-- IF NOT EXISTS keeps this safe on a database that already has some of these columns.

ALTER TABLE "LearnerProfile" ADD COLUMN IF NOT EXISTS "city" TEXT;
ALTER TABLE "LearnerProfile" ADD COLUMN IF NOT EXISTS "country" TEXT;
ALTER TABLE "LearnerProfile" ADD COLUMN IF NOT EXISTS "lat" DOUBLE PRECISION;
ALTER TABLE "LearnerProfile" ADD COLUMN IF NOT EXISTS "lng" DOUBLE PRECISION;
ALTER TABLE "LearnerProfile" ADD COLUMN IF NOT EXISTS "showOnMap" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS "LearnerProfile_showOnMap_idx" ON "LearnerProfile"("showOnMap");
