"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { followSkill, unfollowSkill } from "@/app/(app)/settings/actions";
import { useSetFollowed } from "./followed-context";

export function FollowNicheButton({
  skillId,
  followed,
  name,
}: {
  skillId: string;
  followed: boolean;
  name: string;
}) {
  const router = useRouter();
  const setFollowed = useSetFollowed();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function toggle() {
    if (pending) return;
    setPending(true);
    setError("");
    const result = followed ? await unfollowSkill(skillId) : await followSkill(skillId);
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setFollowed(skillId, !followed);
    router.refresh();
  }

  return (
    <>
      <button
        type="button"
        className={followed ? "sf-follow-btn is-on" : "sf-follow-btn"}
        aria-pressed={followed}
        aria-label={followed ? `Stop following ${name}` : `Follow ${name}`}
        disabled={pending}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          void toggle();
        }}
      >
        {pending ? "Saving…" : followed ? "Following" : "Follow"}
      </button>
      {error ? (
        <span className="sf-sr" role="alert">
          {error}
        </span>
      ) : null}
    </>
  );
}
