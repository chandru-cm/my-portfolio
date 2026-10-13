import type { Embedder, Match, VectorStore } from "./types";

export type RetrieveOptions = {
  topK?: number;
  /** Minimum cosine similarity for a match to be used as context. */
  threshold?: number;
};

export type Retrieval = {
  /** Top matches regardless of score, kept for tracing and evaluation. */
  matches: Match[];
  /** Matches at or above the threshold: the only text allowed into a prompt. */
  context: Match[];
  best: number;
  /** False means the question is outside the knowledge base: do not call the model. */
  answerable: boolean;
};

export const DEFAULT_TOP_K = 4;
/**
 * With Gemini embeddings, off-topic questions scored about 0.52 and the weakest genuine
 * answer about 0.68, so 0.60 sits in the gap. Re-check with `npm run eval -- --gemini`
 * after changing the content or the embedding model.
 */
export const DEFAULT_THRESHOLD = 0.6;

export async function retrieve(
  question: string,
  embedder: Embedder,
  store: VectorStore,
  options: RetrieveOptions = {}
): Promise<Retrieval> {
  const topK = options.topK ?? DEFAULT_TOP_K;
  const threshold = options.threshold ?? DEFAULT_THRESHOLD;
  if (!question.trim()) throw new Error("retrieve() needs a non-empty question");

  const [vector] = await embedder.embed([question], "query");
  const matches = await store.query(vector, topK);
  const context = matches.filter((m) => m.score >= threshold);
  const best = matches[0]?.score ?? 0;
  return { matches, context, best, answerable: context.length > 0 };
}
