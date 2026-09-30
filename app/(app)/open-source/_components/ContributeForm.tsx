"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/core/Button.jsx";
import { createContributionAction, type ContributeState } from "../actions";

type Stage = { id: string; order: number; title: string };
type NicheOption = { slug: string; name: string };

export function ContributeForm({
  skillId,
  slug,
  communityName,
  niches,
  stages,
}: {
  skillId: string;
  slug: string;
  communityName: string;
  niches: NicheOption[];
  stages: Stage[];
}) {
  const router = useRouter();
  const [state, action, pending] = useActionState(createContributionAction, null as ContributeState);
  const [type, setType] = useState("RESOURCE");
  const [steps, setSteps] = useState([
    { title: "", url: "", note: "" },
    { title: "", url: "", note: "" },
  ]);

  function updateStep(index: number, key: "title" | "url" | "note", value: string) {
    setSteps((current) => current.map((step, stepIndex) => (stepIndex === index ? { ...step, [key]: value } : step)));
  }

  return (
    <form className="sf-os-form" action={action}>
      <input type="hidden" name="skillId" value={skillId} />
      <input type="hidden" name="slug" value={slug} />

      <label>
        Community
        <select
          value={slug}
          onChange={(event) => router.push(`/open-source/${event.target.value}/contribute`)}
        >
          {niches.map((niche) => (
            <option key={niche.slug} value={niche.slug}>
              {niche.name}
            </option>
          ))}
        </select>
        <span className="sf-os-hint">This community is {communityName}. The name comes from the niche.</span>
      </label>

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
        <input name="title" maxLength={120} required placeholder="What should someone learn from this?" aria-invalid={state?.field === "title"} />
      </label>

      <fieldset>
        <legend>Image</legend>
        <label>
          Upload
          <input name="imageFile" type="file" accept="image/jpeg,image/png,image/webp,image/gif" />
        </label>
        <label>
          Or an https link
          <input name="imageUrl" type="url" placeholder="https://" aria-invalid={state?.field === "imageUrl"} />
        </label>
        <span className="sf-os-hint">Optional. An uploaded image is used if you choose both.</span>
      </fieldset>

      <label>
        Sources
        <textarea name="sources" rows={4} placeholder={"One https link per line"} aria-invalid={state?.field === "sources"} />
        <span className="sf-os-hint">A resource or a follow needs at least one link. SkillFlow checks each link before saving.</span>
      </label>

      <label>
        Description
        <textarea name="description" rows={8} maxLength={5000} required placeholder="The main thing a learner should take from this." aria-invalid={state?.field === "description"} />
      </label>

      {stages.length > 0 ? (
        <label>
          Relevant stage
          <select name="stageId" defaultValue="" aria-invalid={state?.field === "stageId"}>
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
        <input name="tags" placeholder="html, layout" aria-invalid={state?.field === "tags"} />
        <span className="sf-os-hint">Up to 5, separated by commas.</span>
      </label>

      <label>
        Disclosure
        <select name="disclosure" defaultValue="NONE" aria-invalid={state?.field === "disclosure"}>
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
          {pending ? "Saving…" : "Submit contribution"}
        </Button>
      </div>
      <p className="sf-os-hint">It stays hidden until a reviewer merges it. You can share 5 contributions in 24 hours.</p>
    </form>
  );
}
