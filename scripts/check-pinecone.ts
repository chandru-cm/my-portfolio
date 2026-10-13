/**
 * Verifies the Pinecone setup using your own .env, without printing any secret.
 *
 *   npm run check:pinecone
 *
 * Confirms the index exists, is ready, matches the embedding dimension and metric,
 * and shows how many records each namespace holds.
 */
import { Pinecone } from "@pinecone-database/pinecone";

const apiKey = process.env.PINECONE_API_KEY;
const name = process.env.PINECONE_INDEX;
const namespace = process.env.PINECONE_NAMESPACE || "portfolio";
const wantDims = Number(process.env.EMBEDDING_DIMENSIONS ?? 768);

if (!apiKey || !name) {
  console.error("Set PINECONE_API_KEY and PINECONE_INDEX in .env first (see .env.example).");
  process.exit(1);
}
if (/^https?:\/\//i.test(name) || name.includes(".")) {
  console.error(`PINECONE_INDEX must be the index name (for example "portfolio"), not a URL. Got "${name}".`);
  process.exit(1);
}

const pc = new Pinecone({ apiKey });
let problems = 0;

try {
  const info = await pc.describeIndex(name);
  console.log(`Index        ${info.name}`);
  console.log(`Host         ${info.host}`);
  console.log(`Dimension    ${info.dimension}${info.dimension === wantDims ? "  OK" : `  MISMATCH (expected ${wantDims})`}`);
  console.log(`Metric       ${info.metric}${info.metric === "cosine" ? "  OK" : "  MISMATCH (expected cosine)"}`);
  console.log(`Ready        ${info.status?.ready ? "yes" : `no (${info.status?.state})`}`);
  if (info.dimension !== wantDims) problems++;
  if (info.metric !== "cosine") problems++;
  if (!info.status?.ready) problems++;

  const stats = await pc.index(name).describeIndexStats();
  const spaces = Object.entries(stats.namespaces ?? {});
  console.log(`Records      ${stats.totalRecordCount ?? 0} total`);
  for (const [ns, s] of spaces) console.log(`  namespace "${ns}": ${s.recordCount}`);
  if (!spaces.some(([ns]) => ns === namespace)) {
    console.log(`  (no "${namespace}" namespace yet: run npm run ingest -- --reset)`);
  }
} catch (error) {
  const status = (error as { name?: string }).name ?? "Error";
  console.error(`Pinecone check failed: ${status}. ${(error as Error).message.split("\n")[0]}`);
  console.error("Common causes: wrong index name, wrong API key, or a key from a different project.");
  process.exit(1);
}

process.exit(problems ? 1 : 0);
