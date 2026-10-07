"use client";

import { useId, useMemo, useRef, useState, type FormEvent } from "react";
import { useFocusTrap } from "@/components/feedback/useFocusTrap";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/core/Button.jsx";
import { Chip } from "@/components/core/Chip.jsx";
import { SourceField } from "@/components/forms/SourceField";
import { storedSource } from "@/lib/stored-source";
import type { CatalogEditorResource, CatalogEditorSkill, CatalogEditorStage } from "@/lib/data/catalog-admin";
import { markReviewed, moveResources, moveStages, recheckLink, removeResource, saveResource, saveStage, suggestTags } from "../actions";

const TYPES = [
  { value: "DOC_LINK", label: "Documentation" },
  { value: "COURSE_LINK", label: "Course" },
  { value: "EMBEDDED_VIDEO", label: "Video" },
  { value: "HOOK_CLIP", label: "Short clip" },
] as const;

const LEVELS = [
  { value: "BEGINNER", label: "Beginner" },
  { value: "INTERMEDIATE", label: "Intermediate" },
  { value: "ADVANCED", label: "Advanced" },
] as const;

function shifted(ids: string[], id: string, direction: -1 | 1) {
  const index = ids.indexOf(id);
  const target = index + direction;
  if (index < 0 || target < 0 || target >= ids.length) return null;
  const next = [...ids];
  const [item] = next.splice(index, 1);
  next.splice(target, 0, item);
  return next;
}

function checkedLabel(value: string | null) {
  if (!value) return "Not checked yet.";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not checked yet.";
  return `Last checked ${date.toLocaleString()}.`;
}

function reviewCount(stage: CatalogEditorStage) {
  return stage.resources.filter((resource) => resource.needsReview).length;
}

