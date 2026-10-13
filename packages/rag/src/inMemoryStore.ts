import { cosine } from "./similarity";
import type { Match, VectorRecord, VectorStore } from "./types";

/**
 * Exact nearest-neighbour search in memory. O(n * d) per query, which is trivial for a
 * knowledge base of a few hundred chunks. Used for tests and offline evaluation.
 */
export class InMemoryVectorStore implements VectorStore {
  private readonly records = new Map<string, VectorRecord>();

  async upsert(records: VectorRecord[]): Promise<void> {
    for (const r of records) this.records.set(r.id, r);
  }

  async query(vector: number[], topK: number): Promise<Match[]> {
    if (topK < 1) return [];
    const scored: Match[] = [];
    for (const r of this.records.values()) {
      scored.push({ id: r.id, score: cosine(vector, r.values), metadata: r.metadata });
    }
    // Ties break on id so results are deterministic.
    scored.sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
    return scored.slice(0, topK);
  }

  async deleteAll(): Promise<void> {
    this.records.clear();
  }

  get size(): number {
    return this.records.size;
  }
}
