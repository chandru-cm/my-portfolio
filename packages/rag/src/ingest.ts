import { chunkDocuments, embeddingText, type ChunkOptions } from "./chunk";
import type { Embedder, SourceDoc, VectorRecord, VectorStore } from "./types";

export type IndexOptions = {
  chunk?: ChunkOptions;
  batchSize?: number;
  /** Delete everything in the store first, so removed documents do not linger. */
  reset?: boolean;
  onProgress?: (done: number, total: number) => void;
};

/**
 * Chunks, embeds and upserts documents. Chunk ids are stable, so running this twice
 * leaves the store identical: no duplicates.
 */
export async function indexDocuments(
  docs: SourceDoc[],
  embedder: Embedder,
  store: VectorStore,
  options: IndexOptions = {}
): Promise<{ chunks: number }> {
  const { batchSize = 16, reset = false, onProgress } = options;
  const chunks = chunkDocuments(docs, options.chunk);

  if (reset) await store.deleteAll();

  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize);
    const vectors = await embedder.embed(batch.map(embeddingText), "document");
    const records: VectorRecord[] = batch.map((c, j) => ({
      id: c.id,
      values: vectors[j],
      metadata: { docId: c.docId, source: c.source, title: c.title, text: c.text, index: c.index },
    }));
    await store.upsert(records);
    onProgress?.(Math.min(i + batch.length, chunks.length), chunks.length);
  }
  return { chunks: chunks.length };
}
