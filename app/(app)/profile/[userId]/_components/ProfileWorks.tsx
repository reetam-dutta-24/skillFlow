"use client";

import { useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/core/Icon.jsx";
import type { PublicCreatorWork } from "@/lib/data/creator";
import { LocalClip } from "../../../creator/_components/LocalClip";

export function ProfileWorks({ works }: { works: PublicCreatorWork[] }) {
  const [playingId, setPlayingId] = useState<string | null>(null);

  return (
    <ul className="sf-creator-grid">
      {works.map((work) => (
        <li key={work.id}>
          <article className="sf-creator-card">
            <div className="sf-creator-stage">
              {playingId === work.id ? (
                <LocalClip src={work.mediaUrl} title={work.title} workId={work.id} track />
              ) : (
                <button type="button" className="sf-reel-play" aria-label={`Play ${work.title}`} onClick={() => setPlayingId(work.id)}>
                  <span>
                    <Icon name="play" size={22} color="var(--text-on-accent)" />
                  </span>
                </button>
              )}
            </div>
            <h3>{work.title}</h3>
            <p>
              {work.skillName} · {work.format === "short" ? "Short clip" : "Video"}
            </p>
            {work.description ? <p>{work.description}</p> : null}
            <Link href={`/clips?skill=${work.skillSlug}`}>Watch in {work.skillName}</Link>
          </article>
        </li>
      ))}
    </ul>
  );
}
