import { GoogleGenAI } from "@google/genai";
import { isTransientHttpError, withRetry } from "../retry";
import { normalize } from "../similarity";
import type { Embedder, EmbedTask } from "../types";

export type GeminiEmbedderOptions = {
  apiKey: string;
  model?: string;
  /** Must match the Pinecone index dimension. 768 is Google's recommended size for most uses. */
  dimensions?: number;
  batchSize?: number;
  retries?: number;
};

export const DEFAULT_EMBEDDING_MODEL = "gemini-embedding-001";

export class GeminiEmbedder implements Embedder {
  readonly dimensions: number;
  private readonly ai: GoogleGenAI;
  private readonly model: string;
  private readonly batchSize: number;
  private readonly retries: number;

  constructor(options: GeminiEmbedderOptions) {
    if (!options.apiKey) throw new Error("GEMINI_API_KEY is required");
    this.ai = new GoogleGenAI({ apiKey: options.apiKey });
    this.model = options.model ?? DEFAULT_EMBEDDING_MODEL;
    this.dimensions = options.dimensions ?? 768;
    this.batchSize = options.batchSize ?? 16;
    this.retries = options.retries ?? 4;
  }

  async embed(texts: string[], task: EmbedTask): Promise<number[][]> {
    const out: number[][] = [];
    for (let i = 0; i < texts.length; i += this.batchSize) {
      const batch = texts.slice(i, i + this.batchSize);
      const res = await withRetry(
        () =>
          this.ai.models.embedContent({
            model: this.model,
            contents: batch,
            config: {
              taskType: task === "query" ? "RETRIEVAL_QUERY" : "RETRIEVAL_DOCUMENT",
              outputDimensionality: this.dimensions,
            },
          }),
        { retries: this.retries, isRetryable: isTransientHttpError }
      );
      const vectors = res.embeddings ?? [];
      if (vectors.length !== batch.length) {
        throw new Error(`Expected ${batch.length} embeddings, received ${vectors.length}`);
      }
      // Embeddings smaller than the full model size are not unit length, so normalise them.
      for (const e of vectors) out.push(normalize(e.values ?? []));
    }
    return out;
  }
}
