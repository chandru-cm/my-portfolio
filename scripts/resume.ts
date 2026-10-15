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
import { existsSync, mkdirSync, readFileSync, renameSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { PRODUCER, renderResumePdf } from "./resume-pdf";

const out = resolve("apps/portfolio/public/Chandra_Moorthy_Resume.pdf");
const backup = resolve(".private/Chandra_Moorthy_Resume.with-phone.pdf");

if (existsSync(out) && !readFileSync(out).includes(PRODUCER) && !existsSync(backup)) {
  mkdirSync(dirname(backup), { recursive: true });
  renameSync(out, backup);
  console.log("Moved your existing PDF to .private/ (git-ignored, never published).");
}

const { pages } = await renderResumePdf(toResume(), out);
console.log(`Wrote ${out}  (${pages} page${pages === 1 ? "" : "s"})`);
if (pages > 2) {
  console.error("The resume runs over two pages. Shorten the content.");
  process.exit(1);
}
