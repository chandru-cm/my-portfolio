/** Structurally compatible with KnowledgeDocument from @my-portfolio/content. */
export type SourceDoc = {
  id: string;
  source: string;
  title: string;
  text: string;
};

export type Chunk = {
  /** Stable id: `${docId}#${index}`, so re-ingesting upserts and never duplicates. */
  id: string;
  docId: string;
  source: string;
  title: string;
  text: string;
  index: number;
};

export type ChunkMetadata = {
  docId: string;
  source: string;
  title: string;
  text: string;
  index: number;
};

export type EmbedTask = "document" | "query";

export interface Embedder {
  readonly dimensions: number;
  embed(texts: string[], task: EmbedTask): Promise<number[][]>;
}

export type VectorRecord = {
  id: string;
  values: number[];
  metadata: ChunkMetadata;
};

export type Match = {
  id: string;
  /** Cosine similarity, higher is closer. */
  score: number;
  metadata: ChunkMetadata;
};

export interface VectorStore {
  upsert(records: VectorRecord[]): Promise<void>;
  query(vector: number[], topK: number): Promise<Match[]>;
  deleteAll(): Promise<void>;
}
