"use client";

import { useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/core/Button.jsx";
import { SourceField } from "@/components/forms/SourceField";
import { storedSource } from "@/lib/stored-source";
import type { CatalogEditorSkill } from "@/lib/data/catalog-admin";
import { saveResource } from "../actions";

const TYPES = [
  { value: "DOC_LINK", label: "Documentation" },
  { value: "COURSE_LINK", label: "Course" },
  { value: "EMBEDDED_VIDEO", label: "Video" },
  { value: "HOOK_CLIP", label: "Short clip" },
] as const;

export function CatalogEditor({ skills }: { skills: CatalogEditorSkill[] }) {
  const router = useRouter();
  const [skillId, setSkillId] = useState(skills[0]?.id ?? "");
  const [stageId, setStageId] = useState(skills[0]?.stages[0]?.id ?? "");
  const [resourceId, setResourceId] = useState("");
  const [type, setType] = useState<string>(TYPES[0].value);
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [keyPoints, setKeyPoints] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [savedHref, setSavedHref] = useState("");

  const stages = useMemo(() => skills.find((skill) => skill.id === skillId)?.stages ?? [], [skills, skillId]);
  const resources = stages.find((stage) => stage.id === stageId)?.resources ?? [];

  function clearForm() {
    setResourceId("");
    setType(TYPES[0].value);
    setUrl("");
    setTitle("");
    setDescription("");
    setKeyPoints("");
    setSavedHref("");
    setError("");
    setErrors({});
  }

  function chooseSkill(id: string) {
    const nextStages = skills.find((skill) => skill.id === id)?.stages ?? [];
    setSkillId(id);
    setStageId(nextStages[0]?.id ?? "");
    clearForm();
  }

  function chooseStage(id: string) {
    setStageId(id);
    clearForm();
  }

  function editResource(id: string) {
    const resource = resources.find((item) => item.id === id);
    if (!resource) return;
    setResourceId(resource.id);
    setType(resource.type);
    setUrl(resource.url);
    setTitle(resource.title);
    setDescription(resource.description);
    setKeyPoints(resource.keyPoints);
    setSavedHref("");
    setError("");
    setErrors({});
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const next: Record<string, string> = {};
    if (!stageId) next.stage = "Choose a stage.";
    if (!title.trim()) next.title = "Add a title.";
    if (!storedSource(url)) next.url = "Upload a file, or use an https link.";
    setErrors(next);
    if (Object.keys(next).length) return;

    setPending(true);
    setError("");
    const result = await saveResource({
      id: resourceId || undefined,
      stageId,
      type,
      url,
      title,
      description,
      keyPoints,
    });
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      setSavedHref("");
      return;
    }
    setResourceId(result.id);
    setSavedHref(result.lessonHref);
    router.refresh();
  }

  return (
    <div className="sf-catalog">
      <section className="sf-dash-block" aria-labelledby="catalog-existing">
        <h2 id="catalog-existing">On this stage</h2>
        {resources.length === 0 ? (
          <p>No resources on this stage yet.</p>
        ) : (
          <ul className="sf-catalog-list">
            {resources.map((resource) => (
              <li key={resource.id}>
                <button type="button" aria-current={resource.id === resourceId ? "true" : undefined} onClick={() => editResource(resource.id)}>
                  <span>{resource.title}</span>
                  <span>{TYPES.find((item) => item.value === resource.type)?.label ?? resource.type}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
      <form className="sf-submit" onSubmit={(event) => void onSubmit(event)}>
        <h2>{resourceId ? "Edit resource" : "Add a resource"}</h2>
        <label>
          Skill
          <select value={skillId} onChange={(event) => chooseSkill(event.target.value)}>
            {skills.map((skill) => (
              <option key={skill.id} value={skill.id}>
                {skill.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Stage
          <select
            value={stageId}
            aria-invalid={Boolean(errors.stage)}
            aria-describedby={errors.stage ? "catalog-stage-error" : undefined}
            onChange={(event) => chooseStage(event.target.value)}
          >
            {stages.map((stage) => (
              <option key={stage.id} value={stage.id}>
                {stage.order}. {stage.title}
              </option>
            ))}
          </select>
        </label>
        {errors.stage ? <p id="catalog-stage-error">{errors.stage}</p> : null}
        <label>
          Type
          <select value={type} onChange={(event) => setType(event.target.value)}>
            {TYPES.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <SourceField
          label="Link"
          value={url}
          invalid={Boolean(errors.url)}
          errorId={errors.url ? "catalog-url-error" : undefined}
          onChange={setUrl}
        />
        {errors.url ? <p id="catalog-url-error">{errors.url}</p> : null}
        <label>
          Title
          <input
            value={title}
            aria-invalid={Boolean(errors.title)}
            aria-describedby={errors.title ? "catalog-title-error" : undefined}
            onChange={(event) => setTitle(event.target.value)}
          />
        </label>
        {errors.title ? <p id="catalog-title-error">{errors.title}</p> : null}
        <label>
          Description
          <textarea value={description} rows={3} onChange={(event) => setDescription(event.target.value)} />
        </label>
        <label>
          Key points
          <textarea value={keyPoints} rows={3} onChange={(event) => setKeyPoints(event.target.value)} />
        </label>
        {error ? <p role="alert">{error}</p> : null}
        {savedHref ? (
          <p role="status">
            Saved. <Link href={savedHref}>Open the lesson</Link>
          </p>
        ) : null}
        <p className="sf-roadmap-actions">
          <Button type="submit" variant="gradient" disabled={pending}>
            {pending ? "Saving..." : "Save resource"}
          </Button>
          {resourceId ? (
            <Button type="button" variant="quiet" onClick={clearForm}>
              New resource
            </Button>
          ) : null}
        </p>
      </form>
    </div>
  );
}
