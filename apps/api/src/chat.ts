import { profile } from "@my-portfolio/content";
import {
  buildPrompt,
  COMPENSATION_REPLY,
  CONTACT_EMAIL,
  EmailScrubber,
  enquiryAction,
  GREETING_REPLY,
  HELP_REPLY,
  PRIVATE_REFUSAL,
  retrieve,
  routeQuestion,
  searchQuery,
  sourcesOf,
  SUGGESTED_QUESTIONS,
  THANKS_REPLY,
  UNKNOWN_ANSWER,
  validateQuestion,
  type Embedder,
  type Generator,
  type Turn,
  type VectorStore,
} from "@my-portfolio/rag";
import type { AnswerCache } from "./cache";
import type { HandlerConfig } from "./config";
import { clientIp, corsHeaders, isOriginAllowed, jsonError, sseEvent, sseResponse } from "./http";
import type { RateLimiter } from "./limiter";

export type LogEvent = { status: number; kind?: string; reason?: string; ms: number };

export type ChatDeps = {
  config: HandlerConfig;
  embedder: Embedder;
  store: VectorStore;
  generator: Generator;
  limits: { perMinute: RateLimiter; perDay: RateLimiter; global: RateLimiter };
  /** Recent model answers, replayed for repeat questions. Optional: without it every question asks the model. */
  cache?: AnswerCache;
  /** Receives status, kind and latency only. Never the question text. */
  log?: (event: LogEvent) => void;
};

const MAX_HISTORY_ITEMS = 20;

/** Log-safe description of an upstream failure: stage plus HTTP status or error class, never the message. */
function upstream(stage: string, error: unknown): string {
  const e = error as { status?: unknown; name?: unknown } | null;
  const code = typeof e?.status === "number" ? e.status : typeof e?.name === "string" ? e.name : "unknown";
  return `${stage}:${code}`;
}
const encoder = new TextEncoder();

type Parsed = { ok: true; question: string; history: Turn[] } | { ok: false; message: string };

function parseBody(text: string): Parsed {
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return { ok: false, message: "Send a JSON body." };
  }
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return { ok: false, message: "Send a JSON object." };
  }
  const { message, history } = body as { message?: unknown; history?: unknown };

  const q = validateQuestion(message);
  if (!q.ok) return { ok: false, message: q.error };

  const turns: Turn[] = [];
  if (history !== undefined) {
    if (!Array.isArray(history) || history.length > MAX_HISTORY_ITEMS) {
      return { ok: false, message: `history must be an array of at most ${MAX_HISTORY_ITEMS} items.` };
    }
    for (const item of history) {
      const t = item as { role?: unknown; text?: unknown };
      if ((t?.role !== "user" && t?.role !== "assistant") || typeof t.text !== "string") {
        return { ok: false, message: "Each history item needs a role (user or assistant) and text." };
      }
      turns.push({ role: t.role, text: t.text });
    }
  }
  return { ok: true, question: q.question, history: turns };
}

/**
 * The whole chat flow as a plain function from Request to Response. Every external service
 * arrives through `deps`, so it can be tested by calling it directly, with no server.
 */
export async function handleChat(request: Request, deps: ChatDeps): Promise<Response> {
  const started = performance.now();
  const finish = (res: Response, kind?: string, reason?: string): Response => {
    deps.log?.({ status: res.status, kind, reason, ms: Math.round(performance.now() - started) });
    return res;
  };

  try {
    return await run(request, deps, finish);
  } catch {
    // Anything unexpected, including a failing rate-limit store, fails closed with no details.
    return finish(jsonError(500, "internal", "Something went wrong. Please try again."), undefined, "unhandled");
  }
}

