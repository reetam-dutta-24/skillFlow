"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { EmptyState } from "@/components/feedback/EmptyState.jsx";
import { arrangeNotes, type LearnerNoteView } from "@/lib/explain/notes-view";

export function NotesDesk({ notes }: { notes: LearnerNoteView[] }) {
  const [query, setQuery] = useState("");
  const [skill, setSkill] = useState("all");
  const [selectedId, setSelectedId] = useState(notes[0]?.id ?? "");
  const [reading, setReading] = useState(false);
  const skills = [...new Set(notes.map((note) => note.skillName))];
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return notes.filter((note) => {
      if (skill !== "all" && note.skillName !== skill) return false;
      if (!needle) return true;
      return `${note.concept} ${note.explanation} ${note.review} ${note.stageTitle} ${note.skillName}`.toLowerCase().includes(needle);
    });
  }, [notes, query, skill]);
  const groups = useMemo(() => arrangeNotes(filtered), [filtered]);
  const selected = filtered.find((note) => note.id === selectedId) ?? null;

  useEffect(() => {
    if (!selected) setReading(false);
  }, [selected]);

  function openNote(id: string) {
    setSelectedId(id);
    setReading(true);
  }

  if (notes.length === 0) {
    return (
      <EmptyState
        icon="notebook-pen"
        title="No notes yet"
        description="When an explain-back idea holds, it is kept here with the review that came back."
      />
    );
  }

  return (
    <div className={reading ? "sf-notes is-reading" : "sf-notes"}>
      <aside className="sf-notes-list" aria-label="Your notes">
        <label>
          Search notes
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="An idea, or a phrase you wrote" />
        </label>
        <label>
          Skill
          <select value={skill} onChange={(event) => setSkill(event.target.value)}>
            <option value="all">All skills</option>
            {skills.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>
        {groups.length ? (
          groups.map((group) => (
            <section key={group.skillName} className="sf-notes-group">
              <h2>{group.skillName}</h2>
              {group.stages.map((stage) => (
                <div key={stage.stageId}>
                  <h3>{stage.stageTitle}</h3>
                  <ul>
                    {stage.notes.map((note) => (
                      <li key={note.id}>
                        <button type="button" aria-current={selected?.id === note.id ? "true" : undefined} onClick={() => openNote(note.id)}>
                          <strong>{note.concept}</strong>
                          <span>{note.updatedLabel}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </section>
          ))
        ) : (
          <EmptyState compact icon="notebook-pen" title="No notes match" description="Try another skill, or clear the search." />
        )}
      </aside>
      <article className="sf-notes-reader">
        {selected ? (
          <>
            <button type="button" className="sf-notes-back" onClick={() => setReading(false)}>
              All notes
            </button>
            <p className="sf-explain-kicker">
              {selected.skillName} · {selected.stageTitle}
            </p>
            <h2>{selected.concept}</h2>
            <p className="sf-notes-when">{selected.updatedLabel}</p>
            <section className="sf-notes-block">
              <h3>What you wrote</h3>
              <p>{selected.explanation}</p>
            </section>
            <section className="sf-explain-review is-pass">
              <h3 className="sf-explain-kicker">Review</h3>
              <p>{selected.review}</p>
            </section>
            <Link className="sf-notes-textlink" href={`/milestone/${selected.stageId}`}>
              Open this stage
            </Link>
          </>
        ) : (
          <EmptyState compact icon="notebook-pen" title="No notes match" description="Try another skill, or clear the search." />
        )}
      </article>
    </div>
  );
}
