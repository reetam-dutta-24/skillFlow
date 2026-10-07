"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/core/Button.jsx";
import { SourceField } from "@/components/forms/SourceField";
import { useToast } from "@/components/feedback/Toast";
import type { CmsNiche, CmsStage } from "@/lib/data/catalog-admin";
import { createStage, saveStage } from "../../actions";
import { Field, FormSection, LinesField, SaveBar, cmsHref } from "./fields";

const LEVELS = [
  { value: "BEGINNER", label: "Beginner" },
  { value: "INTERMEDIATE", label: "Intermediate" },
  { value: "ADVANCED", label: "Advanced" },
] as const;

/** Create or edit one stage and its explain-back, in three sections. */
export function StageForm({ niche, stage }: { niche: CmsNiche; stage: CmsStage | null }) {
  const router = useRouter();
  const toast = useToast();
  const [title, setTitle] = useState(stage?.title ?? "");
  const [level, setLevel] = useState<string>(stage?.level ?? "BEGINNER");
  const [description, setDescription] = useState(stage?.description ?? "");
  const [image, setImage] = useState(stage?.image ?? "");
  const [objectives, setObjectives] = useState(stage?.objectives ?? "");
  const [question, setQuestion] = useState(stage?.question ?? "");
  const [rubric, setRubric] = useState(stage?.rubric ?? "");
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState<{ tone: "error" | "ok"; text: string } | null>(null);

  async function save() {
    setPending(true);
    setStatus(null);
    const clean = (text: string) =>
      text
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .join("\n");
    const fields = {
      skillId: niche.id,
      title,
      description,
      image,
      level,
      objectives: clean(objectives),
      question,
      rubric: clean(rubric),
    };
    const result = stage ? await saveStage({ ...fields, order: stage.order }) : await createStage(fields);
    setPending(false);
    if (!result.ok) {
      setStatus({ tone: "error", text: result.error });
      return;
    }
    toast(stage ? "Stage saved." : "Stage added.");
    if (stage) {
      setStatus({ tone: "ok", text: "Saved. Learners see the change right away." });
      router.refresh();
    } else {
      router.push(cmsHref({ niche: niche.slug, stage: result.id }));
      router.refresh();
    }
  }

  return (
    <form
      className="sf-cms-form"
      onSubmit={(event) => {
        event.preventDefault();
        void save();
      }}
    >
      <FormSection title="Basics" description="What the learner sees on the path page and at the top of the lesson.">
        <Field label="Title" required>
          {(props) => <input {...props} value={title} maxLength={120} required onChange={(event) => setTitle(event.target.value)} placeholder="How the Web Works" />}
        </Field>
        <Field label="Level">
          {(props) => (
            <select {...props} value={level} onChange={(event) => setLevel(event.target.value)}>
              {LEVELS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          )}
        </Field>
        <Field label="Description" wide hint="Two or three sentences on what this stage covers and why it matters.">
          {(props) => <textarea {...props} rows={3} value={description} onChange={(event) => setDescription(event.target.value)} />}
        </Field>
        <div className="sf-cms-field is-wide">
          <SourceField label="Stage photo" value={image} onChange={setImage} kind="image" />
          <p className="sf-cms-hint">16:9 works best. Leave the committed photo as it is unless you are replacing it.</p>
        </div>
      </FormSection>

      <FormSection title="Learning objectives" description="One idea per line. The explain-back asks the learner to explain each one in their own words.">
        <LinesField
          label="Objective"
          value={objectives}
          onChange={setObjectives}
          placeholder="Explain what happens when a browser requests a page"
          addLabel="Add objective"
        />
      </FormSection>

      <FormSection title="Explain-back" description="Used when no model key is set, and as context for the review. Saving clears the generated ideas so they are rewritten from the resources.">
        <Field label="Question" wide required hint="The prompt the learner answers in their own words.">
          {(props) => <textarea {...props} rows={2} value={question} required onChange={(event) => setQuestion(event.target.value)} />}
        </Field>
        <LinesField label="Rubric line" value={rubric} onChange={setRubric} placeholder="Names the request and the response" addLabel="Add rubric line" required />
      </FormSection>

      <SaveBar status={status}>
        <Link className="sf-btn sf-btn--outline sf-btn--md" href={cmsHref({ niche: niche.slug })}>
          {stage ? "Back to stages" : "Cancel"}
        </Link>
        <Button type="submit" variant="gradient" pending={pending} pendingLabel="Saving…">
          {stage ? "Save stage" : "Add stage"}
        </Button>
      </SaveBar>
    </form>
  );
}
