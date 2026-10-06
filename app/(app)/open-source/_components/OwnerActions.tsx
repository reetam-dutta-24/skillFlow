"use client";

import { useActionState, useCallback, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/core/Button.jsx";
import { withdrawContributionAction, type FormState } from "../actions";
import { ConfirmDialog } from "./ConfirmDialog";

/** What the author can do, by status. Closed has no actions. */
export function OwnerActions({ contributionId, status }: { contributionId: string; status: string }) {
  const [dialog, setDialog] = useState<"withdraw" | "resubmit" | null>(null);
  const [state, withdraw, pending] = useActionState(withdrawContributionAction, null as FormState);
  const close = useCallback(() => setDialog(null), []);
  const editHref = `/open-source/me/${contributionId}/edit`;

  if (status === "CLOSED") return <p className="sf-os-hint">This post was not published.</p>;

  return (
    <div className="sf-community-actions">
      {status === "MERGED" ? (
        <Button type="button" variant="outline" size="sm" onClick={() => setDialog("resubmit")}>
          Edit
        </Button>
      ) : (
        <>
          <Link className="sf-os-primary" href={editHref}>
            Edit
          </Link>
          <Button type="button" variant="outline" size="sm" onClick={() => setDialog("withdraw")}>
            Withdraw
          </Button>
        </>
      )}

      <ConfirmDialog open={dialog === "resubmit"} title="Edit this published post?" onClose={close}>
        <p>It leaves the public list until a moderator publishes it again.</p>
        <div className="sf-review-actions">
          <Link className="sf-os-primary" href={editHref}>
            Continue to edit
          </Link>
          <Button type="button" variant="quiet" size="sm" onClick={close}>
            Keep it public
          </Button>
        </div>
      </ConfirmDialog>

      <ConfirmDialog open={dialog === "withdraw"} title="Withdraw this contribution?" onClose={close}>
        <p>It leaves the review queue. You cannot reopen it later.</p>
        <form action={withdraw}>
          <input type="hidden" name="contributionId" value={contributionId} />
          {state ? (
            <p className="sf-auth-error" role="alert">
              {state.error}
            </p>
          ) : null}
          <div className="sf-review-actions">
            <Button type="submit" variant="outline" size="sm" disabled={pending}>
              {pending ? "Withdrawing…" : "Withdraw"}
            </Button>
            <Button type="button" variant="quiet" size="sm" disabled={pending} onClick={close}>
              Keep it open
            </Button>
          </div>
        </form>
      </ConfirmDialog>
    </div>
  );
}
