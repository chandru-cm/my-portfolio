/**
 * Builds the chatbot's knowledge base: content -> chunks -> Gemini embeddings -> Pinecone.
 *
 *   npm run ingest -- --dry-run     show what would be indexed, no network
 *   npm run ingest                  embed and upsert (idempotent)
 *   npm run ingest -- --reset       wipe the namespace first, then re-index
 *
 * Reads GEMINI_API_KEY, PINECONE_API_KEY, PINECONE_INDEX from the environment (.env).
 */
import { toKnowledgeDocuments } from "@my-portfolio/content";
import { chunkDocuments, GeminiEmbedder, indexDocuments, PineconeStore } from "@my-portfolio/rag";

const args = new Set(process.argv.slice(2));
const dryRun = args.has("--dry-run");
const reset = args.has("--reset");

function need(name: string): string {
  const v = process.env[name];
  if (!v) {
    console.error(`Missing ${name}. Copy .env.example to .env and fill it in.`);
    process.exit(1);
  }
  return v;
}

const docs = toKnowledgeDocuments();
const chunks = chunkDocuments(docs);
console.log(`${docs.length} documents -> ${chunks.length} chunks`);

if (dryRun) {
  for (const c of chunks) console.log(`  ${c.id.padEnd(48)} ${String(c.text.length).padStart(4)} chars  ${c.title}`);
  console.log("Dry run: nothing was sent.");
  process.exit(0);
}

const dimensions = Number(process.env.EMBEDDING_DIMENSIONS ?? 768);
const embedder = new GeminiEmbedder({
  apiKey: need("GEMINI_API_KEY"),
  model: process.env.GEMINI_EMBEDDING_MODEL || undefined,
  dimensions,
});
const store = new PineconeStore({
  apiKey: need("PINECONE_API_KEY"),
  indexName: need("PINECONE_INDEX"),
  namespace: process.env.PINECONE_NAMESPACE || "portfolio",
});

const { chunks: count } = await indexDocuments(docs, embedder, store, {
  reset,
  onProgress: (done, total) => console.log(`  embedded and upserted ${done}/${total}`),
});
console.log(`Done: ${count} chunks indexed${reset ? " (namespace reset first)" : ""}.`);
