"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { SKILL_CHOICES } from "@/lib/learner";
import type { ClipFeedSkill, ClipFormat, ClipItem } from "@/lib/types/pages";
import { Icon } from "@/components/core/Icon.jsx";
import { EmptyState } from "@/components/feedback/EmptyState.jsx";

function playableSrc(url: string) {
  try {
    const next = new URL(url);
    next.searchParams.set("autoplay", "1");
    return next.toString();
  } catch {
    return url;
  }
}

export function ClipFeed({ skills, clips }: { skills: ClipFeedSkill[]; clips: ClipItem[] }) {
  const initial =
    skills.find((skill) => skill.followed && clips.some((clip) => clip.skillSlug === skill.slug && clip.format === "short"))?.slug ??
    skills.find((skill) => skill.followed && skill.status === "available")?.slug ??
    skills[0]?.slug ??
    "";
  const [slug, setSlug] = useState(initial);
  const [format, setFormat] = useState<ClipFormat>("short");
  const [playingId, setPlayingId] = useState<string | null>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const skill = skills.find((item) => item.slug === slug);
  const visible = clips.filter((clip) => clip.skillSlug === slug && clip.format === format);
  const poster = SKILL_CHOICES.find((choice) => choice.slug === slug)?.image;

  function chooseSkill(nextSlug: string) {
    setSlug(nextSlug);
    setPlayingId(null);
    if (scrollerRef.current) scrollerRef.current.scrollTop = 0;
  }

  function chooseFormat(nextFormat: ClipFormat) {
    setFormat(nextFormat);
    setPlayingId(null);
    if (scrollerRef.current) scrollerRef.current.scrollTop = 0;
  }

  function step(direction: number) {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    scroller.scrollBy({ top: direction * scroller.clientHeight, behavior: reduce ? "auto" : "smooth" });
  }

  return (
    <div className="sf-watch">
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
      <p className="sf-watch-note">
        {skill ? `${skill.name} only.` : "One skill at a time."} No comments, likes, or counts.
      </p>
      {visible.length === 0 ? (
        <EmptyState
          icon="clapperboard"
          title={format === "short" ? "No short clips open yet" : "No videos open yet"}
          description="This feed stays on the skill you picked. Clips from a locked stage stay off it."
        />
      ) : (
        <div className="sf-watch-stage">
          <div
            className="sf-reel-scroller"
            ref={scrollerRef}
            tabIndex={0}
            aria-label={format === "short" ? "Short clip feed" : "Video feed"}
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
                    <iframe
                      src={playableSrc(clip.url)}
                      title={clip.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    />
                  ) : (
                    <>
                      {poster ? <Image className="sf-reel-photo" src={poster} alt="" fill sizes="380px" /> : null}
                      <button type="button" className="sf-reel-play" aria-label={`Play ${clip.title}`} onClick={() => setPlayingId(clip.id)}>
                        <span>
                          <Icon name="play" size={22} color="var(--text-on-accent)" />
                        </span>
                      </button>
                    </>
                  )}
                </div>
                <div className="sf-reel-caption">
                  <p>
                    {clip.skillName} · {clip.stageTitle}
                  </p>
                  <h2>{clip.title}</h2>
                  {clip.keyPoints ? <p>{clip.keyPoints}</p> : clip.description ? <p>{clip.description}</p> : null}
                  <Link href={clip.lessonHref}>Open lesson</Link>
                </div>
              </article>
            ))}
          </div>
          <div className="sf-watch-nav">
            <button type="button" aria-label="Previous clip" disabled={visible.length < 2} onClick={() => step(-1)}>
              <Icon name="chevron-up" size={16} />
            </button>
            <button type="button" aria-label="Next clip" disabled={visible.length < 2} onClick={() => step(1)}>
              <Icon name="chevron-down" size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
