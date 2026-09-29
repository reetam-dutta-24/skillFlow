"use client";

import { useState } from "react";
import { LessonPlayer } from "@/components/learning/LessonPlayer.jsx";

type FeaturedResource = {
  title: string;
  url: string;
  source: string;
};

/** Watched stays on this screen until reload. It is not saved. */
export function LessonScreen({
  title,
  skill,
  stage,
  clipUrl,
  poster,
  resource,
  continueHref,
}: {
  title: string;
  skill: string;
  stage: string;
  clipUrl?: string;
  poster?: string;
  resource?: FeaturedResource;
  continueHref?: string;
}) {
  const [watched, setWatched] = useState(false);

  return (
    <LessonPlayer
      title={title}
      skill={skill}
      stage={stage}
      clipUrl={clipUrl}
      poster={poster}
      watched={watched}
      onToggleWatched={() => setWatched((value) => !value)}
      resource={resource}
      continueHref={continueHref}
      style={{ maxWidth: "none" }}
    />
  );
}
