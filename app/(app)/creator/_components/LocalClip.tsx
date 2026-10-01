"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { recordCreatorWatch } from "../actions";

export function LocalClip({
  src,
  title,
  workId,
  track,
}: {
  src: string;
  title: string;
  workId: string;
  track: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [viewId] = useState(() => (track ? crypto.randomUUID() : ""));

  function report(video: HTMLVideoElement) {
    if (!viewId) return;
    const durationSec = Number.isFinite(video.duration) ? video.duration : 0;
    const watchedSec = Number.isFinite(video.currentTime) ? video.currentTime : 0;
    const completed = durationSec > 0 && watchedSec >= durationSec * 0.9;
    void recordCreatorWatch({
      viewId,
      workId,
      watchedSec,
      durationSec,
      completed,
    });
  }

  useLayoutEffect(() => {
    const video = videoRef.current;
    return () => {
      if (!video || !viewId) return;
      const durationSec = Number.isFinite(video.duration) ? video.duration : 0;
      const watchedSec = Number.isFinite(video.currentTime) ? video.currentTime : 0;
      const completed = durationSec > 0 && watchedSec >= durationSec * 0.9;
      void recordCreatorWatch({ viewId, workId, watchedSec, durationSec, completed });
      video.pause();
    };
  }, [viewId, workId]);

  return (
    <video
      ref={videoRef}
      src={src}
      title={title}
      controls
      autoPlay
      playsInline
      onPause={(event) => report(event.currentTarget)}
      onEnded={(event) => report(event.currentTarget)}
    />
  );
}
