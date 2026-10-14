/**
 * Generates a phone-free resume PDF from the same content as the website and the chatbot.
 *
 *   npm run resume
 *
 * Writes apps/portfolio/public/Chandra_Moorthy_Resume.pdf, which the site's download buttons use.
 * An existing PDF that this script did not create (for example your own, with a phone number) is
 * moved to .private/, which git ignores and which is never part of the website, before anything
 * is overwritten.
 */
import { toResume } from "@my-portfolio/content";
import PDFDocument from "pdfkit";
import { createWriteStream, existsSync, mkdirSync, readFileSync, renameSync } from "node:fs";
import { dirname, resolve } from "node:path";

const PRODUCER = "my-portfolio resume generator";
const out = resolve("apps/portfolio/public/Chandra_Moorthy_Resume.pdf");
const backup = resolve(".private/Chandra_Moorthy_Resume.with-phone.pdf");

if (existsSync(out) && !readFileSync(out).includes(PRODUCER) && !existsSync(backup)) {
  mkdirSync(dirname(backup), { recursive: true });
  renameSync(out, backup);
  console.log("Moved your existing PDF to .private/ (git-ignored, never published).");
}

const r = toResume();
const INK = "#14161C";
const MUTED = "#5B6070";
const ACCENT = "#3340E8";

const doc = new PDFDocument({
  size: "A4",
  margins: { top: 44, bottom: 40, left: 50, right: 50 },
  bufferPages: true,
  info: { Title: `${r.name} - Resume`, Author: r.name, Producer: PRODUCER },
});
doc.pipe(createWriteStream(out));

const width = doc.page.width - doc.page.margins.left - doc.page.margins.right;

function heading(title: string) {
  doc.moveDown(0.7);
  doc.font("Helvetica-Bold").fontSize(10).fillColor(ACCENT).text(title.toUpperCase(), { characterSpacing: 0.8 });
  const y = doc.y + 1;
  doc.moveTo(doc.page.margins.left, y).lineTo(doc.page.margins.left + width, y).lineWidth(0.5).strokeColor("#D6D6D0").stroke();
  doc.moveDown(0.35);
}

function bullets(items: string[]) {
  doc.font("Helvetica").fontSize(9.2).fillColor(INK).list(items, { bulletRadius: 1.4, textIndent: 9, bulletIndent: 2, lineGap: 1 });
}

// Header
doc.font("Helvetica-Bold").fontSize(22).fillColor(INK).text(r.name);
doc.font("Helvetica").fontSize(11).fillColor(MUTED).text(r.headline);
doc.moveDown(0.3).fontSize(9);
const [email, location, linkedin, github] = r.contact;
doc.fillColor(MUTED).text(`${email}   |   ${location}`, { continued: false });
doc.fillColor(ACCENT).text(linkedin, { link: linkedin, continued: true }).fillColor(MUTED).text("   |   ", { link: null as never, continued: true });
doc.fillColor(ACCENT).text(github, { link: github });

heading("Summary");
doc.font("Helvetica").fontSize(9.5).fillColor(INK).text(r.summary, { lineGap: 1.5 });

heading("Experience");
for (const e of r.experience) {
  doc.font("Helvetica-Bold").fontSize(10.5).fillColor(INK).text(`${e.title}, ${e.company}`, { continued: true });
  doc.font("Helvetica").fontSize(9.5).fillColor(MUTED).text(`   ${e.dates}`, { align: "right" });
  doc.font("Helvetica").fontSize(9).fillColor(MUTED).text(e.location);
  doc.moveDown(0.2);
  bullets(e.bullets);
}

heading("Selected projects");
for (const p of r.projects) {
  doc.font("Helvetica-Bold").fontSize(10).fillColor(INK).text(p.name, { continued: true });
  doc.font("Helvetica").fontSize(9).fillColor(MUTED).text(`  ${p.type}`);
  doc.font("Helvetica-Oblique").fontSize(9).fillColor(MUTED).text(`My part: ${p.myPart}`);
  doc.moveDown(0.15);
  bullets(p.bullets);
  doc.font("Helvetica").fontSize(8.5).fillColor(ACCENT).text(p.links.join("   "), { link: p.links[0], lineGap: 1 });
  doc.moveDown(0.45);
}

heading("Skills");
for (const s of r.skills) {
  doc.font("Helvetica-Bold").fontSize(9.2).fillColor(INK).text(`${s.label}: `, { continued: true });
  doc.font("Helvetica").fillColor(INK).text(s.items.join(", "), { lineGap: 1.5 });
}

heading("Education");
for (const e of r.education) {
  doc.font("Helvetica-Bold").fontSize(9.8).fillColor(INK).text(e.degree, { continued: true });
  doc.font("Helvetica").fontSize(9.5).fillColor(MUTED).text(`   ${e.dates}`, { align: "right" });
  doc.font("Helvetica").fontSize(9.2).fillColor(MUTED).text(`${e.school}   ${e.note}`);
}

const pages = doc.bufferedPageRange().count;
doc.end();
await new Promise((r2) => setTimeout(r2, 300));
console.log(`Wrote ${out}  (${pages} page${pages === 1 ? "" : "s"})`);
if (pages > 2) {
  console.error("The resume runs over two pages. Shorten the content.");
  process.exit(1);
}