export function CatalogEditor({ skills }: { skills: CatalogEditorSkill[] }) {
  const router = useRouter();
  const deleteTitleId = useId();
  const deleteRef = useRef<HTMLDivElement>(null);
  const first = skills[0];
  const firstStage = first?.stages[0];
  const [skillId, setSkillId] = useState(first?.id ?? "");
  const [stageId, setStageId] = useState(firstStage?.id ?? "");
  const [stageTitle, setStageTitle] = useState(firstStage?.title ?? "");
  const [stageImage, setStageImage] = useState(firstStage?.image ?? "");
  const [stageDescription, setStageDescription] = useState(firstStage?.description ?? "");
  const [level, setLevel] = useState(firstStage?.level ?? "BEGINNER");
  const [objectives, setObjectives] = useState(firstStage?.objectives ?? "");
  const [question, setQuestion] = useState(firstStage?.question ?? "");
  const [rubric, setRubric] = useState(firstStage?.rubric ?? "");
  const [stageError, setStageError] = useState("");
  const [stageSaved, setStageSaved] = useState(false);
  const [resourceId, setResourceId] = useState("");
  const [type, setType] = useState<string>(TYPES[0].value);
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [keyPoints, setKeyPoints] = useState("");
  const [transcript, setTranscript] = useState("");
  const [provider, setProvider] = useState("");
  const [author, setAuthor] = useState("");
  const [videoId, setVideoId] = useState("");
  const [isFree, setIsFree] = useState(true);
  const [language, setLanguage] = useState("en");
  const [sourceStatus, setSourceStatus] = useState("ACTIVE");
  const [needsReview, setNeedsReview] = useState(false);
  const [durationMinutes, setDurationMinutes] = useState("");
  const [depth, setDepth] = useState("");
  const [isCore, setIsCore] = useState(false);
  const [captionLanguages, setCaptionLanguages] = useState("");
  const [tagOrigins, setTagOrigins] = useState<CatalogEditorResource["tagOrigins"]>({});
  const [lastVerifiedAt, setLastVerifiedAt] = useState<string | null>(null);
  const [reviewOnly, setReviewOnly] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState("");
  const [error, setError] = useState("");
  const [savedHref, setSavedHref] = useState("");
  const [checkMessage, setCheckMessage] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const stages = useMemo(() => skills.find((skill) => skill.id === skillId)?.stages ?? [], [skills, skillId]);
  const stage = stages.find((item) => item.id === stageId);
  const resources = stage?.resources ?? [];
  const visible = reviewOnly ? resources.filter((resource) => resource.needsReview) : resources;
  const busy = pending.length > 0;

  useFocusTrap(deleteRef, confirmDelete, () => setConfirmDelete(false));

  function clearResource() {
    setResourceId("");
    setType(TYPES[0].value);
    setUrl("");
    setTitle("");
    setDescription("");
    setKeyPoints("");
    setTranscript("");
    setProvider("");
    setAuthor("");
    setVideoId("");
    setIsFree(true);
    setLanguage("en");
    setSourceStatus("ACTIVE");
    setNeedsReview(false);
    setDurationMinutes("");
    setDepth("");
    setIsCore(false);
    setCaptionLanguages("");
    setTagOrigins({});
    setLastVerifiedAt(null);
    setSavedHref("");
    setError("");
    setCheckMessage("");
    setErrors({});
    setConfirmDelete(false);
  }

  function showStage(next: CatalogEditorStage | undefined) {
    setStageId(next?.id ?? "");
    setStageTitle(next?.title ?? "");
    setStageImage(next?.image ?? "");
    setStageDescription(next?.description ?? "");
    setLevel(next?.level ?? "BEGINNER");
    setObjectives(next?.objectives ?? "");
    setQuestion(next?.question ?? "");
    setRubric(next?.rubric ?? "");
    setStageError("");
    setStageSaved(false);
    clearResource();
  }

  function chooseSkill(id: string) {
    const nextStages = skills.find((skill) => skill.id === id)?.stages ?? [];
    setSkillId(id);
    showStage(nextStages[0]);
  }

  function editResource(resource: CatalogEditorResource) {
    setResourceId(resource.id);
    setType(resource.type);
    setUrl(resource.url);
    setTitle(resource.title);
    setDescription(resource.description);
    setKeyPoints(resource.keyPoints);
    setTranscript(resource.transcript);
    setProvider(resource.provider);
    setAuthor(resource.author);
    setVideoId(resource.videoId);
    setIsFree(resource.isFree);
    setLanguage(resource.language);
    setSourceStatus(resource.sourceStatus);
    setNeedsReview(resource.needsReview);
    setDurationMinutes(resource.durationMinutes ? String(resource.durationMinutes) : "");
    setDepth(resource.depth ?? "");
    setIsCore(resource.isCore);
    setCaptionLanguages(resource.captionLanguages);
    setTagOrigins(resource.tagOrigins);
    setLastVerifiedAt(resource.lastVerifiedAt);
    setSavedHref("");
    setError("");
    setCheckMessage("");
    setErrors({});
  }

  async function onSaveStage(event: FormEvent) {
    event.preventDefault();
    if (!stage) {
      setStageError("Choose a stage.");
      return;
    }
    if (!stageTitle.trim()) {
      setStageError("Add a title.");
      return;
    }
    if (stageImage.trim() && !storedSource(stageImage)) {
      setStageError("Upload an image, or use an https link.");
      return;
    }
    if (!question.trim()) {
      setStageError("Add an explain-back question.");
      return;
    }
    if (!rubric.trim()) {
      setStageError("Add at least one rubric line.");
      return;
    }
    setPending("stage");
    setStageError("");
    setStageSaved(false);
    const result = await saveStage({
      skillId,
      order: stage.order,
      title: stageTitle,
      image: stageImage,
      description: stageDescription,
      level,
      objectives,
      question,
      rubric,
    });
    setPending("");
    if (!result.ok) {
      setStageError(result.error);
      return;
    }
    setStageSaved(true);
    router.refresh();
  }

  async function onMoveStage(direction: -1 | 1) {
    if (!stage) return;
    const next = shifted(stages.map((item) => item.id), stage.id, direction);
    if (!next) return;
    setPending("stage-order");
    setStageError("");
    const result = await moveStages({ skillId, stageIds: next });
    setPending("");
    if (!result.ok) {
      setStageError(result.error);
      return;
    }
    router.refresh();
  }

  async function onMoveResource(id: string, direction: -1 | 1) {
    const next = shifted(resources.map((item) => item.id), id, direction);
    if (!next) return;
    setPending("resource-order");
    setError("");
    const result = await moveResources({ stageId, resourceIds: next });
    setPending("");
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const next: Record<string, string> = {};
    if (!stageId) next.stage = "Choose a stage.";
    if (!title.trim()) next.title = "Add a title.";
    if (!storedSource(url)) next.url = "Upload a file, or use an https link.";
    if (!language.trim()) next.language = "Add a language.";
    if (durationMinutes.trim() && !Number.isFinite(Number(durationMinutes))) next.duration = "Minutes need to be a number.";
    setErrors(next);
    if (Object.keys(next).length) return;

    setPending("save");
    setError("");
    const result = await saveResource({
      id: resourceId || undefined,
      stageId,
      type,
      url,
      title,
      description,
      keyPoints,
      transcript,
      provider,
      author,
      videoId,
      isFree,
      language,
      sourceStatus,
      needsReview,
      durationMinutes: durationMinutes.trim() ? Number(durationMinutes) : null,
      depth: depth === "INTRO" || depth === "STANDARD" || depth === "DEEP" ? depth : null,
      isCore,
      captionLanguages: captionLanguages.split("\n").map((line) => line.trim()).filter(Boolean),
    });
    setPending("");
    if (!result.ok) {
      setError(result.error);
      setSavedHref("");
      return;
    }
    setResourceId(result.id);
    setSavedHref(result.lessonHref);
    router.refresh();
  }

  async function onMarkReviewed() {
    if (!resourceId) return;
    setPending("review");
    setError("");
    const result = await markReviewed({ id: resourceId, stageId });
    setPending("");
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setNeedsReview(false);
    router.refresh();
  }

  async function onRecheck() {
    if (!resourceId) return;
    setPending("check");
    setError("");
    setCheckMessage("");
    const result = await recheckLink({ id: resourceId, stageId });
    setPending("");
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setCheckMessage(result.summary);
    setLastVerifiedAt(result.checkedAt);
    router.refresh();
  }

  async function onSuggest() {
    if (!resourceId) return;
    setPending("suggest");
    setError("");
    const result = await suggestTags(resourceId);
    setPending("");
    if (!result.ok) {
      setError(result.error);
      return;
    }
    const next = result.suggestion;
    if (tagOrigins.durationMinutes !== "admin" && next.durationMinutes) setDurationMinutes(String(next.durationMinutes));
    if (tagOrigins.depth !== "admin") setDepth(next.depth);
    if (tagOrigins.isCore !== "admin") setIsCore(next.isCore);
    if (tagOrigins.captionLanguages !== "admin" && next.captionLanguages.length) setCaptionLanguages(next.captionLanguages.join("\n"));
    setCheckMessage("Review the suggested tags, then save. Fields you already set stay as they are.");
  }

  async function onDelete() {
    if (!resourceId) return;
    setPending("delete");
    setError("");
    const result = await removeResource({ id: resourceId, stageId });
    setPending("");
    if (!result.ok) {
      setError(result.error);
      setConfirmDelete(false);
      return;
    }
    clearResource();
    router.refresh();
  }

  return (
    <div>
      <section className="sf-catalog-stage" aria-labelledby="catalog-stage-heading">
        <h2 id="catalog-stage-heading">Stage</h2>
        <form className="sf-submit" onSubmit={(event) => void onSaveStage(event)}>
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
              onChange={(event) => showStage(stages.find((item) => item.id === event.target.value))}
            >
              {stages.map((item) => {
                const reviews = reviewCount(item);
                return (
                  <option key={item.id} value={item.id}>
                    {item.order}. {item.title}
                    {reviews > 0 ? ` (${reviews} to review)` : ""}
                  </option>
                );
              })}
            </select>
          </label>
          {errors.stage ? <p id="catalog-stage-error">{errors.stage}</p> : null}
          <p className="sf-roadmap-actions">
            <Button type="button" size="sm" variant="quiet" disabled={busy || !stage || stage.order === stages[0]?.order} onClick={() => void onMoveStage(-1)}>
              Move stage up
            </Button>
            <Button
              type="button"
              size="sm"
              variant="quiet"
              disabled={busy || !stage || stage.order === stages[stages.length - 1]?.order}
              onClick={() => void onMoveStage(1)}
            >
              Move stage down
            </Button>
          </p>
          <label>
            Title
            <input value={stageTitle} onChange={(event) => setStageTitle(event.target.value)} />
          </label>
          <SourceField label="Image" kind="image" value={stageImage} onChange={setStageImage} />
          <label>
            Description
            <textarea value={stageDescription} rows={3} onChange={(event) => setStageDescription(event.target.value)} />
          </label>
          <label>
            Level
            <select value={level} onChange={(event) => setLevel(event.target.value as typeof level)}>
              {LEVELS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Objectives
            <textarea value={objectives} rows={4} aria-describedby="catalog-objectives-hint" onChange={(event) => setObjectives(event.target.value)} />
          </label>
          <p id="catalog-objectives-hint">One idea per line. Opening the gate writes these from the stage’s resources. A save here stays until those resources change, then the gate is written again.</p>
          <label>
            Explain-back question
            <textarea value={question} rows={3} onChange={(event) => setQuestion(event.target.value)} />
          </label>
          <label>
            Rubric
            <textarea value={rubric} rows={4} aria-describedby="catalog-rubric-hint" onChange={(event) => setRubric(event.target.value)} />
          </label>
          <p id="catalog-rubric-hint">One rubric line per line.</p>
          {stageError ? <p role="alert">{stageError}</p> : null}
          {stageSaved ? <p role="status">Stage saved.</p> : null}
          <p className="sf-roadmap-actions">
            <Button type="submit" variant="gradient" disabled={busy}>
              {pending === "stage" ? "Saving…" : "Save stage"}
            </Button>
          </p>
        </form>
      </section>

      <div className="sf-catalog">
        <section className="sf-dash-block" aria-labelledby="catalog-existing">
          <h2 id="catalog-existing">On this stage</h2>
          <div className="sf-check">
            <input id="catalog-review-only" type="checkbox" checked={reviewOnly} onChange={(event) => setReviewOnly(event.target.checked)} />
            <label htmlFor="catalog-review-only">Needs review only</label>
          </div>
          {visible.length === 0 ? (
            <p>{reviewOnly ? "No resources need review on this stage." : "No resources on this stage yet."}</p>
          ) : (
            <ul className="sf-catalog-list">
              {visible.map((resource) => {
                const index = resources.findIndex((item) => item.id === resource.id);
                return (
                  <li key={resource.id} className="sf-catalog-row">
                    <button
                      type="button"
                      aria-current={resource.id === resourceId ? "true" : undefined}
                      onClick={() => editResource(resource)}
                    >
                      <span>{resource.title}</span>
                      <span className="sf-catalog-meta">
                        {TYPES.find((item) => item.value === resource.type)?.label ?? resource.type}
                        {resource.needsReview ? <Chip tone="warn">Needs review</Chip> : null}
                        {resource.sourceStatus === "UNAVAILABLE" ? <Chip tone="fail">Unavailable</Chip> : null}
                      </span>
                    </button>
                    <span className="sf-catalog-moves">
                      <Button
                        type="button"
                        size="sm"
                        variant="quiet"
                        aria-label={`Move ${resource.title} up`}
                        disabled={busy || index <= 0}
                        onClick={() => void onMoveResource(resource.id, -1)}
                      >
                        Up
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="quiet"
                        aria-label={`Move ${resource.title} down`}
                        disabled={busy || index === resources.length - 1}
                        onClick={() => void onMoveResource(resource.id, 1)}
                      >
                        Down
                      </Button>
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <form className="sf-submit" onSubmit={(event) => void onSubmit(event)}>
          <h2>{resourceId ? "Edit resource" : "Add a resource"}</h2>
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
            <textarea value={keyPoints} rows={4} aria-describedby="catalog-points-hint" onChange={(event) => setKeyPoints(event.target.value)} />
          </label>
          <p id="catalog-points-hint">One key point per line.</p>
          <label>
            Transcript
            <textarea value={transcript} rows={3} onChange={(event) => setTranscript(event.target.value)} />
          </label>
          <label>
            Provider
            <input value={provider} onChange={(event) => setProvider(event.target.value)} />
          </label>
          <label>
            Author
            <input value={author} onChange={(event) => setAuthor(event.target.value)} />
          </label>
          <label>
            Video id
            <input value={videoId} spellCheck={false} onChange={(event) => setVideoId(event.target.value)} />
          </label>
          <label>
            Language
            <input
              value={language}
              aria-invalid={Boolean(errors.language)}
              aria-describedby={errors.language ? "catalog-language-error" : undefined}
              onChange={(event) => setLanguage(event.target.value)}
            />
          </label>
          {errors.language ? <p id="catalog-language-error">{errors.language}</p> : null}
          <label>
            Minutes
            <input value={durationMinutes} inputMode="numeric" onChange={(event) => setDurationMinutes(event.target.value)} />
          </label>
          <label>
            Depth
            <select value={depth} onChange={(event) => setDepth(event.target.value)}>
              <option value="">Not set</option>
              <option value="INTRO">Intro</option>
              <option value="STANDARD">Standard</option>
              <option value="DEEP">Deep</option>
            </select>
          </label>
          <label>
            Caption languages
            <textarea value={captionLanguages} rows={2} onChange={(event) => setCaptionLanguages(event.target.value)} />
          </label>
          <p>One language code per line, such as en or hi.</p>
          <div className="sf-check">
            <input id="catalog-core" type="checkbox" checked={isCore} onChange={(event) => setIsCore(event.target.checked)} />
            <label htmlFor="catalog-core">Core resource for this stage</label>
          </div>
          <label>
            Link status
            <select value={sourceStatus} onChange={(event) => setSourceStatus(event.target.value)}>
              <option value="ACTIVE">Active</option>
              <option value="UNAVAILABLE">Unavailable</option>
            </select>
          </label>
          <div className="sf-check">
            <input id="catalog-free" type="checkbox" checked={isFree} onChange={(event) => setIsFree(event.target.checked)} />
            <label htmlFor="catalog-free">Free to use</label>
          </div>
          <div className="sf-check">
            <input id="catalog-review" type="checkbox" checked={needsReview} onChange={(event) => setNeedsReview(event.target.checked)} />
            <label htmlFor="catalog-review">Needs review</label>
          </div>
          {resourceId ? <p>{checkedLabel(lastVerifiedAt)}</p> : null}
          {checkMessage ? <p role="status">{checkMessage}</p> : null}
          {error ? <p role="alert">{error}</p> : null}
          {savedHref ? (
            <p role="status">
              Saved. <Link href={savedHref}>Open the lesson</Link>
            </p>
          ) : null}
          <p className="sf-roadmap-actions">
            <Button type="submit" variant="gradient" disabled={busy}>
              {pending === "save" ? "Saving…" : "Save resource"}
            </Button>
            {resourceId ? (
              <Button type="button" variant="quiet" disabled={busy} onClick={() => void onSuggest()}>
                {pending === "suggest" ? "Suggesting…" : "Suggest tags with AI"}
              </Button>
            ) : null}
            {resourceId ? (
              <Button type="button" variant="quiet" disabled={busy} onClick={clearResource}>
                New resource
              </Button>
            ) : null}
            {resourceId ? (
              <Button type="button" variant="quiet" disabled={busy || !needsReview} onClick={() => void onMarkReviewed()}>
                {pending === "review" ? "Saving…" : "Mark reviewed"}
              </Button>
            ) : null}
            {resourceId ? (
              <Button type="button" variant="quiet" disabled={busy} onClick={() => void onRecheck()}>
                {pending === "check" ? "Checking…" : "Re-check link"}
              </Button>
            ) : null}
            {resourceId ? (
              <Button type="button" variant="outline" disabled={busy} onClick={() => setConfirmDelete(true)}>
                Delete
              </Button>
            ) : null}
          </p>
        </form>
      </div>

      {confirmDelete ? (
        <div className="sf-dialog-backdrop" onMouseDown={() => setConfirmDelete(false)}>
          <div
            ref={deleteRef}
            className="sf-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby={deleteTitleId}
            tabIndex={-1}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <h2 id={deleteTitleId}>Delete this resource?</h2>
            <p>This removes {title || "the resource"} from the stage.</p>
            <p className="sf-roadmap-actions">
              <Button type="button" variant="outline" disabled={busy} onClick={() => void onDelete()}>
                {pending === "delete" ? "Deleting…" : "Delete"}
              </Button>
              <Button type="button" variant="quiet" disabled={busy} onClick={() => setConfirmDelete(false)}>
                Cancel
              </Button>
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
