"use client";

import { startTransition, useActionState, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/core/Button.jsx";
import { createContributionAction, updateContributionAction, type FormState } from "../actions";

type Stage = { id: string; order: number; title: string };
type NicheOption = { slug: string; name: string };
type Step = { title: string; url: string; note: string };

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
  steps: Step[];
  /** Merged now. Saving sends it back for review. */
  resubmit: boolean;
};

const EMPTY_STEPS: Step[] = [
  { title: "", url: "", note: "" },
  { title: "", url: "", note: "" },
];

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
  const [type, setType] = useState(draft?.type ?? "RESOURCE");
  const [steps, setSteps] = useState<Step[]>(draft && draft.steps.length >= 2 ? draft.steps : EMPTY_STEPS);
  const uploadedImage = draft?.imageUrl?.startsWith("/uploads/") ? draft.imageUrl : null;
  const linkedImage = draft?.imageUrl && !uploadedImage ? draft.imageUrl : "";

  function updateStep(index: number, key: keyof Step, value: string) {
    setSteps((current) => current.map((step, stepIndex) => (stepIndex === index ? { ...step, [key]: value } : step)));
  }

  // Submitting through a transition keeps what the person typed when the server returns an error.
  // A plain form action would reset every uncontrolled field.
  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => action(formData));
  }

  return (
    <form className="sf-os-form" onSubmit={onSubmit}>
      <input type="hidden" name="skillId" value={skillId} />
      <input type="hidden" name="slug" value={slug} />
      {draft ? <input type="hidden" name="contributionId" value={draft.id} /> : null}

      {draft?.resubmit ? (
        <p className="sf-os-warning" role="note">
          This will hide it from the niche until it&apos;s reviewed again.
        </p>
      ) : null}

      {editing ? (
        <p className="sf-os-hint">Community: {communityName}. A contribution stays in the community it was shared in.</p>
      ) : (
        <label>
          Community
          <select value={slug} onChange={(event) => router.push(`/open-source/${event.target.value}/contribute`)}>
            {niches.map((niche) => (
              <option key={niche.slug} value={niche.slug}>
                {niche.name}
              </option>
            ))}
          </select>
          <span className="sf-os-hint">This community is {communityName}. The name comes from the niche.</span>
        </label>
      )}

      <label>
        Type
        <select name="type" value={type} onChange={(event) => setType(event.target.value)}>
          <option value="RESOURCE">Resource</option>
          <option value="CONCEPT_NOTE">Concept note</option>
          <option value="LEARNING_PATH">Learning path</option>
          <option value="FOLLOW">Follow</option>
        </select>
      </label>

      <label>
        Title
        <input name="title" maxLength={120} required defaultValue={draft?.title} placeholder="What should someone learn from this?" aria-invalid={state?.field === "title"} />
      </label>

      <fieldset>
        <legend>Image</legend>
        <label>
          Upload
          <input name="imageFile" type="file" accept="image/jpeg,image/png,image/webp,image/gif" />
        </label>
        <label>
          Or an https link
          <input name="imageUrl" type="url" defaultValue={linkedImage} placeholder="https://" aria-invalid={state?.field === "imageUrl"} />
        </label>
        {uploadedImage ? (
          <>
            <input type="hidden" name="currentImageUrl" value={uploadedImage} />
            <label className="sf-os-check">
              <input type="checkbox" name="removeImage" />
              Remove the uploaded image
            </label>
          </>
        ) : null}
        <span className="sf-os-hint">Optional. An uploaded image is used if you choose both.</span>
      </fieldset>

      <label>
        Sources
        <textarea name="sources" rows={4} defaultValue={draft?.sources.join("\n")} placeholder={"One https link per line"} aria-invalid={state?.field === "sources"} />
        <span className="sf-os-hint">A resource or a follow needs at least one link. SkillFlow checks each link before saving.</span>
      </label>

      <label>
        Description
        <textarea name="description" rows={8} maxLength={5000} required defaultValue={draft?.description} placeholder="The main thing a learner should take from this." aria-invalid={state?.field === "description"} />
      </label>

      {stages.length > 0 ? (
        <label>
          Relevant stage
          <select name="stageId" defaultValue={draft?.stageId ?? ""} aria-invalid={state?.field === "stageId"}>
            <option value="">None</option>
            {stages.map((stage) => (
              <option key={stage.id} value={stage.id}>
                Stage {stage.order}: {stage.title}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      <label>
        Tags
        <input name="tags" defaultValue={draft?.tags.join(", ")} placeholder="html, layout" aria-invalid={state?.field === "tags"} />
        <span className="sf-os-hint">Up to 5, separated by commas.</span>
      </label>

      <label>
        Disclosure
        <select name="disclosure" defaultValue={draft?.disclosure ?? "NONE"} aria-invalid={state?.field === "disclosure"}>
          <option value="NONE">No extra relationship</option>
          <option value="I_MADE_THIS">I made this</option>
          <option value="AFFILIATE_OR_SPONSORED">Affiliate or sponsored</option>
        </select>
      </label>

      {type === "LEARNING_PATH" ? (
        <fieldset>
          <legend>Steps</legend>
          {steps.map((step, index) => (
            <div className="sf-os-step" key={index}>
              <label>
                Step {index + 1}
                <input name="stepTitle" value={step.title} maxLength={120} onChange={(event) => updateStep(index, "title", event.target.value)} />
              </label>
              <label>
                Link
                <input name="stepUrl" value={step.url} onChange={(event) => updateStep(index, "url", event.target.value)} placeholder="https://" />
              </label>
              <label>
                Note
                <input name="stepNote" value={step.note} maxLength={280} onChange={(event) => updateStep(index, "note", event.target.value)} />
              </label>
            </div>
          ))}
          <div className="sf-community-actions">
            <Button type="button" size="sm" variant="outline" disabled={steps.length >= 15} onClick={() => setSteps((current) => [...current, { title: "", url: "", note: "" }])}>
              Add a step
            </Button>
            <Button type="button" size="sm" variant="quiet" disabled={steps.length <= 2} onClick={() => setSteps((current) => current.slice(0, -1))}>
              Remove last step
            </Button>
          </div>
        </fieldset>
      ) : null}

      {state ? (
        <p className="sf-auth-error" role="alert">
          {state.error}
        </p>
      ) : null}

      <div className="sf-community-actions">
        <Button type="submit" variant="gradient" disabled={pending}>
          {pending ? "Saving…" : draft?.resubmit ? "Resubmit for review" : editing ? "Save changes" : "Submit contribution"}
        </Button>
      </div>
      <p className="sf-os-hint">
        {editing
          ? "Saving sends it back to the review queue as a new revision. Links are checked again only if you changed them."
          : "It stays hidden until a moderator publishes it. You can share 5 contributions in 24 hours."}
      </p>
    </form>
  );
}
