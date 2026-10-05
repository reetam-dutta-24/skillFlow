"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { EmptyState } from "@/components/feedback/EmptyState.jsx";
import { arrangeNotes, type LearnerNoteView } from "@/lib/explain/notes-view";
import { summarizeStage } from "../actions";

export function NotesDesk({ notes }: { notes: LearnerNoteView[] }) {
  const [query, setQuery] = useState("");
  const [skillName, setSkillName] = useState("");
  const [stageId, setStageId] = useState(notes[0]?.stageId ?? "");
  const [summary, setSummary] = useState<{ stageId: string; text: string } | null>(null);
  const [summaryNote, setSummaryNote] = useState("");
  const [summarizing, setSummarizing] = useState(false);
  const groups = useMemo(() => arrangeNotes(notes), [notes]);
  const skillNames = groups.map((group) => group.skillName);
  const activeSkill = groups.find((group) => group.skillName === skillName) ?? groups[0] ?? null;

  const needle = query.trim().toLowerCase();
  const chapters = useMemo(() => {
    if (!activeSkill) return [];
    return activeSkill.stages
      .map((stage) => ({
        ...stage,
        notes: needle
          ? stage.notes.filter((note) => `${note.concept} ${note.explanation} ${note.review} ${stage.stageTitle}`.toLowerCase().includes(needle))
          : stage.notes,
      }))
      .filter((stage) => stage.notes.length > 0);
  }, [activeSkill, needle]);

  const chapterIndex = Math.max(0, chapters.findIndex((stage) => stage.stageId === stageId));
  const chapter = chapters[chapterIndex] ?? null;

  useEffect(() => {
    if (!chapter && chapters[0]) setStageId(chapters[0].stageId);
  }, [chapter, chapters]);

  function chooseSkill(name: string) {
    setSkillName(name);
    const next = groups.find((group) => group.skillName === name);
    setStageId(next?.stages[0]?.stageId ?? "");
    setQuery("");
    setSummary(null);
    setSummaryNote("");
  }

  async function onSummarize() {
    if (!chapter || summarizing) return;
    setSummarizing(true);
    setSummaryNote("");
    const result = await summarizeStage(chapter.stageId);
    setSummarizing(false);
    if (!result.ok) {
      setSummary(null);
      setSummaryNote(
        result.error === "unconnected"
          ? "A model key is needed before this stage can be summarized."
          : "The summary did not come back. Try again.",
      );
      return;
    }
    setSummary({ stageId: chapter.stageId, text: result.summary });
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
    <div className="sf-notebook">
      <div className="sf-notebook-skills" role="tablist" aria-label="Skills">
        {skillNames.map((name) => (
          <button key={name} type="button" role="tab" aria-selected={activeSkill?.skillName === name} onClick={() => chooseSkill(name)}>
            {name}
          </button>
        ))}
      </div>
      <label className="sf-notebook-search">
        Search this skill
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="An idea, or a phrase you wrote" />
      </label>
      {chapters.length === 0 || !chapter ? (
        <EmptyState compact icon="notebook-pen" title="No notes match" description="Try another phrase, or clear the search." />
      ) : (
        <div className="sf-notebook-body">
          <ol className="sf-notebook-chapters" aria-label="Stages">
            {chapters.map((stage, index) => (
              <li key={stage.stageId}>
                <button type="button" aria-current={stage.stageId === chapter.stageId ? "true" : undefined} onClick={() => { setStageId(stage.stageId); setSummary(null); setSummaryNote(""); }}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <strong>{stage.stageTitle}</strong>
                  <em>
                    {stage.notes.length} {stage.notes.length === 1 ? "idea" : "ideas"}
                  </em>
                </button>
              </li>
            ))}
          </ol>
          <article className="sf-notebook-page" aria-labelledby="notebook-stage">
            <header className="sf-notebook-page-head">
              <p>
                Stage {chapterIndex + 1} of {chapters.length}
                <span>
                  {chapter.notes.length} {chapter.notes.length === 1 ? "idea" : "ideas"}
                </span>
              </p>
              <h2 id="notebook-stage">{chapter.stageTitle}</h2>
            </header>
            <div className="sf-notes-actions">
              <button type="button" onClick={onSummarize} disabled={summarizing}>
                {summarizing ? "Summarizing this stage" : "Summarize this stage"}
              </button>
            </div>
            {summary?.stageId === chapter.stageId ? <p className="sf-note-summary">{summary.text}</p> : null}
            {summaryNote ? <p className="sf-note-summary">{summaryNote}</p> : null}
            <nav className="sf-note-jump" aria-label="Ideas in this stage">
              {chapter.notes.map((note, index) => (
                <a key={note.id} href={`#note-${note.id}`}>
                  {index + 1}
                </a>
              ))}
            </nav>
            <div className="sf-note-sheets">
              {chapter.notes.map((note, index) => (
                <section key={note.id} id={`note-${note.id}`} className="sf-note-sheet">
                  <div className="sf-note-title">
                    <p className="sf-note-index">{index + 1}</p>
                    <div>
                      <h3>{note.concept}</h3>
                      <p className="sf-notes-when">{note.updatedLabel}</p>
                    </div>
                  </div>
                  <h4>Your note</h4>
                  <p>{note.explanation}</p>
                  <h4>Review</h4>
                  <blockquote>{note.review}</blockquote>
                </section>
              ))}
            </div>
            <footer className="sf-notebook-turn">
              <button type="button" disabled={chapterIndex === 0} onClick={() => { setStageId(chapters[chapterIndex - 1].stageId); setSummary(null); setSummaryNote(""); }}>
                Previous stage
              </button>
              <Link href={`/milestone/${chapter.stageId}`}>Open this stage</Link>
              <button type="button" disabled={chapterIndex === chapters.length - 1} onClick={() => { setStageId(chapters[chapterIndex + 1].stageId); setSummary(null); setSummaryNote(""); }}>
                Next stage
              </button>
            </footer>
          </article>
        </div>
      )}
    </div>
  );
}
