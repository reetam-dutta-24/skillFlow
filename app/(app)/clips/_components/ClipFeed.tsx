"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { SkillImage } from "@/components/core/SkillImage";
import Link from "next/link";
import type { ClipFeedSkill, ClipFormat, ClipItem } from "@/lib/types/pages";
import { Icon } from "@/components/core/Icon.jsx";
import { EmptyState } from "@/components/feedback/EmptyState.jsx";
import { playableSrc } from "@/lib/playable-src";
import { LocalClip } from "../../creator/_components/LocalClip";

function clipEmbed(url: string) {
  const src = playableSrc(url);
  try {
    const next = new URL(src);
    next.searchParams.set("enablejsapi", "1");
    return next.toString();
  } catch {
    return src;
  }
}

function silenceFrames(root: ParentNode | null | undefined) {
  root?.querySelectorAll("iframe").forEach((frame) => {
    if (!(frame instanceof HTMLIFrameElement)) return;
    frame.contentWindow?.postMessage(JSON.stringify({ event: "command", func: "pauseVideo", args: "" }), "*");
    frame.src = "about:blank";
  });
  root?.querySelectorAll("video").forEach((node) => {
    if (!(node instanceof HTMLVideoElement)) return;
    node.pause();
    node.removeAttribute("src");
    node.load();
  });
}

function ClipSurface({ clip }: { clip: ClipItem }) {
  if (clip.media === "file") return <LocalClip src={clip.url} title={clip.title} workId={clip.id} track />;
  return (
    <iframe
      src={clipEmbed(clip.url)}
      title={clip.title}
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      allowFullScreen
    />
  );
}

