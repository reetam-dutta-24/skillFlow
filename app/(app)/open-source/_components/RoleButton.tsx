"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/core/Button.jsx";
import { changeRoleAction } from "../actions";

/** Grant or revoke one role. Revoke asks once more. The action and the service check permission. */
export function RoleButton({
  op,
  userId,
  skillId,
  role,
  label,
}: {
  op: "grant" | "revoke";
  userId: string;
  skillId: string;
  role: "REVIEWER" | "MAINTAINER";
  label: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState("");

  function run() {
    if (op === "revoke" && !confirming) {
      setConfirming(true);
      return;
    }
    startTransition(async () => {
      const result = await changeRoleAction({ op, userId, skillId, role });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setError("");
      setConfirming(false);
      router.refresh();
    });
  }

  return (
    <span className="sf-os-role-action">
      <Button type="button" size="sm" variant={op === "grant" ? "gradient" : "outline"} disabled={pending} onClick={run}>
        {pending ? "Saving…" : confirming ? `Confirm: ${label.toLowerCase()}` : label}
      </Button>
      {confirming && !pending ? (
        <Button type="button" size="sm" variant="quiet" onClick={() => setConfirming(false)}>
          Cancel
        </Button>
      ) : null}
      {error ? (
        <span className="sf-auth-error" role="alert">
          {error}
        </span>
      ) : null}
    </span>
  );
}
