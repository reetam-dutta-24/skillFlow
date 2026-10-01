"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/core/Button.jsx";
import type { CreatorSkillOption, StudioWork } from "@/lib/data/creator";
import { deleteCreatorWork, saveCreatorWork, withdrawCreatorWork } from "../actions";

export function StudioEditor({
  skills,
  work,
}: {
  skills: CreatorSkillOption[];
  work: StudioWork | null;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState("");

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const submitter = (event.nativeEvent as SubmitEvent).submitter;
    const intent = submitter instanceof HTMLButtonElement && submitter.value === "draft" ? "draft" : "review";
    setPending(intent);
    setError("");
    const body = new FormData(event.currentTarget);
    const file = body.get("file");
    if (file instanceof File && file.size > 40 * 1024 * 1024) {
      setPending("");
      setError("That file is too large. Use a video under 40 MB.");
      return;
    }
    body.set("intent", intent);
    try {
      const result = await saveCreatorWork(body);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push(`/creator/${result.id}`);
      router.refresh();
    } catch {
      setError("The video could not be sent. Try again.");
    } finally {
      setPending("");
    }
  }

  async function withdraw() {
    if (!work) return;
    setPending("withdraw");
    setError("");
    const body = new FormData();
    body.set("workId", work.id);
    const result = await withdrawCreatorWork(body);
    setPending("");
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  async function remove() {
    if (!work) return;
    if (!window.confirm("Delete this video from your library?")) return;
    setPending("delete");
    setError("");
    const body = new FormData();
    body.set("workId", work.id);
    const result = await deleteCreatorWork(body);
    setPending("");
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.push("/creator");
    router.refresh();
  }

  const locked = work?.status === "PENDING";

  return (
    <div className="sf-creator-editor">
      {work?.status === "REJECTED" && work.reviewNotes ? (
        <p className="sf-creator-note" role="status">
          Review note: {work.reviewNotes}
        </p>
      ) : null}
      {locked ? (
        <p className="sf-creator-note" role="status">
          This video is in review. Withdraw it if you want to change the file or the title.
        </p>
      ) : (
        <form className="sf-creator-form" onSubmit={(event) => void save(event)}>
          {work ? <input type="hidden" name="workId" value={work.id} /> : null}
          <label>
            Niche
            <select name="skillId" defaultValue={work?.skillId ?? skills[0]?.id ?? ""} required>
              {skills.map((skill) => (
                <option key={skill.id} value={skill.id}>
                  {skill.name}
                </option>
              ))}
            </select>
          </label>
          <fieldset>
            <legend>Format</legend>
            <label>
              <input type="radio" name="format" value="short" defaultChecked={!work || work.format === "short"} />
              Short clip
            </label>
            <label>
              <input type="radio" name="format" value="video" defaultChecked={work?.format === "video"} />
              Video
            </label>
          </fieldset>
          <label>
            Title
            <input name="title" required maxLength={140} defaultValue={work?.title ?? ""} />
          </label>
          <label>
            Description
            <textarea name="description" rows={4} maxLength={500} defaultValue={work?.description ?? ""} />
          </label>
          <label>
            Video file
            <input name="file" type="file" accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov" required={!work} />
          </label>
          <p className="sf-creator-hint">MP4, WebM, or MOV. Up to 40 MB. Replacing a live file sends it back for review.</p>
          <label className="sf-creator-check">
            <input type="checkbox" name="rights" defaultChecked={work?.status === "LIVE" || work?.status === "REJECTED"} required />
            I own this video and I have the rights to publish it.
          </label>
          <div className="sf-creator-actions">
            <Button type="submit" value="draft" variant="outline" disabled={pending !== ""}>
              {pending === "draft" ? "Saving..." : "Save draft"}
            </Button>
            <Button type="submit" value="review" variant="gradient" disabled={pending !== ""}>
              {pending === "review" ? "Sending..." : "Send for review"}
            </Button>
          </div>
        </form>
      )}
      {error ? <p role="alert">{error}</p> : null}
      {work ? (
        <div className="sf-creator-actions">
          {work.status === "PENDING" || work.status === "LIVE" ? (
            <Button type="button" variant="outline" disabled={pending !== ""} onClick={() => void withdraw()}>
              {pending === "withdraw" ? "Withdrawing..." : work.status === "LIVE" ? "Remove from feed" : "Withdraw"}
            </Button>
          ) : null}
          <Button type="button" variant="outline" disabled={pending !== ""} onClick={() => void remove()}>
            {pending === "delete" ? "Deleting..." : "Delete"}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
