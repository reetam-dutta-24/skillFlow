import Link from "next/link";
import { Icon } from "@/components/core/Icon.jsx";
import { SwapButton } from "@/app/(app)/detox/_components/SwapDialog";
import { DetoxSupport } from "@/app/(app)/detox/_components/DetoxSupport";
import { loadDetoxCard } from "@/lib/data/detox";
import { playbookStep } from "@/lib/detox/playbook";
import { DETOX_QUESTION_COUNT } from "@/lib/detox/questions";
import { detoxCardState } from "@/lib/detox/state";
import { HomeDetoxDial } from "./HomeDetoxDial";
import { HomeTileArt } from "./HomeTileArt";

const DETOX_ART = "/skills/mindfulness.jpg";

/** Home's Dopamine Detox tile. Personal and sensitive, so it is read on the request with the rest of Home. */
export async function DetoxCard({ userId }: { userId: string }) {
  const card = await loadDetoxCard(userId);
  const ready = card.ready;
  const view = detoxCardState({ status: card.state.status, distress: ready?.distress ?? false });

  if (view === "support") {
    return (
      <div className="sf-home-tile-wide">
        <DetoxSupport compact />
      </div>
    );
  }

  if (view === "invite" || view === "resume") {
    const answered = card.state.status === "in-progress" ? card.state.answered : 0;
    return (
      <section className="sf-home-tile is-detox" aria-labelledby="home-detox-title">
        <HomeTileArt src={DETOX_ART} icon="leaf" />
        <p className="sf-home-tile-kicker">Dopamine Detox · about 3 min</p>
        <h2 id="home-detox-title">{view === "resume" ? "Pick up your self-check" : "Your dopamine detox, with proof"}</h2>
        <p className="sf-home-tile-text">
          {view === "resume"
            ? `${answered} of ${DETOX_QUESTION_COUNT} answered. Finish it to see your starting Detox Score.`
            : "A short self-check gives you a Detox Score. After that, only real learning moves it."}
        </p>
        <div className="sf-home-tile-actions">
          <Link className="sf-btn sf-btn--outline sf-btn--md" href="/detox/check">
            {view === "resume" ? "Continue" : "Take the self-check"}
          </Link>
        </div>
      </section>
    );
  }

  const score = ready!;
  const step = score.step ? playbookStep(score.step) : null;
  return (
    <section className="sf-home-tile is-detox has-dial" aria-labelledby="home-detox-title" data-band={score.band.id}>
      <HomeTileArt src={DETOX_ART} icon="leaf" />
      <div className="sf-home-detox-row">
        <HomeDetoxDial score={score.score} from={score.score - score.change} />
        <div className="sf-home-detox-body">
          <p className="sf-home-tile-kicker">Dopamine Detox</p>
          <h2 id="home-detox-title">
            {score.band.label}
            <span className="sf-home-detox-change" data-direction={score.change > 0 ? "up" : score.change < 0 ? "down" : "flat"}>
              {score.change > 0 ? `+${score.change}` : score.change === 0 ? "±0" : `−${Math.abs(score.change)}`} this week
            </span>
          </h2>
        </div>
      </div>
      {step ? (
        <p className="sf-home-detox-step">
          <Icon name="footprints" size={14} /> Next: {step.title}
        </p>
      ) : (
        <p className="sf-home-tile-text">{score.summary}</p>
      )}
      {score.checkInDue ? (
        <p className="sf-home-detox-due">
          <Icon name="calendar-check" size={14} /> <Link href="/detox#checkin">Your weekly check-in is ready</Link>
        </p>
      ) : null}
      <div className="sf-home-tile-actions">
        <SwapButton variant="outline" size="md" />
        <Link className="sf-btn sf-btn--ghost sf-btn--md" href="/detox">
          Open Detox
        </Link>
      </div>
    </section>
  );
}
