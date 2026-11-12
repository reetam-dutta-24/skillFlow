import { RETENTION_PENALTY_PER_FLAG, type IntegrityView } from "@/lib/explain/authenticity";

/** Why an answer was flagged, and what it costs. Plain words, no accusation; a flag never holds the learner back. */
export function IntegrityNotice({ integrity }: { integrity: IntegrityView }) {
  return (
    <div className="sf-explain-integrity" role="status">
      <p className="sf-explain-kicker">Reads as AI-written or pasted</p>
      {integrity.reasons.length ? (
        <ul>
          {integrity.reasons.map((reason) => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>
      ) : null}
      <p>
        {`Your answer was still reviewed and counts as usual, but it lowers your Retention score by ${RETENTION_PENALTY_PER_FLAG} points. Writing it plainly, the way you would tell a friend, or pressing Speak instead keeps your score.`}
      </p>
    </div>
  );
}
