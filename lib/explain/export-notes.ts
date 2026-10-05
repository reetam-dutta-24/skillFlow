import { Document, HeadingLevel, Packer, Paragraph, TextRun } from "docx";
import { PDFDocument, StandardFonts, type PDFFont } from "pdf-lib";
import { arrangeNotes, type LearnerNoteView } from "@/lib/explain/notes-view";

export type ExportBlock =
  | { kind: "skill" | "stage" | "concept"; text: string }
  | { kind: "label" | "body"; text: string };

/** The notebook, in reading order, as blocks a Word file and a PDF can both draw. */
export function noteExportBlocks(notes: LearnerNoteView[]): ExportBlock[] {
  const blocks: ExportBlock[] = [];
  for (const skill of arrangeNotes(notes)) {
    blocks.push({ kind: "skill", text: skill.skillName });
    for (const stage of skill.stages) {
      blocks.push({ kind: "stage", text: stage.stageTitle });
      for (const note of stage.notes) {
        blocks.push({ kind: "concept", text: note.concept });
        blocks.push({ kind: "label", text: "Your note" });
        blocks.push({ kind: "body", text: note.explanation });
        blocks.push({ kind: "label", text: "Review" });
        blocks.push({ kind: "body", text: note.review });
      }
    }
  }
  return blocks;
}

function paragraphs(blocks: ExportBlock[]) {
  return blocks.map((block) => {
    if (block.kind === "skill") return new Paragraph({ text: block.text, heading: HeadingLevel.HEADING_1 });
    if (block.kind === "stage") return new Paragraph({ text: block.text, heading: HeadingLevel.HEADING_2 });
    if (block.kind === "concept") return new Paragraph({ text: block.text, heading: HeadingLevel.HEADING_3 });
    if (block.kind === "label") return new Paragraph({ children: [new TextRun({ text: block.text, bold: true })] });
    return new Paragraph({ text: block.text });
  });
}

export async function notesToDocx(notes: LearnerNoteView[]): Promise<Buffer> {
  const doc = new Document({
    sections: [{ children: paragraphs(noteExportBlocks(notes)) }],
  });
  return Packer.toBuffer(doc);
}

function pdfText(value: string) {
  return value.replace(/[^\t\n\r\x20-\x7E]/g, (char) => {
    if (char === "\u2014" || char === "\u2013") return "-";
    if (char === "\u2018" || char === "\u2019") return "'";
    if (char === "\u201C" || char === "\u201D") return '"';
    if (char === "\u2026") return "...";
    return "?";
  });
}

function wrap(text: string, width: number) {
  const lines: string[] = [];
  for (const raw of pdfText(text).split("\n")) {
    const words = raw.split(/\s+/).filter(Boolean);
    let line = "";
    for (const word of words) {
      const next = line ? `${line} ${word}` : word;
      if (next.length > width && line) {
        lines.push(line);
        line = word.slice(0, width);
      } else {
        line = next.slice(0, width);
      }
    }
    lines.push(line);
  }
  return lines.length ? lines : [""];
}

export async function notesToPdf(notes: LearnerNoteView[]): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const margin = 48;
  const pageWidth = 612;
  const pageHeight = 792;
  const maxWidth = 78;
  let page = pdf.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;

  function nextPage() {
    page = pdf.addPage([pageWidth, pageHeight]);
    y = pageHeight - margin;
  }

  function draw(text: string, size: number, face: PDFFont, gap: number) {
    for (const line of wrap(text, maxWidth)) {
      if (y < margin + size) nextPage();
      page.drawText(line, { x: margin, y, size, font: face });
      y -= size + 4;
    }
    y -= gap;
  }

  for (const block of noteExportBlocks(notes)) {
    if (block.kind === "skill") draw(block.text, 18, bold, 8);
    else if (block.kind === "stage") draw(block.text, 14, bold, 6);
    else if (block.kind === "concept") draw(block.text, 12, bold, 4);
    else if (block.kind === "label") draw(block.text, 11, bold, 2);
    else draw(block.text, 11, font, 8);
  }

  return pdf.save();
}
