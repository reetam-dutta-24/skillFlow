"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/core/Icon.jsx";
import { Button } from "@/components/core/Button.jsx";
import { WizardCard } from "@/components/forms/WizardCard";
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
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [skillId, setSkillId] = useState(work?.skillId ?? skills[0]?.id ?? "");
  const [format, setFormat] = useState(work?.format === "video" ? "video" : "short");
  const [title, setTitle] = useState(work?.title ?? "");
  const [description, setDescription] = useState(work?.description ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [rights, setRights] = useState(work?.status === "LIVE" || work?.status === "REJECTED");
  const [error, setError] = useState("");
  const [pending, setPending] = useState("");

  function go(next: number) {
    setDirection(next > step ? 1 : -1);
    setStep(next);
    setError("");
  }

  function continueStep() {
    if (step === 1 && title.trim().length < 3) {
      setError("Add a title.");
      return;
    }
    if (step === 2 && !work && !file) {
      setError("Choose a video file.");
      return;
    }
    if (step === 2 && file && file.size > 40 * 1024 * 1024) {
      setError("That file is too large. Use a video under 40 MB.");
      return;
    }
    go(step + 1);
  }

  async function save(intent: "draft" | "review") {
    if (!rights) {
      setError("Confirm that you own this video.");
      return;
    }
    if (!work && !file) {
      setError("Choose a video file.");
      return;
    }
    if (file && file.size > 40 * 1024 * 1024) {
      setError("That file is too large. Use a video under 40 MB.");
      return;
    }
    setPending(intent);
    setError("");
    const body = new FormData();
    if (work) body.set("workId", work.id);
    body.set("skillId", skillId);
    body.set("format", format);
    body.set("title", title);
    body.set("description", description);
    if (file) body.set("file", file);
    if (rights) body.set("rights", "on");
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
        <WizardCard
          step={step}
          total={4}
          title={["Which niche?", "What is the video?", "The file", "Send it"][step] ?? "Video"}
          direction={direction}
          onStep={go}
          onBack={() => go(step - 1)}
          onNext={step === 3 ? () => void save("review") : continueStep}
          nextLabel="Continue"
          pending={pending !== ""}
          error={error}
          actions={
            step === 3 ? (
              <>
                <Button type="button" variant="outline" disabled={pending !== ""} pending={pending === "draft"} pendingLabel="Saving…" onClick={() => void save("draft")}>
                  Save draft
                </Button>
                <Button type="button" variant="gradient" disabled={pending !== ""} pending={pending === "review"} pendingLabel="Sending…" onClick={() => void save("review")}>
                  Send for review
                </Button>
              </>
            ) : undefined
          }
        >
          {step === 0 ? (
            <>
              <label>
                Niche
                <select value={skillId} onChange={(event) => setSkillId(event.target.value)}>
                  {skills.map((skill) => (
                    <option key={skill.id} value={skill.id}>{skill.name}</option>
                  ))}
                </select>
              </label>
              <div className="sf-pick-grid">
                <button type="button" className={format === "short" ? "sf-pick is-on" : "sf-pick"} onClick={() => setFormat("short")}>
                  <span className="sf-pick-label">Short clip</span>
                </button>
                <button type="button" className={format === "video" ? "sf-pick is-on" : "sf-pick"} onClick={() => setFormat("video")}>
                  <span className="sf-pick-label">Video</span>
                </button>
              </div>
            </>
          ) : null}
          {step === 1 ? (
            <>
              <label>
                Title
                <input value={title} maxLength={140} onChange={(event) => setTitle(event.target.value)} />
              </label>
              <label>
                Description
                <textarea value={description} rows={4} maxLength={500} onChange={(event) => setDescription(event.target.value)} />
              </label>
            </>
          ) : null}
          {step === 2 ? (
            <>
              <label className={file ? "sf-dropzone has-file" : "sf-dropzone"}>
                <input
                  type="file"
                  className="sf-dropzone-input"
                  accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov"
                  aria-describedby="creator-file-hint"
                  onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                />
                <span className="sf-dropzone-icon" aria-hidden="true">
                  <Icon name={file ? "file-video" : "upload"} size={22} />
                </span>
                <span className="sf-dropzone-title">{file ? file.name : "Choose a video file"}</span>
                <span className="sf-dropzone-meta">
                  {file ? `${(file.size / (1024 * 1024)).toFixed(1)} MB · choose again to replace it` : "or drop it here"}
                </span>
              </label>
              <p className="sf-fill-hint" id="creator-file-hint">MP4, WebM, or MOV. Up to 40 MB. Replacing a live file sends it back for review.</p>
            </>
          ) : null}
          {step === 3 ? (
            <>
              <ul className="sf-fill-summary">
                <li>{skills.find((skill) => skill.id === skillId)?.name ?? "Niche"}</li>
                <li>{format === "short" ? "Short clip" : "Video"}</li>
                <li>{title.trim() || "Untitled"}</li>
              </ul>
              <label className="sf-creator-check">
                <input type="checkbox" checked={rights} onChange={(event) => setRights(event.target.checked)} />
                I own this video and I have the rights to publish it.
              </label>
            </>
          ) : null}
        </WizardCard>
      )}
      {work ? (
        <div className="sf-creator-actions">
          {work.status === "PENDING" || work.status === "LIVE" ? (
            <Button type="button" variant="outline" disabled={pending !== ""} onClick={() => void withdraw()}>
              {pending === "withdraw" ? "Withdrawing…" : work.status === "LIVE" ? "Remove from feed" : "Withdraw"}
            </Button>
          ) : null}
          <Button type="button" variant="outline" disabled={pending !== ""} onClick={() => void remove()}>
            {pending === "delete" ? "Deleting…" : "Delete"}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
