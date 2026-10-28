import assert from "node:assert/strict";
import { test } from "node:test";
import { suggestionPool } from "@my-portfolio/content";
import { retrieve } from "@my-portfolio/rag";
import { makeDeps } from "./testkit";

// Every suggested question must find matching content, otherwise a visitor spends one of their few questions
// on a suggestion that ends in "I don't have that information". This uses the offline matcher, which is
// stricter than Gemini embeddings about wording, so a pass here is a safe floor.
test("every suggested question finds approved content to answer from", async () => {
  const deps = await makeDeps();
  const weak: string[] = [];
  for (const { text } of suggestionPool) {
    const r = await retrieve(text, deps.embedder, deps.store, { topK: deps.config.topK, threshold: deps.config.threshold });
    if (!r.answerable) weak.push(`${text} (best ${r.best.toFixed(2)})`);
  }
  assert.deepEqual(weak, [], `these suggestions would not be answerable:\n${weak.join("\n")}`);
});

test("the pool has no duplicates and enough variety to rotate", () => {
  const texts = suggestionPool.map((s) => s.text.toLowerCase());
  assert.equal(new Set(texts).size, texts.length);
  assert.ok(suggestionPool.filter((s) => s.group === "hiring").length >= 3);
  assert.ok(suggestionPool.filter((s) => s.group === "project").length >= 6);
});
