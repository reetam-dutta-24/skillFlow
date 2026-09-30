-- Optional photo for a roadmap stage. Admins set it. Existing stages stay without one.
ALTER TABLE "RoadmapStage" ADD COLUMN "image" TEXT;
