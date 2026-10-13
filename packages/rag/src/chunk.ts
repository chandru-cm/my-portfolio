import type { Chunk, SourceDoc } from "./types";

export type ChunkOptions = {
  /** Upper bound on characters per chunk. */
  maxChars?: number;
  /** Approximate characters repeated at the start of the next chunk. Must be below maxChars. */
  overlapChars?: number;
};

const DEFAULTS = { maxChars: 900, overlapChars: 120 };

/** Splits on sentence ends, then breaks any single over-long sentence on word boundaries. */
function toPieces(text: string, maxChars: number): string[] {
  const sentences = text.split(/(?<=[.!?])\s+/).filter(Boolean);
  const pieces: string[] = [];
  for (const s of sentences) {
    if (s.length <= maxChars) {
      pieces.push(s);
      continue;
    }
    let line = "";
    for (const word of s.split(/\s+/)) {
      if (word.length > maxChars) {
        if (line) pieces.push(line);
        line = "";
        for (let i = 0; i < word.length; i += maxChars) pieces.push(word.slice(i, i + maxChars));
        continue;
      }
      if (line && line.length + 1 + word.length > maxChars) {
        pieces.push(line);
        line = word;
      } else {
        line = line ? `${line} ${word}` : word;
      }
    }
    if (line) pieces.push(line);
  }
  return pieces;
}

/**
 * Splits one document into overlapping chunks. A document that already fits in
 * maxChars stays a single chunk. Deterministic, so ids are stable across runs.
 */
export function chunkDocument(doc: SourceDoc, options: ChunkOptions = {}): Chunk[] {
  const maxChars = options.maxChars ?? DEFAULTS.maxChars;
  const overlapChars = options.overlapChars ?? DEFAULTS.overlapChars;
  if (maxChars < 1) throw new RangeError("maxChars must be at least 1");
  if (overlapChars < 0 || overlapChars >= maxChars) {
    throw new RangeError("overlapChars must be at least 0 and below maxChars");
  }

  const text = doc.text.trim();
  if (!text) return [];

  const make = (body: string, index: number): Chunk => ({
    id: `${doc.id}#${index}`,
    docId: doc.id,
    source: doc.source,
    title: doc.title,
    text: body,
    index,
  });

  if (text.length <= maxChars) return [make(text, 0)];

  const pieces = toPieces(text, maxChars);
  const chunks: Chunk[] = [];
  let current: string[] = [];
  let length = 0;

  const flush = () => {
    if (current.length) chunks.push(make(current.join(" "), chunks.length));
  };

  for (const piece of pieces) {
    const added = piece.length + (current.length ? 1 : 0);
    if (current.length && length + added > maxChars) {
      flush();
      // Carry trailing pieces as overlap, without letting the next chunk start full.
      const carry: string[] = [];
      let carried = 0;
      for (let i = current.length - 1; i >= 0; i--) {
        const cost = current[i].length + (carry.length ? 1 : 0);
        if (carried + cost > overlapChars || carried + cost + piece.length + 1 > maxChars) break;
        carry.unshift(current[i]);
        carried += cost;
      }
      current = carry;
      length = carried;
    }
    current.push(piece);
    length += piece.length + (current.length > 1 ? 1 : 0);
  }
  flush();
  return chunks;
}

export function chunkDocuments(docs: SourceDoc[], options?: ChunkOptions): Chunk[] {
  return docs.flatMap((d) => chunkDocument(d, options));
}

/** Text that gets embedded: the title gives each chunk context even when split. */
export function embeddingText(chunk: Pick<Chunk, "title" | "text">): string {
  return `${chunk.title}\n${chunk.text}`;
}
