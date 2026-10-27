import assert from "node:assert/strict";
import { test } from "node:test";
import { EmailScrubber, scrubEmails } from "./scrub";

const REAL = "chandramoorthy.dev@gmail.com";

test("the real address is kept and any other address is replaced with it", () => {
  assert.equal(scrubEmails(`Email ${REAL}.`, REAL), `Email ${REAL}.`);
  assert.equal(scrubEmails("Email chandramoorthy.se@gmail.com for more.", REAL), `Email ${REAL} for more.`);
  assert.equal(scrubEmails("no address here", REAL), "no address here");
});

test("an address split across streamed fragments is still caught", () => {
  const s = new EmailScrubber(REAL);
  const out = ["Write to chandramoorthy.se@gma", "il.com or call", " later."].map((f) => s.push(f)).join("") + s.flush();
  assert.equal(out, `Write to ${REAL} or call later.`);
});

test("streamed text without addresses comes out unchanged", () => {
  const s = new EmailScrubber(REAL);
  const parts = ["Chandra ", "Moorthy builds ", "SaaS."];
  assert.equal(parts.map((p) => s.push(p)).join("") + s.flush(), "Chandra Moorthy builds SaaS.");
});
