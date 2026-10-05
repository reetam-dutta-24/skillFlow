import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { listLearnerNotes } from "@/lib/explain/notes";
import { NotesDesk } from "./_components/NotesDesk";

export const metadata: Metadata = { title: "Notes" };

export default async function NotesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const notes = await listLearnerNotes(session.user.id);
  return (
    <div className="sf-notes-page">
      <header className="sf-page-head">
        <h1>Notes</h1>
        <p>Read a stage the way you would a notebook. Each idea keeps what you wrote, then the review that came back. A stage summary uses only those notes.</p>
        {notes.length ? (
          <p className="sf-notes-actions">
            <a href="/notes/export?format=docx">Download Word</a>
            <a href="/notes/export?format=pdf">Download PDF</a>
          </p>
        ) : null}
      </header>
      <NotesDesk notes={notes} />
    </div>
  );
}
