"use client";

import { useEffect } from "react";
import { Icon } from "@/components/core/Icon.jsx";
import { useDictation } from "./useDictation";

/**
 * "Speak instead" for an explanation box. Spoken phrases are added to the box as they are recognised, so the learner
 * can read, fix, and add to them before anything is checked. Hidden until the browser says whether it can listen.
 */
export function DictationButton({
  onPhrase,
  disabled = false,
  controls,
}: {
  onPhrase: (text: string) => void;
  disabled?: boolean;
  /** The id of the text box the words go into. */
  controls: string;
}) {
  const { support, listening, interim, error, start, stop } = useDictation(onPhrase);

  // A review starting, or the step closing, ends listening so nothing lands in the box afterwards.
  useEffect(() => {
    if (disabled && listening) stop();
  }, [disabled, listening, stop]);

  if (support === "unknown") return null;
  if (support === "no") {
    return <p className="sf-dictate-note">Speaking your answer works in Chrome, Edge, and Safari.</p>;
  }

  return (
    <div className="sf-dictate">
      <button
        type="button"
        className="sf-dictate-btn"
        data-listening={listening ? "true" : undefined}
        aria-pressed={listening}
        aria-controls={controls}
        disabled={disabled}
        onClick={() => (listening ? stop() : start())}
      >
        <span className="sf-dictate-dot" aria-hidden="true">
          <Icon name={listening ? "square" : "mic"} size={14} />
        </span>
        {listening ? "Stop listening" : "Speak instead"}
      </button>
      <p className="sf-dictate-live" aria-live="polite">
        {listening ? (interim ? `“${interim}”` : "Listening… say it the way you would explain it to a friend.") : ""}
      </p>
      {error ? (
        <p className="sf-dictate-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
