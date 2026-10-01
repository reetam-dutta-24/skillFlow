"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/core/Button.jsx";
import { moderateGapAction } from "../actions";

/** Maintainer controls on one gap. Resolved gaps change only through their contribution. */
export function GapActions({ gapId, status, goodFirst }: { gapId: string; status: string; goodFirst: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function run(op: "goodFirst" | "notGoodFirst" | "close" | "reopen") {
    startTransition(async () => {
      const result = await moderateGapAction({ gapId, op });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setError("");
      router.refresh();
    });
  }

  if (status === "RESOLVED") return null;
  return (
    <span className="sf-community-actions">
      {status === "OPEN" ? (
        <>
          <Button type="button" size="sm" variant="quiet" disabled={pending} onClick={() => run(goodFirst ? "notGoodFirst" : "goodFirst")}>
            {goodFirst ? "Remove good first label" : "Mark good first contribution"}
          </Button>
          <Button type="button" size="sm" variant="outline" disabled={pending} onClick={() => run("close")}>
            Close gap
          </Button>
        </>
      ) : (
        <Button type="button" size="sm" variant="outline" disabled={pending} onClick={() => run("reopen")}>
          Reopen gap
        </Button>
      )}
      {error ? (
        <span className="sf-auth-error" role="alert">
          {error}
        </span>
      ) : null}
    </span>
  );
}
