import { WARNING_STRIKES, type IntegrityView } from "@/lib/explain/authenticity";

/** Why an answer was flagged, and what that means for the next one. Plain words, no accusation. */
export function IntegrityNotice({ integrity }: { integrity: IntegrityView }) {
  const blocked = integrity.status === "blocked";
  return (
    <div className={blocked ? "sf-explain-integrity is-blocked" : "sf-explain-integrity"} role="status">
      <p className="sf-explain-kicker">
        {blocked ? "Not accepted: this one needs your own words" : `Own-words warning ${integrity.strikes} of ${WARNING_STRIKES}`}
      </p>
      {integrity.reasons.length ? (
        <ul>
          {integrity.reasons.map((reason) => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>
      ) : null}
      <p>
        {blocked
          ? "After two warnings, answers that read like this stop counting on this stage. Write it plainly, the way you would tell a friend, or press Speak instead and say it out loud."
          : integrity.warningsLeft > 0
            ? `Your answer was still reviewed. ${integrity.warningsLeft === 1 ? "One more warning" : `${integrity.warningsLeft} more warnings`} on this stage, and then answers like this will not be accepted.`
            : "Your answer was still reviewed, but that was the last warning on this stage. From now on, answers like this will not be accepted."}
      </p>
    </div>
  );
}
