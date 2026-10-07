"use client";

import { useState } from "react";
import Link from "next/link";
import { WizardCard } from "@/components/forms/WizardCard";
import { reviewPractice } from "../../actions";

type SkillChoice = { id: string; name: string };

const TEXT_FILE = /\.(txt|md|markdown|text)$/i;

export function PracticeForm({ skills }: { skills: SkillChoice[] }) {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [skillId, setSkillId] = useState(skills[0]?.id ?? "");
  const [concept, setConcept] = useState("");
  const [pageUrl, setPageUrl] = useState("");
  const [source, setSource] = useState("");
  const [answer, setAnswer] = useState("");
  const [over, setOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [review, setReview] = useState<{ understood: boolean; text: string; noted: boolean } | null>(null);

  function go(next: number) {
    setDirection(next > step ? 1 : -1);
    setStep(next);
    setNotice("");
  }

  async function takeFiles(files: File[]) {
    const chosen = files.slice(0, 4);
    if (chosen.length === 0) return;
    const chunks: string[] = [];
    for (const file of chosen) {
      const textFile = file.type.startsWith("text/") || TEXT_FILE.test(file.name);
      if (!textFile) {
        setNotice("Drop a text file, such as .txt or .md.");
        return;
      }
      if (file.size > 80_000) {
        setNotice("Each file needs to stay under 80 KB.");
        return;
      }
      chunks.push((await file.text()).trim());
    }
    setNotice("");
    setSource((current) => [current, ...chunks].filter(Boolean).join("\n\n").slice(0, 12_000));
  }

  function continueStep() {
    if (step === 0 && concept.trim().length < 3) {
      setNotice("Name the idea in a few words.");
      return;
    }
    if (step === 1 && !pageUrl.trim() && !source.trim()) {
      setNotice("Add a link or paste the passage.");
      return;
    }
    go(step + 1);
  }

  async function onSubmit() {
    if (busy) return;
    if (concept.trim().length < 3 || !answer.trim() || (!pageUrl.trim() && !source.trim())) {
      setNotice("Add a concept, a link or some text, and your explanation.");
      return;
    }
    setBusy(true);
    setNotice("");
    setReview(null);
    const result = await reviewPractice({ skillId, concept, pageUrl, source, answer });
    setBusy(false);
    if (!result.ok) {
      setNotice(
        result.error === "empty"
          ? "Add a concept, a link or some text, and your explanation."
          : result.error === "unconnected"
            ? "A model key is needed before this idea can be reviewed."
            : result.error === "blocked"
              ? "That link cannot be opened from SkillFlow."
              : result.error === "unreadable"
                ? "That page did not return enough text. Paste the passage, or try another link."
                : "The review did not come back. Try again.",
      );
      return;
    }
    setReview({ understood: result.understood, text: result.review, noted: result.noted });
  }

  if (skills.length === 0) {
    return <p className="sf-note-summary">Practice opens once a niche has stages.</p>;
  }

  const titles = ["Which idea?", "What are you reading?", "Explain it"];

  return (
    <WizardCard
      step={step}
      total={3}
      title={titles[step] ?? "Practice"}
      direction={direction}
      onStep={go}
      onBack={() => go(step - 1)}
      onNext={step === 2 ? () => void onSubmit() : continueStep}
      nextLabel={step === 2 ? "Review this idea" : "Continue"}
      pending={busy}
      error={notice}
    >
      {step === 0 ? (
        <>
          <label>
            Niche
            <select value={skillId} onChange={(event) => setSkillId(event.target.value)}>
              {skills.map((skill) => (
                <option key={skill.id} value={skill.id}>{skill.name}</option>
              ))}
            </select>
          </label>
          <label>
            Concept
            <input value={concept} onChange={(event) => setConcept(event.target.value)} maxLength={200} placeholder="The idea you want to explain" />
          </label>
        </>
      ) : null}
      {step === 1 ? (
        <>
          <label>
            Link
            <input type="url" inputMode="url" value={pageUrl} onChange={(event) => setPageUrl(event.target.value)} maxLength={2000} placeholder="https://…" />
          </label>
          <p className="sf-fill-hint">SkillFlow reads the page and reviews your explanation against that text.</p>
          <label>
            Text, if you already have it
            <textarea
              className={over ? "is-over" : undefined}
              value={source}
              onChange={(event) => setSource(event.target.value)}
              onDragOver={(event) => {
                event.preventDefault();
                setOver(true);
              }}
              onDragLeave={() => setOver(false)}
              onDrop={(event) => {
                event.preventDefault();
                setOver(false);
                void takeFiles([...event.dataTransfer.files]);
              }}
              rows={8}
              placeholder="Drop a .txt or .md file, or paste a passage."
            />
          </label>
          <label>
            Choose text files
            <input
              type="file"
              accept=".txt,.md,.markdown,.text,text/plain,text/markdown"
              multiple
              onChange={(event) => {
                void takeFiles([...(event.target.files ?? [])]);
                event.target.value = "";
              }}
            />
          </label>
        </>
      ) : null}
      {step === 2 ? (
        <>
          <label>
            Your explanation
            <textarea value={answer} onChange={(event) => setAnswer(event.target.value)} rows={6} maxLength={8000} placeholder="Explain the concept in your own words, using only that page or passage." />
          </label>
          {review ? (
            <div className={`sf-explain-review ${review.understood ? "is-pass" : "is-retry"}`}>
              <p>{review.text}</p>
              {review.noted ? <p><Link href="/notes">Saved to Notes</Link></p> : null}
            </div>
          ) : null}
        </>
      ) : null}
    </WizardCard>
  );
}
