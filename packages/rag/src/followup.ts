import type { Turn } from "./prompt";

const REFERS_BACK = /\b(it|that|this|those|these|they|them|its|their|more|also|else|first|second|third|last|other|another|same|above|earlier)\b/i;
const MAX_QUERY_CHARS = 400;

export type SearchQuery = {
  text: string;
  /** True when the previous question was added, so the match is less certain. */
  followUp: boolean;
};

/**
 * What to search the knowledge base for. A follow-up such as "tell me more" or "what stack did
 * that use?" has no subject of its own, so the previous question is searched with it. A question
 * that stands alone is searched as written.
 */
export function searchQuery(question: string, history: Turn[] = []): SearchQuery {
  const previous = [...history].reverse().find((t) => t.role === "user")?.text;
  const words = question.trim().split(/\s+/).length;
  if (previous && (words <= 5 || REFERS_BACK.test(question))) {
    return { text: `${previous} ${question}`.slice(0, MAX_QUERY_CHARS), followUp: true };
  }
  return { text: question, followUp: false };
}
