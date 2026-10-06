import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

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
    if (words.length === 0) {
      lines.push("");
      continue;
    }
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
  return lines.length > 0 ? lines : [""];
}

/** A plain SkillFlow record. Framed pages are the certificate. */
export async function linesToPdf(lines: string[], framed = false): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const margin = framed ? 72 : 48;
  const pageWidth = 612;
  const pageHeight = 792;
  const size = 12;
  const leading = 16;
  let page = pdf.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;

  const nextPage = () => {
    page = pdf.addPage([pageWidth, pageHeight]);
    y = pageHeight - margin;
    if (framed) drawFrame(page, pageWidth, pageHeight);
  };

  if (framed) drawFrame(page, pageWidth, pageHeight);

  for (const [index, block] of lines.entries()) {
    const chosen = index === 0 ? bold : font;
    for (const line of wrap(block, framed ? 70 : 80)) {
      if (y < margin) nextPage();
      page.drawText(line, { x: margin, y, size, font: chosen, color: rgb(0.1, 0.1, 0.12) });
      y -= leading;
    }
    y -= 6;
  }
  return pdf.save();
}

function drawFrame(page: ReturnType<PDFDocument["addPage"]>, width: number, height: number) {
  page.drawRectangle({
    x: 36,
    y: 36,
    width: width - 72,
    height: height - 72,
    borderColor: rgb(0.15, 0.15, 0.18),
    borderWidth: 1.5,
  });
}
