"use client";

import { useState } from "react";
import { Icon } from "@/components/core/Icon.jsx";
import { SkillImage } from "@/components/core/SkillImage";
import { playableSrc } from "@/lib/playable-src";

function isLocalVideo(url: string) {
  return url.startsWith("/uploads/") && /\.(?:mp4|webm|mov)$/i.test(url);
}

/**
 * The stage's short clip. A still frame until the learner presses play, so nothing loads or plays on its own.
 * YouTube links become youtube-nocookie embeds through playableSrc.
 */
export function LessonScreen({ title, clipUrl, poster }: { title: string; clipUrl: string; poster?: string | null }) {
  const [playing, setPlaying] = useState(false);

  return (
    <div className="sf-clip">
      {playing ? (
        isLocalVideo(clipUrl) ? (
          <video src={clipUrl} controls autoPlay playsInline className="sf-clip-media" />
        ) : (
          <iframe
            className="sf-clip-media"
            src={playableSrc(clipUrl)}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        )
      ) : (
        <button type="button" className="sf-clip-poster" onClick={() => setPlaying(true)} aria-label={`Play: ${title}`}>
          {poster ? <SkillImage src={poster} alt="" fill preload sizes="(max-width: 960px) 100vw, 680px" /> : null}
          <span className="sf-clip-play" aria-hidden="true">
            <Icon name="play" size={24} />
          </span>
        </button>
      )}
    </div>
  );
}
