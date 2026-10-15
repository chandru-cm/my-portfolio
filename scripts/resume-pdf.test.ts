import assert from "node:assert/strict";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { toResume } from "@my-portfolio/content";
import { renderResumePdf } from "./resume-pdf";

async function render() {
  const file = join(mkdtempSync(join(tmpdir(), "resume-")), "resume.pdf");
  const { pages } = await renderResumePdf(toResume(), file);
  return { pages, bytes: readFileSync(file).toString("latin1") };
}

test("a real font is embedded, so the PDF does not depend on the viewer's fonts", async () => {
  const { bytes } = await render();
  assert.ok(bytes.startsWith("%PDF"));
  assert.match(bytes, /\/BaseFont \/[A-Z]{6}\+IBMPlexSans/, "an IBM Plex Sans subset must be embedded");
  assert.doesNotMatch(bytes, /\/BaseFont \/Helvetica/, "the unembedded built-in font must not be used");
  assert.match(bytes, /\/FontFile/, "the font program itself must be in the file");
});

test("fits on one page", async () => {
  assert.equal((await render()).pages, 1);
});

test("every URL is its own clickable link", async () => {
  const { bytes } = await render();
  const r = toResume();
  const expected = r.contact.filter((c) => c.startsWith("https://")).length + r.projects.reduce((n, p) => n + p.links.length, 0);
  const actual = (bytes.match(/\/Subtype \/Link/g) ?? []).length;
  assert.equal(actual, expected, "one link annotation per URL");
});
