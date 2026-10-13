/**
 * Checks retrieval quality and guardrails against the evaluation set.
 *
 *   npm run eval                    offline: lexical embedder, no keys, runs anywhere (CI)
 *   npm run eval -- --gemini        real Gemini embeddings, indexed in memory (needs GEMINI_API_KEY)
 *
 * Exits non-zero if any case fails.
 */
import { toKnowledgeDocuments } from "@my-portfolio/content";
import {
  DEFAULT_THRESHOLD,
  GeminiEmbedder,
  InMemoryVectorStore,
  indexDocuments,
  LexicalEmbedder,
  runEval,
  type Embedder,
} from "@my-portfolio/rag";

const useGemini = process.argv.includes("--gemini");

let embedder: Embedder;
let threshold: number;
if (useGemini) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("Missing GEMINI_API_KEY. Copy .env.example to .env and fill it in.");
    process.exit(1);
  }
  embedder = new GeminiEmbedder({ apiKey, model: process.env.GEMINI_EMBEDDING_MODEL || undefined, dimensions: Number(process.env.EMBEDDING_DIMENSIONS ?? 768) });
  threshold = Number(process.env.RETRIEVAL_THRESHOLD ?? DEFAULT_THRESHOLD);
} else {
  embedder = new LexicalEmbedder();
  threshold = Number(process.env.RETRIEVAL_THRESHOLD ?? 0.2);
}

const store = new InMemoryVectorStore();
await indexDocuments(toKnowledgeDocuments(), embedder, store);
const report = await runEval(embedder, store, { threshold });

console.log(`Mode: ${useGemini ? "gemini" : "offline"}   threshold: ${threshold}`);
for (const r of report.results) console.log(`${r.passed ? "PASS" : "FAIL"}  ${r.id.padEnd(24)} ${r.detail}`);
console.log(`\n${report.passed}/${report.total} passed, recall ${(report.recall * 100).toFixed(0)}%, safety failures ${report.safetyFailures.length}`);

// Offline keyword matching cannot judge recall, so only safety gates there.
// With real embeddings (--gemini) every case must pass.
const failed = useGemini ? report.failures.length : report.safetyFailures.length;
if (!useGemini && report.failures.length) {
  console.log("Offline recall misses are expected. Run with --gemini for the real recall check.");
}
process.exit(failed ? 1 : 0);
