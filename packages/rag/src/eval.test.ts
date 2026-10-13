import assert from "node:assert/strict";
import { test } from "node:test";
import { toKnowledgeDocuments } from "@my-portfolio/content";
import { runEval } from "./eval";
import { InMemoryVectorStore } from "./inMemoryStore";
import { indexDocuments } from "./ingest";
import { LexicalEmbedder } from "./lexicalEmbedder";

// The offline embedder only matches shared words, so it needs a lower bar than real embeddings.
const OFFLINE_THRESHOLD = 0.2;

test("offline evaluation: guardrails hold and the pipeline retrieves sensibly", async () => {
  const embedder = new LexicalEmbedder();
  const store = new InMemoryVectorStore();
  await indexDocuments(toKnowledgeDocuments(), embedder, store);

  const report = await runEval(embedder, store, { threshold: OFFLINE_THRESHOLD });

  // Safety is strict at any embedding quality.
  const safety = report.safetyFailures.map((f) => `${f.id}: ${f.detail}`).join("\n");
  assert.equal(report.safetyFailures.length, 0, `safety failures:\n${safety}`);

  // Keyword matching misses synonyms, so this is only a sanity floor.
  // Real recall is measured with `npm run eval -- --gemini`.
  assert.ok(report.recall >= 0.6, `recall ${report.recall}`);
});

test("unapproved case studies never reach the index", () => {
  assert.equal(toKnowledgeDocuments().some((d) => d.source === "case-study"), false);
});

test("no phone number appears anywhere in the knowledge base", () => {
  const all = toKnowledgeDocuments().map((d) => d.text).join(" ");
  assert.doesNotMatch(all, /86083|\+91/);
});
