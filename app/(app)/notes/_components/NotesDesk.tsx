"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/core/Button.jsx";
import { EmptyState } from "@/components/feedback/EmptyState.jsx";

export type DeskNote = {
  id: string;
  skillName: string;
  stageTitle: string;
  title: string;
  body: string;
};

export function NotesDesk({ notes }: { notes: DeskNote[] }) {
  const [query, setQuery] = useState("");
  const [skill, setSkill] = useState("all");
  const [items, setItems] = useState(notes);
  const [selectedId, setSelectedId] = useState(notes[0]?.id ?? "");
  const [pending, setPending] = useState(false);
  const [summary, setSummary] = useState("");
  const [notice, setNotice] = useState("");
  const skills = [...new Set(notes.map((note) => note.skillName))];
  const visible = useMemo(
    () => items.filter((note) => (skill === "all" || note.skillName === skill) && `${note.title} ${note.body}`.toLowerCase().includes(query.trim().toLowerCase())),
    [items, skill, query],
  );
  const selected = visible.find((note) => note.id === selectedId) ?? visible[0] ?? null;

  function updateBody(body: string) {
    if (!selected) return;
    setItems((current) => current.map((note) => (note.id === selected.id ? { ...note, body } : note)));
  }

  async function summarize() {
    if (!selected) return;
    setPending(true);
    setSummary("");
    await new Promise((resolve) => setTimeout(resolve, 600));
    setPending(false);
    setSummary(`A short restatement: ${selected.body.split(".").slice(0, 2).join(".").trim()}.`);
  }

  return (
    <div className="sf-notes">
      <div className="sf-notes-list">
        <label>
          Search notes
          <input value={query} onChange={(event) => setQuery(event.target.value)} />
        </label>
        <label>
          Skill
          <select value={skill} onChange={(event) => setSkill(event.target.value)}>
            <option value="all">All skills</option>
            {skills.map((name) => <option key={name} value={name}>{name}</option>)}
          </select>
        </label>
        {visible.length ? (
          <ul>
            {visible.map((note) => (
              <li key={note.id}>
                <button type="button" aria-current={selected?.id === note.id ? "true" : undefined} onClick={() => { setSelectedId(note.id); setSummary(""); }}>
                  <strong>{note.title}</strong>
                  <span>{note.skillName} · {note.stageTitle}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState compact icon="notebook-pen" title="No notes match" description="Try another skill or clear the search." />
        )}
      </div>
      <div className="sf-notes-editor">
        {selected ? (
          <>
            <h2>{selected.title}</h2>
            <p>{selected.skillName} · {selected.stageTitle}</p>
            <label>
              Note
              <textarea value={selected.body} rows={8} onChange={(event) => updateBody(event.target.value)} />
            </label>
            <div>
              <Button type="button" variant="outline" disabled={pending} onClick={() => void summarize()}>{pending ? "Summarizing..." : "Summarize with AI"}</Button>
              <Button type="button" variant="ghost" onClick={() => setNotice("A Markdown export would download here.")}>Export Markdown</Button>
              <Button type="button" variant="ghost" onClick={() => setNotice("A PDF export would download here.")}>Export PDF</Button>
            </div>
            {summary ? <p role="status">{summary}</p> : null}
            {notice ? <p role="status">{notice}</p> : null}
          </>
        ) : (
          <EmptyState compact icon="notebook-pen" title="Nothing to edit" description="Notes you write on a lesson will land in this list." />
        )}
      </div>
    </div>
  );
}
