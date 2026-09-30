"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/core/Button.jsx";
import { toggleUsefulAction } from "../actions";

export function UsefulButton({
  contributionId,
  initialCount,
  marked,
}: {
  contributionId: string;
  initialCount: number;
  marked: boolean;
}) {
  const [count, setCount] = useState(initialCount);
  const [on, setOn] = useState(marked);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="sf-community-useful">
      <p>Found useful by {count} {count === 1 ? "learner" : "learners"}</p>
      <Button
        type="button"
        size="sm"
        variant={on ? "outline" : "gradient"}
        disabled={pending}
        onClick={() => {
          startTransition(async () => {
            const result = await toggleUsefulAction(contributionId);
            if (!result.ok) {
              setError(result.error);
              return;
            }
            setError(null);
            setCount(result.usefulCount);
            setOn(result.useful);
          });
        }}
      >
        {on ? "Remove useful mark" : "Found this useful"}
      </Button>
      {error ? <p role="alert">{error}</p> : null}
    </div>
  );
}
