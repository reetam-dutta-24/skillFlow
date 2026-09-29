"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/core/Button.jsx";
import { submitResource } from "../actions";

type SkillOption = { id: string; name: string; stages: { id: string; title: string }[] };

export function SubmitForm({ skills }: { skills: SkillOption[] }) {
  const router = useRouter();
  const params = useSearchParams();
  const preset = params.get("stageId") ?? "";
  const presetSkill = skills.find((skill) => skill.stages.some((stage) => stage.id === preset))?.id ?? skills[0]?.id ?? "";
  const [skillId, setSkillId] = useState(presetSkill);
  const [stageId, setStageId] = useState(preset || skills.find((skill) => skill.id === presetSkill)?.stages[0]?.id || "");
  const [type, setType] = useState("DOC_LINK");
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const stages = useMemo(() => skills.find((skill) => skill.id === skillId)?.stages ?? [], [skills, skillId]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const next: Record<string, string> = {};
    if (!skillId) next.skill = "Choose a skill.";
    if (!stageId) next.stage = "Choose a stage.";
    if (!title.trim()) next.title = "Add a title.";
    if (!url.startsWith("https://")) next.url = "Use an https link.";
    setErrors(next);
    if (Object.keys(next).length) return;
    setPending(true);
    setError("");
    const result = await submitResource({ stageId, type, url, title, description });
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.refresh();
    setDone(true);
  }

  if (done) {
    return <p role="status">Thanks. An admin will review your suggestion. It will not appear on the roadmap until approved.</p>;
  }

  return (
    <form className="sf-submit" onSubmit={(event) => void onSubmit(event)}>
      <p>On-topic, testable knowledge. No political or entertainment content.</p>
      <label>
        Skill
        <select value={skillId} aria-invalid={Boolean(errors.skill)} aria-describedby={errors.skill ? "skill-error" : undefined} onChange={(event) => { const id = event.target.value; setSkillId(id); setStageId(skills.find((skill) => skill.id === id)?.stages[0]?.id ?? ""); }}>
          {skills.map((skill) => <option key={skill.id} value={skill.id}>{skill.name}</option>)}
        </select>
      </label>
      {errors.skill ? <p id="skill-error">{errors.skill}</p> : null}
      <label>
        Stage
        <select value={stageId} aria-invalid={Boolean(errors.stage)} aria-describedby={errors.stage ? "stage-error" : undefined} onChange={(event) => setStageId(event.target.value)}>
          {stages.map((stage) => <option key={stage.id} value={stage.id}>{stage.title}</option>)}
        </select>
      </label>
      {errors.stage ? <p id="stage-error">{errors.stage}</p> : null}
      <label>
        Type
        <select value={type} onChange={(event) => setType(event.target.value)}>
          <option value="DOC_LINK">Doc</option>
          <option value="EMBEDDED_VIDEO">Video</option>
          <option value="COURSE_LINK">Course</option>
        </select>
      </label>
      <label>
        Link
        <input value={url} inputMode="url" type="url" aria-invalid={Boolean(errors.url)} aria-describedby={errors.url ? "url-error" : undefined} onChange={(event) => setUrl(event.target.value)} placeholder="https://" />
      </label>
      {errors.url ? <p id="url-error">{errors.url}</p> : null}
      <label>
        Title
        <input value={title} aria-invalid={Boolean(errors.title)} aria-describedby={errors.title ? "title-error" : undefined} onChange={(event) => setTitle(event.target.value)} />
      </label>
      {errors.title ? <p id="title-error">{errors.title}</p> : null}
      <label>
        Description
        <textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={4} />
      </label>
      {error ? <p role="alert">{error}</p> : null}
      <Button type="submit" variant="gradient" disabled={pending}>{pending ? "Sending..." : "Submit suggestion"}</Button>
    </form>
  );
}
