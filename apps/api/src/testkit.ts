import { toKnowledgeDocuments } from "@my-portfolio/content";
import {
  indexDocuments,
  InMemoryVectorStore,
  LexicalEmbedder,
  type BuiltPrompt,
  type Generator,
} from "@my-portfolio/rag";
import type { ChatDeps } from "./chat";
import { InMemoryRateLimiter } from "./limiter";

export const SITE = "https://site.example";

/** Streams scripted fragments, and can fail before the first fragment or part-way through. */
export class ScriptedGenerator implements Generator {
  calls = 0;
  lastPrompt?: BuiltPrompt;

  constructor(
    private readonly parts: string[] = ["Chandra Moorthy ", "built this."],
    private readonly failure: "immediately" | "midstream" | null = null
  ) {}

  async *generate(prompt: BuiltPrompt): AsyncIterable<string> {
    this.calls++;
    this.lastPrompt = prompt;
    if (this.failure === "immediately") throw new Error("model down");
    for (let i = 0; i < this.parts.length; i++) {
      if (this.failure === "midstream" && i === 1) throw new Error("connection lost");
      yield this.parts[i];
    }
  }
}

/** Offline stand-in for the model: returns the start of the retrieved context so retrieval is visible. */
export class EchoGenerator implements Generator {
  async *generate(prompt: BuiltPrompt): AsyncIterable<string> {
    const last = prompt.messages[prompt.messages.length - 1].text;
    const context = last.match(/<context>\n([\s\S]*?)\n<\/context>/)?.[1] ?? "";
    yield `[offline, no model] Top matched context:\n${context.slice(0, 400)}`;
  }
}

/** Real knowledge base, offline embedder, in-memory limiters: no network and no keys. */
export async function makeDeps(overrides: Partial<ChatDeps> = {}): Promise<ChatDeps> {
  const embedder = new LexicalEmbedder();
  const store = new InMemoryVectorStore();
  await indexDocuments(toKnowledgeDocuments(), embedder, store);
  return {
    config: {
      allowedOrigins: [SITE],
      allowMissingOrigin: false,
      // The offline embedder only matches shared words, so it uses a lower bar than Gemini.
      threshold: 0.2,
      topK: 4,
      maxBodyBytes: 4096,
    },
    embedder,
    store,
    generator: new ScriptedGenerator(),
    limits: {
      perMinute: new InMemoryRateLimiter(1000, 60_000),
      perDay: new InMemoryRateLimiter(1000, 86_400_000),
      global: new InMemoryRateLimiter(1000, 86_400_000),
    },
    ...overrides,
  };
}

export function post(body: unknown, headers: Record<string, string> = {}): Request {
  return new Request("https://api.test/api/chat", {
    method: "POST",
    headers: { origin: SITE, "content-type": "application/json", ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

export type SseEvent = { event: string; data: any };

export async function readSse(res: Response): Promise<SseEvent[]> {
  const text = await res.text();
  return text
    .split("\n\n")
    .filter(Boolean)
    .map((block) => {
      const event = /^event: (.*)$/m.exec(block)?.[1] ?? "";
      const data = JSON.parse(/^data: (.*)$/m.exec(block)?.[1] ?? "null");
      return { event, data };
    });
}

export const tokensOf = (events: SseEvent[]) =>
  events
    .filter((e) => e.event === "token")
    .map((e) => e.data.text)
    .join("");
