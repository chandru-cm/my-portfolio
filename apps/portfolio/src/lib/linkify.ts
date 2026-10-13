export type Segment = { type: "text" | "url" | "email"; value: string };

const TOKEN = /https?:\/\/[^\s<>"]+|[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}/g;
const TRAILING = /[.,;:!?)\]]+$/;

/**
 * Splits text into plain, URL and email segments so the UI can render links. Only http(s)
 * URLs and email addresses become links. Everything else stays plain text, which React escapes.
 */
export function linkify(text: string): Segment[] {
  const segments: Segment[] = [];
  let last = 0;
  for (const match of text.matchAll(TOKEN)) {
    let value = match[0];
    const start = match.index ?? 0;
    // Punctuation that ends a sentence is not part of the link.
    const trail = value.match(TRAILING)?.[0] ?? "";
    value = value.slice(0, value.length - trail.length);
    if (start > last) segments.push({ type: "text", value: text.slice(last, start) });
    segments.push({ type: value.startsWith("http") ? "url" : "email", value });
    last = start + value.length;
  }
  if (last < text.length) segments.push({ type: "text", value: text.slice(last) });
  return segments;
}
