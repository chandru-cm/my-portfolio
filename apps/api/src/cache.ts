export type CachedAnswer = { text: string; sources: string[] };

/**
 * Remembers recent model answers so the questions visitors ask most (the suggested ones) are
 * answered once and then replayed. That saves free-tier Gemini quota and answers instantly.
 * It lives in memory on one server instance, so it is a best-effort saving and never a requirement.
 */
export class AnswerCache {
  private readonly items = new Map<string, { value: CachedAnswer; expires: number }>();

  constructor(
    private readonly ttlMs = 6 * 60 * 60 * 1000,
    private readonly maxItems = 200,
    private readonly now: () => number = Date.now
  ) {}

  /** Case, spacing and trailing punctuation do not make a different question. */
  static key(question: string): string {
    return question.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, "").replace(/\s+/g, " ").trim();
  }

  get(question: string): CachedAnswer | undefined {
    const key = AnswerCache.key(question);
    const hit = this.items.get(key);
    if (!hit) return undefined;
    if (hit.expires <= this.now()) {
      this.items.delete(key);
      return undefined;
    }
    return hit.value;
  }

  set(question: string, value: CachedAnswer): void {
    const key = AnswerCache.key(question);
    if (!key || !value.text) return;
    this.items.delete(key);
    this.items.set(key, { value, expires: this.now() + this.ttlMs });
    while (this.items.size > this.maxItems) this.items.delete(this.items.keys().next().value as string);
  }
}
