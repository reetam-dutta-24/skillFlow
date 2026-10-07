"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { CtaLink } from "./CtaLink.jsx";

/** Order starts with the clip named for the hero, then the rest, then repeats. */
const CLIPS = [
  "/landing/5240935-uhd_3840_2160_30fps.mp4",
  "/landing/8037249-uhd_3840_2160_25fps.mp4",
  "/landing/8089525-uhd_4096_2160_25fps.mp4",
  "/landing/12315445-uhd_3840_2160_25fps.mp4",
  "/landing/4451457-hd_1920_1080_24fps.mp4",
];

const FADE_MS = 900;

/**
 * Two players. Only the clip on screen and the next one are loaded.
 * The next one fades in over the current one, then the hidden player
 * picks up the clip after that.
 */
export function LandingHero({ content }) {
  // Off until the browser says otherwise: the server HTML carries only the poster,
  // so a phone never starts a 4K download before hydration.
  const [motion, setMotion] = useState(false);
  const [active, setActive] = useState(0);
  const [shown, setShown] = useState([CLIPS[0], CLIPS[1]]);
  const sources = useRef([CLIPS[0], CLIPS[1]]);
  const lock = useRef(false);
  const warmed = useRef(false);
  const first = useRef(null);
  const second = useRef(null);

  useEffect(() => {
    // Video only on wide screens, without reduced motion, and when the visitor has not asked to save data.
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const wide = window.matchMedia("(min-width: 960px)");
    const saveData = Boolean(navigator.connection?.saveData);
    const apply = () => setMotion(!reduce.matches && wide.matches && !saveData);
    apply();
    reduce.addEventListener("change", apply);
    wide.addEventListener("change", apply);
    return () => {
      reduce.removeEventListener("change", apply);
      wide.removeEventListener("change", apply);
    };
  }, []);

  function refs() {
    return [first.current, second.current];
  }

  function handoff(from) {
    if (lock.current) return;
    const to = from === 0 ? 1 : 0;
    const nextEl = refs()[to];
    if (!nextEl) return;
    lock.current = true;
    const currentSrc = sources.current[from];
    const currentIndex = Math.max(0, CLIPS.indexOf(currentSrc));
    const queued = CLIPS[(currentIndex + 2) % CLIPS.length];
    const reveal = () => {
      setActive(to);
      window.setTimeout(() => {
        sources.current[from] = queued;
        setShown(sources.current.slice());
        const hidden = refs()[from];
        if (hidden) {
          hidden.pause();
        }
        lock.current = false;
        warmed.current = false;
      }, FADE_MS);
    };
    const play = nextEl.play();
    if (play && typeof play.then === "function") {
      play.then(reveal).catch(reveal);
    } else {
      reveal();
    }
  }

  function onTime(event, slot) {
    if (slot !== active || lock.current) return;
    const video = event.currentTarget;
    if (!Number.isFinite(video.duration) || video.duration < 1) return;
    const remaining = video.duration - video.currentTime;
    if (remaining < 12 && !warmed.current) {
      warmed.current = true;
      const next = refs()[slot === 0 ? 1 : 0];
      if (next) {
        next.preload = "auto";
        next.load();
      }
    }
    if (remaining <= 0.95) handoff(slot);
  }

  // One handler each, reading the slot from the element, so render never touches the refs.
  function onTimeUpdate(event) {
    onTime(event, Number(event.currentTarget.dataset.slot));
  }

  function onEnded(event) {
    handoff(Number(event.currentTarget.dataset.slot));
  }

  const players = motion
    ? [0, 1].map((slot) => (
        <video
          key={shown[slot]}
          ref={slot === 0 ? first : second}
          className={slot === active ? "sf-hero-video is-on" : "sf-hero-video"}
          autoPlay={slot === active}
          muted
          playsInline
          preload={slot === active ? "auto" : "none"}
          data-slot={slot}
          onTimeUpdate={onTimeUpdate}
          onEnded={onEnded}
        >
          <source src={shown[slot]} type="video/mp4" />
        </video>
      ))
    : null;

  return (
    <section id="home" className="sf-hero" aria-labelledby="landing-hero-title">
      <div className="sf-hero-media" aria-hidden="true">
        <Image className="sf-hero-poster" src="/landing/posters/hero.jpg" alt="" fill preload sizes="100vw" />
        {players}
      </div>
      <div className="sf-hero-vignette" aria-hidden="true" />
      <div className="sf-hero-copy">
        <h1 id="landing-hero-title" className="sf-display">
          {content.headline}
        </h1>
        <p className="sf-lead">{content.lead}</p>
        <div className="sf-cta-row">
          <CtaLink href={content.startCta.href}>{content.startCta.label}</CtaLink>
          <CtaLink href={content.heroSecondary.href} variant="outline">
            {content.heroSecondary.label}
          </CtaLink>
        </div>
      </div>
    </section>
  );
}
