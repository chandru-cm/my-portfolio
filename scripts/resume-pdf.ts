import type { Resume } from "@my-portfolio/content";
import PDFDocument from "pdfkit";
import { createWriteStream } from "node:fs";
import { resolve } from "node:path";

export const PRODUCER = "my-portfolio resume generator";

// IBM Plex Sans (SIL Open Font License) is embedded in the PDF, so it renders identically in every
// viewer, on phones and in applicant-tracking text parsers. The built-in PDF fonts are NOT embedded:
// each viewer swaps in its own, and spacing and accents can come out wrong.
const FONT_DIR = resolve(import.meta.dirname, "../node_modules/@fontsource/ibm-plex-sans/files");
const fontFile = (weight: 400 | 600, style: "normal" | "italic") => resolve(FONT_DIR, `ibm-plex-sans-latin-${weight}-${style}.woff`);

const INK = "#14161C";
const MUTED = "#5B6070";
const ACCENT = "#3340E8";
const RULE = "#D6D6D0";

/** "https://www.linkedin.com/in/x" -> "linkedin.com/in/x", for display. The link keeps the full URL. */
const shown = (url: string) => url.replace(/^https?:\/\/(www\.)?/, "");

export async function renderResumePdf(r: Resume, out: string): Promise<{ pages: number }> {
  const doc = new PDFDocument({
    size: "A4",
    margins: { top: 36, bottom: 30, left: 50, right: 50 },
    bufferPages: true,
    info: { Title: `${r.name} - Resume`, Author: r.name, Producer: PRODUCER },
  });
  doc.registerFont("Regular", fontFile(400, "normal"));
  doc.registerFont("Bold", fontFile(600, "normal"));
  doc.registerFont("Italic", fontFile(400, "italic"));

  const finished = new Promise<void>((done, fail) => {
    const stream = createWriteStream(out);
    stream.on("finish", done);
    stream.on("error", fail);
    doc.pipe(stream);
  });

  const left = doc.page.margins.left;
  const width = doc.page.width - left - doc.page.margins.right;

  const heading = (title: string) => {
    doc.moveDown(0.45);
    doc.font("Bold").fontSize(9.5).fillColor(ACCENT).text(title.toUpperCase(), left, doc.y, { characterSpacing: 0.8 });
    const y = doc.y + 1;
    doc.moveTo(left, y).lineTo(left + width, y).lineWidth(0.5).strokeColor(RULE).stroke();
    doc.moveDown(0.3);
  };

  const bullets = (items: string[]) => {
    doc.font("Regular").fontSize(8.6).fillColor(INK).list(items, left, doc.y, { bulletRadius: 1.3, textIndent: 9, bulletIndent: 2, lineGap: 0.6, width });
  };

  /** Text on the left and text on the right of one line, positioned explicitly (no fragile "continued" text). */
  const row = (leftText: string, leftFont: string, leftSize: number, leftColor: string, rightText: string, rightSize: number) => {
    const y = doc.y;
    doc.font(leftFont).fontSize(leftSize).fillColor(leftColor).text(leftText, left, y, { width, lineBreak: false });
    doc.font("Regular").fontSize(rightSize).fillColor(MUTED).text(rightText, left, y, { width, align: "right", lineBreak: false });
    doc.x = left;
    doc.y = y + Math.max(doc.font(leftFont).fontSize(leftSize).currentLineHeight(), doc.font("Regular").fontSize(rightSize).currentLineHeight());
  };

  /** A row of links, each clickable to its own URL. */
  const links = (urls: string[], size: number, gap = 12) => {
    doc.font("Regular").fontSize(size);
    const y = doc.y;
    let x = left;
    for (const url of urls) {
      const text = shown(url);
      const w = doc.widthOfString(text);
      doc.fillColor(ACCENT).text(text, x, y, { lineBreak: false });
      doc.link(x, y, w, doc.currentLineHeight(), url);
      x += w + gap;
    }
    doc.x = left;
    doc.y = y + doc.currentLineHeight() + 1;
  };

  // Header
  const [email, location, linkedin, github] = r.contact;
  doc.font("Bold").fontSize(22).fillColor(INK).text(r.name, left, doc.y);
  doc.font("Regular").fontSize(10.5).fillColor(MUTED).text(r.headline, left, doc.y);
  doc.moveDown(0.25);
  doc.font("Regular").fontSize(8.9).fillColor(MUTED).text(`${email}   |   ${location}`, left, doc.y);
  links([linkedin, github], 8.9, 14);

  heading("Summary");
  doc.font("Regular").fontSize(8.9).fillColor(INK).text(r.summary, left, doc.y, { lineGap: 1, width });

  heading("Experience");
  for (const e of r.experience) {
    row(`${e.title}, ${e.company}`, "Bold", 10, INK, e.dates, 9);
    doc.font("Regular").fontSize(8.7).fillColor(MUTED).text(e.location, left, doc.y);
    doc.moveDown(0.15);
    bullets(e.bullets);
  }

  heading("Selected projects");
  for (const p of r.projects) {
    row(p.name, "Bold", 9.6, INK, p.type, 8.7);
    doc.font("Italic").fontSize(8.7).fillColor(MUTED).text(`My part: ${p.myPart}`, left, doc.y, { width });
    doc.moveDown(0.12);
    bullets(p.bullets);
    links(p.links, 8.3, 12);
    doc.moveDown(0.2);
  }

  heading("Skills");
  for (const s of r.skills) {
    doc.font("Bold").fontSize(8.9).fillColor(INK).text(`${s.label}: `, left, doc.y, { continued: true, width });
    doc.font("Regular").fillColor(INK).text(s.items.join(", "), { lineGap: 1 });
  }

  heading("Education");
  for (const e of r.education) {
    row(e.degree, "Bold", 9.5, INK, e.dates, 9);
    doc.font("Regular").fontSize(8.9).fillColor(MUTED).text(`${e.school}   ${e.note}`, left, doc.y);
  }

  const pages = doc.bufferedPageRange().count;
  doc.end();
  await finished;
  return { pages };
}
