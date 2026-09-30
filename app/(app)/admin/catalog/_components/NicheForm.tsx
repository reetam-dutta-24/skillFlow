"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/core/Button.jsx";
import { slugFromName } from "@/lib/niche-catalog";
import type { CatalogSkillRow } from "@/lib/data/catalog-admin";
import { createSkill } from "../actions";

export function NicheForm({ skills }: { skills: CatalogSkillRow[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [description, setDescription] = useState("");
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");
  const [pending, setPending] = useState(false);

  function onName(value: string) {
    setName(value);
    if (!slugEdited) setSlug(slugFromName(value));
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setSaved("");
    setPending(true);
    const result = await createSkill({ name, slug, description, open });
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setName("");
    setSlug("");
    setSlugEdited(false);
    setDescription("");
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
        <ul className="sf-niche-scroll">
          {skills.map((skill) => (
            <li key={skill.id}>
              <span>
                {skill.name}
                <small>{skill.slug}</small>
              </span>
              <span>{skill.open ? "Open" : "Coming soon"}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
