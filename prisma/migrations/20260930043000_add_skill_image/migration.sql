ALTER TABLE "Skill" ADD COLUMN "image" TEXT;

UPDATE "Skill" SET "image" = CASE "slug"
  WHEN 'full-stack-web-dev' THEN '/skills/web.jpg'
  WHEN 'art-painting' THEN '/skills/art.jpg'
  WHEN 'content-creation' THEN '/skills/content.jpg'
  WHEN 'photography' THEN '/skills/photo.jpg'
  WHEN 'music-production' THEN '/skills/music.jpg'
  ELSE '/skills/' || "slug" || '.jpg'
END;

ALTER TABLE "Skill" ALTER COLUMN "image" SET NOT NULL;
