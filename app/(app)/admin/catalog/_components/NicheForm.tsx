"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/core/Button.jsx";
import { Chip } from "@/components/core/Chip.jsx";
import { SkillImage } from "@/components/core/SkillImage";
import { SourceField } from "@/components/forms/SourceField";
import { slugFromName } from "@/lib/niche-catalog";
import { storedSource } from "@/lib/stored-source";
import type { CatalogSkillRow } from "@/lib/data/catalog-admin";
import { createSkill, updateSkillStatus } from "../actions";

export function NicheForm({ skills }: { skills: CatalogSkillRow[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("");
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");
  const [pending, setPending] = useState(false);
  const [query, setQuery] = useState("");
  const [pendingId, setPendingId] = useState("");
  const [statusError, setStatusError] = useState("");
  const visible = skills.filter((skill) => {
    const needle = query.trim().toLowerCase();
    if (!needle) return true;
    return skill.name.toLowerCase().includes(needle) || skill.slug.includes(needle);
  });

  async function toggleStatus(skill: CatalogSkillRow) {
    setPendingId(skill.id);
    setStatusError("");
    const status = skill.status === "AVAILABLE" ? "COMING_SOON" : "AVAILABLE";
    const result = await updateSkillStatus({ skillId: skill.id, status });
    setPendingId("");
    if (!result.ok) {
      setStatusError(result.error);
      return;
    }
    router.refresh();
  }

  function onName(value: string) {
    setName(value);
    if (!slugEdited) setSlug(slugFromName(value));
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setSaved("");
    if (!storedSource(image)) {
      setError("Add an image from your device, or an https link.");
      return;
    }
    setPending(true);
    const result = await createSkill({ name, slug, description, image, open });
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setName("");
    setSlug("");
    setSlugEdited(false);
    setDescription("");
    setImage("");
    setOpen(false);
    setSaved(result.slug);
    router.refresh();
  }

  return (
    <section className="sf-niche-admin">
      <form className="sf-submit" onSubmit={(event) => void onSubmit(event)}>
        <h2>Add a niche</h2>
        <label>
          Name
          <input value={name} onChange={(event) => onName(event.target.value)} />
        </label>
        <label>
          Slug
          <input
            value={slug}
            spellCheck={false}
            onChange={(event) => {
              setSlugEdited(true);
              setSlug(event.target.value);
            }}
          />
        </label>
        <label>
          Description
          <textarea value={description} rows={3} onChange={(event) => setDescription(event.target.value)} />
        </label>
        <SourceField label="Image" kind="image" value={image} onChange={setImage} />
        <div className="sf-check">
          <input id="skill-open" type="checkbox" checked={open} onChange={(event) => setOpen(event.target.checked)} />
          <label htmlFor="skill-open">Open to follow</label>
        </div>
        <p>Leave this off. A new niche stays coming soon until its path is built.</p>
        {error ? <p role="alert">{error}</p> : null}
        {saved ? <p role="status">Saved {saved}.</p> : null}
        <p className="sf-roadmap-actions">
          <Button type="submit" variant="gradient" disabled={pending}>
            {pending ? "Saving..." : "Save niche"}
          </Button>
        </p>
      </form>
      <div>
        <h2>Niches</h2>
        <label className="sf-niche-filter">
          Filter niches
          <input value={query} onChange={(event) => setQuery(event.target.value)} />
        </label>
        {statusError ? <p role="alert">{statusError}</p> : null}
        <ul className="sf-niche-scroll">
          {visible.map((skill) => (
            <li key={skill.id}>
              <span className="sf-niche-row">
                <SkillImage src={skill.image} alt="" width={112} height={72} sizes="56px" />
                <span>
                  {skill.name}
                  <small>{skill.slug}</small>
                </span>
              </span>
              <span className="sf-niche-status">
                {skill.open ? <Chip tone="accent">Flagship</Chip> : null}
                <Button
                  type="button"
                  size="sm"
                  variant="quiet"
                  aria-pressed={skill.status === "AVAILABLE"}
                  aria-label={`${skill.name}, ${skill.status === "AVAILABLE" ? "available" : "coming soon"}`}
                  disabled={pendingId === skill.id}
                  onClick={() => void toggleStatus(skill)}
                >
                  {pendingId === skill.id ? "Saving..." : skill.status === "AVAILABLE" ? "Available" : "Coming soon"}
                </Button>
              </span>
            </li>
          ))}
        </ul>
        {visible.length === 0 ? <p>No niches match that filter.</p> : null}
      </div>
    </section>
  );
}