async function run(
  request: Request,
  deps: ChatDeps,
  finish: (res: Response, kind?: string, reason?: string) => Response
): Promise<Response> {
  const { config } = deps;
  const origin = request.headers.get("origin");

  if (!isOriginAllowed(origin, config.allowedOrigins, config.allowMissingOrigin)) {
    return finish(jsonError(403, "forbidden_origin", "This origin is not allowed."), undefined, "origin");
  }
  const cors = corsHeaders(origin, config.allowedOrigins);

  if (request.method === "OPTIONS") {
    return finish(new Response(null, { status: 204, headers: corsHeaders(origin, config.allowedOrigins, true) }));
  }
  if (request.method !== "POST") {
    return finish(
      jsonError(405, "method_not_allowed", "Use POST.", { ...cors, Allow: "POST, OPTIONS" }),
      undefined,
      "method"
    );
  }

  const declared = Number(request.headers.get("content-length") ?? 0);
  const tooLarge = () => finish(jsonError(413, "body_too_large", "Request is too large.", cors), undefined, "size");
  if (declared > config.maxBodyBytes) return tooLarge();
  const text = await request.text();
  if (encoder.encode(text).length > config.maxBodyBytes) return tooLarge();

  const parsed = parseBody(text);
  if (!parsed.ok) return finish(jsonError(400, "invalid_request", parsed.message, cors), undefined, "invalid");
  const { question } = parsed;
  const history = parsed.history.slice(-6);

  const ip = clientIp(request.headers);
  // Every request counts against the per-minute limit. The daily and global limits protect the free
  // Gemini quota, so they are charged only when a request is about to use it (see useQuota below).
  const limited = async (checks: [RateLimiter, string][]): Promise<Response | null> => {
    for (const [limiter, key] of checks) {
      const result = await limiter.check(key);
      if (!result.allowed) {
        return finish(
          jsonError(
            429,
            "rate_limited",
            `Too many questions right now. Try again shortly, or email ${profile.email}.`,
            { ...cors, "Retry-After": String(result.retryAfterSec) }
          ),
          undefined,
          "rate_limited"
        );
      }
    }
    return null;
  };
  const tooFast = await limited([[deps.limits.perMinute, ip]]);
  if (tooFast) return tooFast;
  const useQuota = () =>
    limited([
      [deps.limits.perDay, ip],
      [deps.limits.global, "global"],
    ]);

  const fixed = (
    kind: "refusal" | "unknown" | "answer",
    answer: string,
    sources: string[] = [],
    logKind: string = kind,
    extra: { suggestions?: string[]; action?: { label: string; href: string }; counted?: boolean } = {}
  ) =>
    finish(
      sseResponse(
        new ReadableStream<Uint8Array>({
          start(controller) {
            controller.enqueue(sseEvent("meta", { kind, sources, counted: false, ...extra }));
            controller.enqueue(sseEvent("token", { text: answer }));
            controller.enqueue(sseEvent("done", {}));
            controller.close();
          },
        }),
        cors
      ),
      logKind
    );

  switch (routeQuestion(question).kind) {
    case "refuse-private":
      return fixed("refusal", PRIVATE_REFUSAL, [], "refusal");
    case "compensation":
      return fixed("answer", COMPENSATION_REPLY, [], "compensation", { action: enquiryAction() });
    case "greeting":
      return fixed("answer", GREETING_REPLY, [], "greeting", { suggestions: SUGGESTED_QUESTIONS });
    case "thanks":
      return fixed("answer", THANKS_REPLY, [], "thanks", { suggestions: SUGGESTED_QUESTIONS });
    case "help":
      return fixed("answer", HELP_REPLY, [], "help", { suggestions: SUGGESTED_QUESTIONS });
  }

  // Repeat of a recent question with no conversation behind it: replay the stored answer.
  const cached = history.length === 0 ? deps.cache?.get(question) : undefined;
  if (cached) return fixed("answer", cached.text, cached.sources, "cache", { counted: true });

  const overQuota = await useQuota();
  if (overQuota) return overQuota;

  const search = searchQuery(question, history);
  let retrieval;
  try {
    retrieval = await retrieve(search.text, deps.embedder, deps.store, {
      topK: config.topK,
      threshold: config.threshold,
    });
  } catch (error) {
    return finish(jsonError(502, "upstream_error", "The assistant is unavailable right now.", cors), undefined, upstream("retrieve", error));
  }
  if (!retrieval.answerable) return fixed("unknown", UNKNOWN_ANSWER, [], "unknown", { suggestions: SUGGESTED_QUESTIONS, counted: true });

  // Instant path: a close match to an approved FAQ is answered with its stored text. No model
  // call, so no wait and no quota used. The text is the owner-approved answer, never generated.
  const top = retrieval.matches[0];
  if (!search.followUp && top && top.metadata.docId.startsWith("faq-") && top.score >= config.faqFastPathThreshold) {
    const { title, text } = top.metadata;
    const answer = text.startsWith(title) ? text.slice(title.length).trim() : text;
    return fixed("answer", answer, [title], "faq", { counted: true });
  }

  const prompt = buildPrompt({ question, history, context: retrieval.context });
  const sources = sourcesOf(retrieval.context);
  const iterator = deps.generator.generate(prompt)[Symbol.asyncIterator]();

  // Read the first fragment before committing to a 200, so an immediate failure is a real 502.
  let first: IteratorResult<string>;
  try {
    first = await iterator.next();
  } catch (error) {
    return finish(jsonError(502, "upstream_error", "The assistant is unavailable right now.", cors), undefined, upstream("generate", error));
  }
  if (first.done) {
    return finish(jsonError(502, "upstream_error", "The assistant returned no answer.", cors), undefined, "empty");
  }

  let collected = "";
  // A model can invent a contact address. Every address in its text is checked against the real one.
  const scrub = new EmailScrubber(CONTACT_EMAIL);
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(sseEvent("meta", { kind: "answer", sources, counted: true }));
      const firstText = scrub.push(first.value);
      if (firstText) controller.enqueue(sseEvent("token", { text: firstText }));
      collected = firstText;
    },
    async pull(controller) {
      try {
        // Keep reading until there is something to send: a fragment that ends mid-word is held back
        // by the scrubber, and a pull that sends nothing would never be called again.
        for (;;) {
          const next = await iterator.next();
          if (next.done) {
            const rest = scrub.flush();
            if (rest) {
              collected += rest;
              controller.enqueue(sseEvent("token", { text: rest }));
            }
            if (history.length === 0 && !/^I don't have that information/i.test(collected)) deps.cache?.set(question, { text: collected, sources });
            controller.enqueue(sseEvent("done", {}));
            controller.close();
            return;
          }
          const text = scrub.push(next.value);
          if (text) {
            collected += text;
            controller.enqueue(sseEvent("token", { text }));
            return;
          }
        }
      } catch {
        controller.enqueue(
          sseEvent("error", { code: "upstream_error", message: "The answer was interrupted. Please try again." })
        );
        controller.close();
      }
    },
    async cancel() {
      await iterator.return?.();
    },
  });
  return finish(sseResponse(stream, cors), "answer");
}
