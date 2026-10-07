"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/core/Button.jsx";
import { answerPostQuestionAction, askPostQuestionAction } from "../actions";

export type PostQuestion = {
  id: string;
  body: string;
  answer: string | null;
  author: { id: string; name: string | null };
};

export function PostQuestions({
  contributionId,
  isAuthor,
  canAsk,
  questions,
}: {
  contributionId: string;
  isAuthor: boolean;
  canAsk: boolean;
  questions: PostQuestion[];
}) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  async function ask(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setNotice("");
    const saved = await askPostQuestionAction(contributionId, body);
    setBusy(false);
    if (!saved.ok) {
      setNotice(saved.error);
      return;
    }
    setBody("");
    router.refresh();
  }

  async function reply(questionId: string) {
    if (busy) return;
    setBusy(true);
    setNotice("");
    const saved = await answerPostQuestionAction(questionId, drafts[questionId] ?? "");
    setBusy(false);
    if (!saved.ok) {
      setNotice(saved.error);
      return;
    }
    router.refresh();
  }

  return (
    <section className="sf-post-questions" aria-labelledby="post-questions">
      <h2 id="post-questions">Questions</h2>
      {questions.length === 0 ? <p>No questions yet.</p> : null}
      {questions.map((question) => (
        <article key={question.id}>
          <p>
            <strong>{question.author.name ?? "Learner"}</strong>
          </p>
          <p>{question.body}</p>
          {question.answer ? (
            <p className="sf-note-summary">{question.answer}</p>
          ) : isAuthor ? (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                void reply(question.id);
              }}
            >
              <label>
                Your answer
                <textarea
                  rows={3}
                  maxLength={1000}
                  value={drafts[question.id] ?? ""}
                  onChange={(event) => setDrafts((current) => ({ ...current, [question.id]: event.target.value }))}
                  required
                />
              </label>
              <Button type="submit" size="sm" disabled={busy}>
                {busy ? "Saving" : "Answer"}
              </Button>
            </form>
          ) : (
            <p className="sf-os-hint">Waiting on the author.</p>
          )}
        </article>
      ))}
      {canAsk ? (
        <form onSubmit={ask}>
          <label>
            Ask the author
            <textarea rows={3} maxLength={500} value={body} onChange={(event) => setBody(event.target.value)} required placeholder="A doubt about this contribution" />
          </label>
          <Button type="submit" size="sm" variant="outline" disabled={busy}>
            {busy ? "Sending" : "Ask"}
          </Button>
        </form>
      ) : null}
      {notice ? (
        <p className="sf-auth-error" role="alert">
          {notice}
        </p>
      ) : null}
    </section>
  );
}
