"use client";

import { startTransition, useActionState, useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/core/Button.jsx";
import { WizardCard } from "@/components/forms/WizardCard";
import { createContributionAction, updateContributionAction, type FormState } from "../actions";

type Stage = { id: string; order: number; title: string };
type NicheOption = { slug: string; name: string };
type PathStep = { title: string; url: string; note: string };

/** Values of the contribution being edited. Absent for a new contribution. */
export type ContributionDraft = {
  id: string;
  type: string;
  title: string;
  description: string;
  imageUrl: string | null;
  sources: string[];
  tags: string[];
  stageId: string | null;
  disclosure: string;
  steps: PathStep[];
  /** Merged now. Saving sends it back for review. */
  resubmit: boolean;
};

const EMPTY_STEPS: PathStep[] = [
  { title: "", url: "", note: "" },
  { title: "", url: "", note: "" },
];

const TYPES = [
  ["RESOURCE", "Resource"],
  ["CONCEPT_NOTE", "Concept note"],
  ["LEARNING_PATH", "Learning path"],
  ["FOLLOW", "Follow"],
] as const;

export function ContributeForm({
  skillId,
  slug,
  communityName,
  niches,
  stages,
  draft,
}: {
  skillId: string;
  slug: string;
  communityName: string;
  niches: NicheOption[];
  stages: Stage[];
  draft?: ContributionDraft;
}) {
  const router = useRouter();
  const editing = Boolean(draft);
  const [state, action, pending] = useActionState(editing ? updateContributionAction : createContributionAction, null as FormState);
  const uploadedImage = draft?.imageUrl?.startsWith("/uploads/") ? draft.imageUrl : null;
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [type, setType] = useState(draft?.type ?? "RESOURCE");
  const [title, setTitle] = useState(draft?.title ?? "");
  const [description, setDescription] = useState(draft?.description ?? "");
  const [imageUrl, setImageUrl] = useState(draft?.imageUrl && !uploadedImage ? draft.imageUrl : "");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [sources, setSources] = useState(draft?.sources.join("\n") ?? "");
  const [stageId, setStageId] = useState(draft?.stageId ?? "");
  const [tags, setTags] = useState(draft?.tags.join(", ") ?? "");
  const [disclosure, setDisclosure] = useState(draft?.disclosure ?? "NONE");
  const [pathSteps, setPathSteps] = useState<PathStep[]>(draft && draft.steps.length >= 2 ? draft.steps : EMPTY_STEPS);
  const [fieldError, setFieldError] = useState("");

  const stepIds = ["where", "writing", "image", "links", ...(type === "LEARNING_PATH" ? ["path"] : []), "send"];
  const current = stepIds[Math.min(step, stepIds.length - 1)] ?? "where";

  useEffect(() => {
    if (!state?.field) return;
    const target =
      state.field === "title" || state.field === "description"
        ? "writing"
        : state.field === "imageUrl"
          ? "image"
          : state.field === "sources" || state.field === "stageId" || state.field === "tags" || state.field === "disclosure"
            ? "links"
            : "";
    const index = stepIds.indexOf(target);
    if (index >= 0) {
      setDirection(-1);
      setStep(index);
    }
  }, [state]);

  function updatePath(index: number, key: keyof PathStep, value: string) {
    setPathSteps((rows) => rows.map((row, rowIndex) => (rowIndex === index ? { ...row, [key]: value } : row)));
  }

  function go(next: number) {
    setDirection(next > step ? 1 : -1);
    setStep(Math.max(0, Math.min(next, stepIds.length - 1)));
    setFieldError("");
  }

  function continueStep() {
    if (current === "writing" && title.trim().length < 3) {
      setFieldError("Add a title.");
      return;
    }
    if (current === "writing" && description.trim().length < 10) {
      setFieldError("Add a description of what a learner should take from this.");
      return;
    }
    if (current === "links" && (type === "RESOURCE" || type === "FOLLOW") && !sources.trim()) {
      setFieldError("Add at least one link, one per line.");
      return;
    }
    if (current === "path" && pathSteps.filter((row) => row.title.trim()).length < 2) {
      setFieldError("A learning path needs at least two named steps.");
      return;
    }
    go(step + 1);
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    if (imageFile) formData.set("imageFile", imageFile);
    startTransition(() => action(formData));
  }

  const titles: Record<string, string> = {
    where: "Where does this belong?",
    writing: "What should someone learn?",
    image: "Add a picture",
    links: "Links and tags",
    path: "The steps",
    send: "Send it for review",
  };
  const shownError = fieldError || state?.error || "";

  return (
    <form className="sf-os-form" onSubmit={onSubmit}>
      <input type="hidden" name="skillId" value={skillId} />
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="type" value={type} />
      <input type="hidden" name="title" value={title} />
      <input type="hidden" name="description" value={description} />
      <input type="hidden" name="imageUrl" value={imageUrl} />
      <input type="hidden" name="sources" value={sources} />
      <input type="hidden" name="stageId" value={stageId} />
      <input type="hidden" name="tags" value={tags} />
      <input type="hidden" name="disclosure" value={disclosure} />
      {draft ? <input type="hidden" name="contributionId" value={draft.id} /> : null}
      {uploadedImage ? <input type="hidden" name="currentImageUrl" value={uploadedImage} /> : null}
      {removeImage ? <input type="hidden" name="removeImage" value="on" /> : null}
      {type === "LEARNING_PATH"
        ? pathSteps.map((row, index) => (
            <span key={index}>
              <input type="hidden" name="stepTitle" value={row.title} />
              <input type="hidden" name="stepUrl" value={row.url} />
              <input type="hidden" name="stepNote" value={row.note} />
            </span>
          ))
        : null}
      <WizardCard
        step={Math.min(step, stepIds.length - 1)}
        total={stepIds.length}
        title={titles[current] ?? "Contribution"}
        direction={direction}
        onStep={go}
        onBack={() => go(step - 1)}
        onNext={current === "send" ? () => {} : continueStep}
        nextLabel="Continue"
        pending={pending}
        error={shownError}
        actions={
          current === "send" ? (
            <Button type="submit" variant="gradient" disabled={pending}>
              {pending ? "Saving…" : draft?.resubmit ? "Resubmit for review" : editing ? "Save changes" : "Submit contribution"}
            </Button>
          ) : undefined
        }
      >
        {draft?.resubmit && current === "where" ? (
          <p className="sf-os-warning" role="note">This will hide it from the niche until it is reviewed again.</p>
        ) : null}
        {current === "where" ? (
          <>
            {editing ? (
              <p className="sf-fill-hint">Community: {communityName}. A contribution stays in the community it was shared in.</p>
            ) : (
              <label>
                Community
                <select value={slug} onChange={(event) => router.push(`/open-source/${event.target.value}/contribute`)}>
                  {niches.map((niche) => (
                    <option key={niche.slug} value={niche.slug}>{niche.name}</option>
                  ))}
                </select>
              </label>
            )}
            <div className="sf-pick-grid">
              {TYPES.map(([id, label]) => (
                <button key={id} type="button" className={type === id ? "sf-pick is-on" : "sf-pick"} onClick={() => setType(id)}>
                  <span className="sf-pick-label">{label}</span>
                </button>
              ))}
            </div>
          </>
        ) : null}
        {current === "writing" ? (
          <>
            <label>
              Title
              <input value={title} maxLength={120} onChange={(event) => setTitle(event.target.value)} placeholder="What should someone learn from this?" />
            </label>
            <label>
              Description
              <textarea value={description} rows={8} maxLength={5000} onChange={(event) => setDescription(event.target.value)} placeholder="The main thing a learner should take from this." />
            </label>
          </>
        ) : null}
        {current === "image" ? (
          <>
            <label>
              Upload
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={(event) => setImageFile(event.target.files?.[0] ?? null)}
              />
            </label>
            <label>
              Or an https link
              <input value={imageUrl} type="url" onChange={(event) => setImageUrl(event.target.value)} placeholder="https://" />
            </label>
            {uploadedImage ? (
              <label className="sf-os-check">
                <input type="checkbox" checked={removeImage} onChange={(event) => setRemoveImage(event.target.checked)} />
                Remove the uploaded image
              </label>
            ) : null}
            <p className="sf-fill-hint">Optional. An uploaded image is used if you choose both.{imageFile ? ` Chosen: ${imageFile.name}` : ""}</p>
          </>
        ) : null}
        {current === "links" ? (
          <>
            <label>
              Sources
              <textarea value={sources} rows={4} onChange={(event) => setSources(event.target.value)} placeholder="One https link per line" />
            </label>
            <p className="sf-fill-hint">A resource or a follow needs at least one link. SkillFlow checks each link before saving.</p>
            {stages.length > 0 ? (
              <label>
                Relevant stage
                <select value={stageId} onChange={(event) => setStageId(event.target.value)}>
                  <option value="">None</option>
                  {stages.map((stage) => (
                    <option key={stage.id} value={stage.id}>Stage {stage.order}: {stage.title}</option>
                  ))}
                </select>
              </label>
            ) : null}
            <label>
              Tags
              <input value={tags} onChange={(event) => setTags(event.target.value)} placeholder="html, layout" />
            </label>
            <p className="sf-fill-hint">Up to 5, separated by commas.</p>
            <label>
              Disclosure
              <select value={disclosure} onChange={(event) => setDisclosure(event.target.value)}>
                <option value="NONE">No extra relationship</option>
                <option value="I_MADE_THIS">I made this</option>
                <option value="AFFILIATE_OR_SPONSORED">Affiliate or sponsored</option>
              </select>
            </label>
          </>
        ) : null}
        {current === "path" ? (
          <>
            {pathSteps.map((row, index) => (
              <fieldset key={index}>
                <legend>Step {index + 1}</legend>
                <label>
                  Title
                  <input value={row.title} maxLength={120} onChange={(event) => updatePath(index, "title", event.target.value)} />
                </label>
                <label>
                  Link
                  <input value={row.url} onChange={(event) => updatePath(index, "url", event.target.value)} placeholder="https://" />
                </label>
                <label>
                  Note
                  <input value={row.note} maxLength={280} onChange={(event) => updatePath(index, "note", event.target.value)} />
                </label>
              </fieldset>
            ))}
            <div className="sf-community-actions">
              <Button type="button" size="sm" variant="outline" disabled={pathSteps.length >= 15} onClick={() => setPathSteps((rows) => [...rows, { title: "", url: "", note: "" }])}>
                Add a step
              </Button>
              <Button type="button" size="sm" variant="quiet" disabled={pathSteps.length <= 2} onClick={() => setPathSteps((rows) => rows.slice(0, -1))}>
                Remove last step
              </Button>
            </div>
          </>
        ) : null}
        {current === "send" ? (
          <>
            <ul className="sf-fill-summary">
              <li>{communityName}</li>
              <li>{TYPES.find((item) => item[0] === type)?.[1] ?? type}</li>
              <li>{title.trim() || "Untitled"}</li>
            </ul>
            <p className="sf-fill-hint">
              {editing
                ? "Saving sends it back to the review queue as a new revision. Links are checked again only if you changed them."
                : "It stays hidden until a moderator publishes it. You can share 5 contributions in 24 hours."}
            </p>
          </>
        ) : null}
      </WizardCard>
    </form>
  );
}
