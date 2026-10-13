import { Pinecone } from "@pinecone-database/pinecone";
import type { ChunkMetadata, Match, VectorRecord, VectorStore } from "../types";

export type PineconeStoreOptions = {
  apiKey: string;
  /** Name of an existing serverless index: cosine metric, dimension equal to the embedder's. */
  indexName: string;
  namespace?: string;
  /** Optional index host (from the console). Skips a lookup on every cold start. */
  host?: string;
};

const UPSERT_BATCH = 100;

export class PineconeStore implements VectorStore {
  private readonly index;

  constructor(options: PineconeStoreOptions) {
    if (!options.apiKey) throw new Error("PINECONE_API_KEY is required");
    if (!options.indexName) throw new Error("PINECONE_INDEX is required");
    if (/^https?:\/\//i.test(options.indexName) || options.indexName.includes(".")) {
      throw new Error(
        `PINECONE_INDEX must be the index name (for example "portfolio"), not its host URL. Got "${options.indexName}".`
      );
    }
    this.index = new Pinecone({ apiKey: options.apiKey }).index(options.indexName, options.host || undefined).namespace(options.namespace ?? "portfolio");
  }

  async upsert(records: VectorRecord[]): Promise<void> {
    for (let i = 0; i < records.length; i += UPSERT_BATCH) {
      const batch = records.slice(i, i + UPSERT_BATCH).map((r) => ({
        id: r.id,
        values: r.values,
        metadata: { ...r.metadata },
      }));
      await this.index.upsert({ records: batch });
    }
  }

  async query(vector: number[], topK: number): Promise<Match[]> {
    const res = await this.index.query({ vector, topK, includeMetadata: true });
    return (res.matches ?? []).map((m) => ({
      id: m.id,
      score: m.score ?? 0,
      metadata: m.metadata as unknown as ChunkMetadata,
    }));
  }

  async deleteAll(): Promise<void> {
    await this.index.deleteAll();
  }
}