export function ClipFeed({
  skills,
  clips,
  initialSlug = "",
}: {
  skills: ClipFeedSkill[];
  clips: ClipItem[];
  initialSlug?: string;
}) {
  const followed =
    skills.find((skill) => skill.followed && clips.some((clip) => clip.skillSlug === skill.slug && clip.format === "short"))?.slug ??
    skills.find((skill) => skill.followed && skill.status === "available")?.slug ??
    skills[0]?.slug ??
    "";
  const requested = skills.find((skill) => skill.slug === initialSlug && skill.status === "available")?.slug;
  const [slug, setSlug] = useState(requested ?? followed);
  const [format, setFormat] = useState<ClipFormat>("short");
  const [playingId, setPlayingId] = useState<string | null>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const skill = skills.find((item) => item.slug === slug);
  const visible = clips.filter((clip) => clip.skillSlug === slug && clip.format === format);
  const poster = skill?.image;

  function stopClipAudio() {
    silenceFrames(rootRef.current);
  }

  // This page stays mounted and hidden after a client navigation. display:none does not stop YouTube audio.
  useLayoutEffect(() => {
    const root = rootRef.current;
    return () => {
      silenceFrames(root);
      setPlayingId(null);
    };
  }, []);

  function chooseSkill(nextSlug: string) {
    stopClipAudio();
    setSlug(nextSlug);
    setPlayingId(null);
    if (scrollerRef.current) scrollerRef.current.scrollTop = 0;
  }

  function chooseFormat(nextFormat: ClipFormat) {
    stopClipAudio();
    setFormat(nextFormat);
    setPlayingId(null);
    if (scrollerRef.current) scrollerRef.current.scrollTop = 0;
  }

  function step(direction: number) {
    const scroller = scrollerRef.current;
    if (!scroller || visible.length === 0) return;
    const height = scroller.clientHeight;
    if (height <= 0) return;
    const current = Math.min(visible.length - 1, Math.max(0, Math.round(scroller.scrollTop / height)));
    const next = Math.min(visible.length - 1, Math.max(0, current + direction));
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (visible[next].id !== playingId) stopClipAudio();
    scroller.scrollTo({ top: next * height, behavior: reduce ? "auto" : "smooth" });
    setPlayingId(visible[next].id);
  }

  return (
    <div ref={rootRef} className={format === "short" ? "sf-watch sf-watch-shorts" : "sf-watch sf-watch-videos"}>
      <div className="sf-watch-bar">
        <h1>Clips</h1>
        <div className="sf-watch-controls">
          <label className="sf-watch-skill">
            <span>Skill</span>
            <select value={slug} onChange={(event) => chooseSkill(event.target.value)}>
              {skills.map((item) => (
                <option key={item.slug} value={item.slug} disabled={item.status === "coming_soon"}>
                  {item.status === "coming_soon" ? `${item.name} (coming soon)` : item.name}
                </option>
              ))}
            </select>
          </label>
          <div className="sf-watch-format" role="group" aria-label="What to watch">
            <button type="button" aria-pressed={format === "short"} onClick={() => chooseFormat("short")}>
              Short clips
            </button>
            <button type="button" aria-pressed={format === "video"} onClick={() => chooseFormat("video")}>
              Videos
            </button>
          </div>
        </div>
      </div>
      <p className="sf-watch-note">
        {skill ? `${skill.name} only.` : "One skill at a time."} No comments, likes, or counts.
      </p>
      <div className="sf-watch-body">
        {visible.length === 0 ? (
          <EmptyState
            icon="clapperboard"
            title={format === "short" ? "No short clips open yet" : "No videos open yet"}
            description="This feed stays on the skill you picked. Clips from a locked stage stay off it."
          />
        ) : format === "short" ? (
          <div className="sf-shorts-stage">
            <div className="sf-shorts-player">
              <div
                className="sf-reel-scroller"
                ref={scrollerRef}
                tabIndex={0}
                aria-label="Short clip feed"
                onKeyDown={(event) => {
                  if (event.key === "ArrowDown") {
                    event.preventDefault();
                    step(1);
                  } else if (event.key === "ArrowUp") {
                    event.preventDefault();
                    step(-1);
                  }
                }}
              >
                {visible.map((clip) => (
                  <article key={clip.id} className="sf-reel">
                    <div className="sf-reel-frame">
                      {playingId === clip.id ? (
                        <ClipSurface clip={clip} />
                      ) : (
                        <>
                          {poster ? <SkillImage className="sf-reel-photo" src={poster} alt="" fill sizes="(max-width: 640px) 100vw, 420px" /> : null}
                          <button type="button" className="sf-reel-play" aria-label={`Play ${clip.title}`} onClick={() => setPlayingId(clip.id)}>
                            <span>
                              <Icon name="play" size={26} color="var(--text-on-accent)" />
                            </span>
                          </button>
                        </>
                      )}
                      <div className="sf-reel-caption">
                        <p>
                          {clip.skillName} · {clip.stageTitle}
                        </p>
                        <h2>{clip.title}</h2>
                        {clip.keyPoints.length ? <p>{clip.keyPoints.join(" ")}</p> : clip.description ? <p>{clip.description}</p> : null}
                        <Link href={clip.attributionHref}>{clip.attributionLabel}</Link>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
              <div className="sf-watch-nav">
                <button type="button" aria-label="Previous clip" disabled={visible.length < 2} onClick={() => step(-1)}>
                  <Icon name="chevron-up" size={18} />
                </button>
                <button type="button" aria-label="Next clip" disabled={visible.length < 2} onClick={() => step(1)}>
                  <Icon name="chevron-down" size={18} />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <ul className="sf-video-feed">
            {visible.map((clip) => (
              <li key={clip.id}>
                <article className="sf-video-card">
                  <div className="sf-video-thumb">
                    {playingId === clip.id ? (
                      <ClipSurface clip={clip} />
                    ) : (
                      <>
                        {poster ? <SkillImage src={poster} alt="" fill sizes="(max-width: 640px) 100vw, 360px" /> : null}
                        <button type="button" className="sf-reel-play" aria-label={`Play ${clip.title}`} onClick={() => setPlayingId(clip.id)}>
                          <span>
                            <Icon name="play" size={22} color="var(--text-on-accent)" />
                          </span>
                        </button>
                      </>
                    )}
                  </div>
                  <div className="sf-video-meta">
                    <h2>{clip.title}</h2>
                    <p>
                      {clip.skillName} · {clip.stageTitle}
                    </p>
                    {clip.description ? <p>{clip.description}</p> : null}
                    <Link href={clip.attributionHref}>{clip.attributionLabel}</Link>
                  </div>
                </article>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
