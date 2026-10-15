"use client";

import Link from "next/link";
import { Button } from "@/components/core/Button.jsx";
import { Icon } from "@/components/core/Icon.jsx";
import { useFocusSession, type FocusPlan } from "@/components/detox/FocusSession";

/** Start a 25 or 50 minute session. While one runs, the buttons give way to its state. */
export function FocusStartButtons({ compact = false, continueHref }: { compact?: boolean; continueHref?: string | null }) {
  const focus = useFocusSession();
  if (!focus) return null;
  if (focus.session) {
    const counted = Math.floor(focus.session.focusedMs / 60000);
    return (
      <p className="sf-dtx-focus-live" role="status">
        <Icon name="timer" size={16} /> Focus session running · {counted} {counted === 1 ? "minute" : "minutes"} counted
        {continueHref && !compact ? (
          <Link href={continueHref} className="sf-hit">
            Back to your stage
          </Link>
        ) : null}
      </p>
    );
  }
  const start = (minutes: FocusPlan) => focus.start(minutes);
  return (
    <div className="sf-dtx-focus-start" role="group" aria-label="Start a focus session">
      <Button variant="outline" size={compact ? "lg" : "md"} onClick={() => start(25)}>
        <Icon name="timer" size={16} />
        Focus 25 min
      </Button>
      <Button variant="ghost" size={compact ? "lg" : "md"} onClick={() => start(50)}>
        50 min
      </Button>
    </div>
  );
}

export function FocusCard({ continueHref, todayMinutes }: { continueHref: string | null; todayMinutes: number }) {
  return (
    <section className="sf-dtx-card sf-dtx-focus" id="focus" aria-labelledby="dtx-focus-title">
      <header>
        <p className="sf-dtx-kicker">
          <Icon name="timer" size={14} /> Focus session
        </p>
        <h2 id="dtx-focus-title">⏱️ One block, one task</h2>
        <p>
          Start a timer, then open your stage. Minutes count only while a lesson, an explain-back, Notes, or a recall card is open in a
          visible tab. Every 25 focused minutes adds a little to your score, up to the daily limit.
        </p>
      </header>
      <FocusStartButtons continueHref={continueHref} />
      <p className="sf-dtx-quiet">
        {todayMinutes > 0 ? `${todayMinutes} focused ${todayMinutes === 1 ? "minute" : "minutes"} saved today.` : "No focus session saved today yet."}
        {continueHref ? (
          <>
            {" "}
            <Link href={continueHref}>Open your current stage</Link>
          </>
        ) : null}
      </p>
    </section>
  );
}
