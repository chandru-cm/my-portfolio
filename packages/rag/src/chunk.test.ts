import assert from "node:assert/strict";
import { test } from "node:test";
import { chunkDocument, embeddingText } from "./chunk";

const doc = (text: string) => ({ id: "d", source: "project", title: "T", text });

test("short document stays one chunk with a stable id", () => {
  const chunks = chunkDocument(doc("One sentence."));
  assert.equal(chunks.length, 1);
  assert.equal(chunks[0].id, "d#0");
  assert.equal(chunks[0].text, "One sentence.");
});

test("empty or whitespace text yields no chunks", () => {
  assert.deepEqual(chunkDocument(doc("   \n ")), []);
});

test("long text splits, respects maxChars, and keeps sequential ids", () => {
  const text = Array.from({ length: 30 }, (_, i) => `Sentence number ${i} is here.`).join(" ");
  const chunks = chunkDocument(doc(text), { maxChars: 120, overlapChars: 30 });
  assert.ok(chunks.length > 1);
  chunks.forEach((c, i) => {
    assert.ok(c.text.length <= 120, `chunk ${i} has ${c.text.length} chars`);
    assert.equal(c.id, `d#${i}`);
  });
});

test("consecutive chunks overlap", () => {
  const text = Array.from({ length: 20 }, (_, i) => `Sentence ${i} ends here.`).join(" ");
  const [a, b] = chunkDocument(doc(text), { maxChars: 100, overlapChars: 40 });
  const tail = a.text.split(". ").pop()!;
  assert.ok(b.text.includes(tail.replace(/\.$/, "")), "second chunk should repeat the end of the first");
});

test("every sentence is covered by at least one chunk", () => {
  const sentences = Array.from({ length: 25 }, (_, i) => `Fact ${i} is true.`);
  const chunks = chunkDocument(doc(sentences.join(" ")), { maxChars: 90, overlapChars: 20 });
  const joined = chunks.map((c) => c.text).join(" ");
  for (const s of sentences) assert.ok(joined.includes(s), `missing: ${s}`);
});

test("a single over-long word is hard split, never an infinite loop", () => {
  const chunks = chunkDocument(doc("x".repeat(500)), { maxChars: 100, overlapChars: 10 });
  assert.equal(chunks.length, 5);
  assert.ok(chunks.every((c) => c.text.length <= 100));
});

test("is deterministic", () => {
  const text = Array.from({ length: 15 }, (_, i) => `Sentence ${i}.`).join(" ");
  assert.deepEqual(chunkDocument(doc(text), { maxChars: 60, overlapChars: 10 }), chunkDocument(doc(text), { maxChars: 60, overlapChars: 10 }));
});

test("rejects invalid options", () => {
  assert.throws(() => chunkDocument(doc("a"), { maxChars: 0 }), RangeError);
  assert.throws(() => chunkDocument(doc("a"), { maxChars: 50, overlapChars: 50 }), RangeError);
});

test("embedding text prefixes the title", () => {
  assert.equal(embeddingText({ title: "RentEasify", text: "Billing." }), "RentEasify\nBilling.");
});
