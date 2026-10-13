import { normalize } from "./similarity";
import type { Embedder, EmbedTask } from "./types";

const STOPWORDS = new Set(
  "a an and are as at be been being by can did do does for from had has have he her his how i in is it its me of on or our she so that the their them they this to was we were what when where which who whom why will with would you your tell about chandra moorthy".split(
    " "
  )
);

/** FNV-1a 32-bit hash. */
function hash(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function tokens(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9.+#]+/)
    .map((t) => t.replace(/^\.+|\.+$/g, ""))
    .filter((t) => t.length > 1 && !STOPWORDS.has(t))
    .map((t) => (t.length > 3 && t.endsWith("s") ? t.slice(0, -1) : t));
}

/**
 * Deterministic bag-of-words embedder using the hashing trick. It needs no network or
 * API key, so tests and CI can exercise the whole retrieval pipeline. It matches on
 * shared words only, so it is a stand-in for real embeddings, not a replacement.
 */
export class LexicalEmbedder implements Embedder {
  constructor(readonly dimensions = 512) {}

  async embed(texts: string[], _task: EmbedTask): Promise<number[][]> {
    return texts.map((text) => {
      const v = new Array<number>(this.dimensions).fill(0);
      for (const t of tokens(text)) {
        const h = hash(t);
        v[h % this.dimensions] += h & 0x80000000 ? -1 : 1;
      }
      return normalize(v);
    });
  }
}
