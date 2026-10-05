import { auth } from "@/lib/auth";
import { notesToDocx, notesToPdf } from "@/lib/explain/export-notes";
import { listLearnerNotes } from "@/lib/explain/notes";

export async function GET(request: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return new Response("Sign in to download notes.", { status: 401 });

  const format = new URL(request.url).searchParams.get("format");
  const notes = await listLearnerNotes(userId);
  if (format === "pdf") {
    const bytes = await notesToPdf(notes);
    return new Response(Buffer.from(bytes), {
      headers: {
        "content-type": "application/pdf",
        "content-disposition": 'attachment; filename="skillflow-notes.pdf"',
      },
    });
  }
  if (format === "docx") {
    const bytes = await notesToDocx(notes);
    return new Response(new Uint8Array(bytes), {
      headers: {
        "content-type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "content-disposition": 'attachment; filename="skillflow-notes.docx"',
      },
    });
  }
  return new Response("Choose a Word or PDF download.", { status: 400 });
}
