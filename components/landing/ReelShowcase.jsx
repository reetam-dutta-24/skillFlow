"use client";

import { useState } from "react";
import { SkillImage } from "@/components/core/SkillImage";
import { playableSrc } from "@/lib/playable-src";
import { Icon } from "../core/Icon.jsx";
import { CtaLink } from "./CtaLink.jsx";

const POINTS = [
  { icon: "layers", title: "Segmented by niche", body: "Pick a niche and scroll only that. No mixed feed, no algorithm pulling you somewhere else." },
  { icon: "shield-check", title: "Moderated, not viral", body: "Catalog clips are chosen stage by stage. A creator's upload goes live only after a review." },
  { icon: "route", title: "Every clip leads somewhere", body: "Each clip belongs to one stage and opens its lesson, then the explain-back that proves it stuck." },
  { icon: "eye-off", title: "No likes, no view counts", body: "Nothing to farm and nothing to compare. The only score is whether you understood it." },
];

/**
 * Landing showcase for Clips: niche tabs over a phone-sized reel. Real catalog clips, poster first; the YouTube
 * player (privacy-enhanced) loads only when a visitor presses play.
 *
 * @param {{ niches: { slug: string, name: string, reels: { id: string, title: string, stage: string, url: string, poster: string | null, creator: boolean }[] }[], cta: { href: string, label: string } }} props
 */
export function ReelShowcase({ niches, cta }) {
  const [active, setActive] = useState(0);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  if (niches.length === 0) return null;
  const niche = niches[active];
  const reel = niche.reels[index] ?? niche.reels[0];

  function pick(next) {
    setActive(next);
    setIndex(0);
    setPlaying(false);
  }
  function step(delta) {
    setIndex((current) => (current + delta + niche.reels.length) % niche.reels.length);
    setPlaying(false);
  }

  return (
    <section id="clips" className="sf-section sf-reels" aria-labelledby="landing-reels-title">
      <div className="sf-reels-copy">
        <p className="sf-reels-kicker">Clips</p>
        <h2 id="landing-reels-title">Short clips, sorted by niche and checked by people</h2>
        <p className="sf-reels-lead">
          The quick, swipeable format you already know, rebuilt for learning: each niche has its own moderated reel, and every clip
          points to the stage it teaches.
        </p>
        <ul className="sf-reels-points">
          {POINTS.map((point) => (
            <li key={point.title}>
              <span className="sf-reels-icon" aria-hidden="true">
                <Icon name={point.icon} size={18} />
              </span>
              <span>
                <strong>{point.title}</strong>
                {point.body}
              </span>
            </li>
          ))}
        </ul>
        <CtaLink href={cta.href}>{cta.label}</CtaLink>
      </div>

      <div className="sf-reels-demo">
        <div className="sf-reels-tabs" role="tablist" aria-label="Niches">
          {niches.map((item, position) => (
            <button
              key={item.slug}
              type="button"
              role="tab"
              id={`reel-tab-${item.slug}`}
              aria-selected={position === active}
              aria-controls="reel-panel"
              className={position === active ? "is-on" : undefined}
              onClick={() => pick(position)}
            >
              {item.name}
            </button>
          ))}
        </div>
        <div className="sf-reels-stage">
          <div className="sf-reels-phone" id="reel-panel" role="tabpanel" aria-labelledby={`reel-tab-${niche.slug}`}>
            {playing ? (
              <iframe
                className="sf-reels-frame"
                src={playableSrc(reel.url)}
                title={reel.title}
                allow="autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <>
                {reel.poster ? <SkillImage className="sf-reels-poster" src={reel.poster} alt="" fill sizes="320px" /> : null}
                <span className="sf-reels-shade" aria-hidden="true" />
                <span className="sf-reels-badge">
                  <Icon name="shield-check" size={13} /> {reel.creator ? "Reviewed creator clip" : "Picked for this stage"}
                </span>
                <button type="button" className="sf-reels-play" aria-label={`Play ${reel.title}`} onClick={() => setPlaying(true)}>
                  <Icon name="play" size={26} />
                </button>
                <div className="sf-reels-caption">
                  <p>
                    {niche.name} · {reel.stage}
                  </p>
                  <h3>{reel.title}</h3>
                  <span>Opens its lesson and explain-back</span>
                </div>
              </>
            )}
          </div>
          <div className="sf-reels-nav">
            <button type="button" aria-label="Previous clip" onClick={() => step(-1)}>
              <Icon name="chevron-up" size={18} />
            </button>
            <span aria-live="polite">
              {index + 1}/{niche.reels.length}
            </span>
            <button type="button" aria-label="Next clip" onClick={() => step(1)}>
              <Icon name="chevron-down" size={18} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
