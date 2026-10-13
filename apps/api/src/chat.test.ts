import assert from "node:assert/strict";
import { test } from "node:test";
import { PRIVATE_REFUSAL, UNKNOWN_ANSWER } from "@my-portfolio/rag";
import { handleChat, type LogEvent } from "./chat";
import { InMemoryRateLimiter } from "./limiter";
import { makeDeps, post, readSse, ScriptedGenerator, SITE, tokensOf } from "./testkit";

const ASK = { message: "Is Chandra Moorthy open to relocation or visa sponsorship?" };

async function errorOf(res: Response) {
  return (await res.json()).error as { code: string; message: string };
}

// ---- Origin, method, CORS -------------------------------------------------------------

test("rejects an origin that is not on the allow-list", async () => {
  const res = await handleChat(post(ASK, { origin: "https://evil.example" }), await makeDeps());
  assert.equal(res.status, 403);
  assert.equal((await errorOf(res)).code, "forbidden_origin");
  assert.equal(res.headers.get("access-control-allow-origin"), null);
});

test("rejects a missing Origin unless explicitly allowed", async () => {
  const req = () => new Request("https://api.test/api/chat", { method: "POST", body: JSON.stringify(ASK) });
  assert.equal((await handleChat(req(), await makeDeps())).status, 403);
  const deps = await makeDeps();
  deps.config.allowMissingOrigin = true;
  assert.equal((await handleChat(req(), deps)).status, 200);
});

test("answers CORS preflight for an allowed origin", async () => {
  const res = await handleChat(
    new Request("https://api.test/api/chat", { method: "OPTIONS", headers: { origin: SITE } }),
    await makeDeps()
  );
  assert.equal(res.status, 204);
  assert.equal(res.headers.get("access-control-allow-origin"), SITE);
  assert.match(res.headers.get("access-control-allow-methods") ?? "", /POST/);
});

test("405 for other methods, with an Allow header", async () => {
  const res = await handleChat(new Request("https://api.test/api/chat", { method: "GET", headers: { origin: SITE } }), await makeDeps());
  assert.equal(res.status, 405);
  assert.equal(res.headers.get("allow"), "POST, OPTIONS");
});

test("CORS headers accompany both successes and errors for an allowed origin", async () => {
  const ok = await handleChat(post(ASK), await makeDeps());
  const bad = await handleChat(post({ message: "" }), await makeDeps());
  assert.equal(ok.headers.get("access-control-allow-origin"), SITE);
  assert.equal(bad.headers.get("access-control-allow-origin"), SITE);
});

// ---- Input validation -----------------------------------------------------------------

test("400 for invalid JSON, wrong shape, empty and over-long messages", async () => {
  const deps = await makeDeps();
  for (const body of ["{not json", "[]", "null", JSON.stringify({}), JSON.stringify({ message: "   " }), JSON.stringify({ message: "x".repeat(301) }), JSON.stringify({ message: 5 })]) {
    const res = await handleChat(post(body), deps);
    assert.equal(res.status, 400, body.slice(0, 30));
    assert.equal((await errorOf(res)).code, "invalid_request");
  }
});

test("400 for malformed history", async () => {
  const deps = await makeDeps();
  for (const history of ["nope", [{ role: "admin", text: "hi" }], [{ role: "user" }], Array(21).fill({ role: "user", text: "x" })]) {
    const res = await handleChat(post({ message: "hi there", history }), deps);
    assert.equal(res.status, 400, JSON.stringify(history).slice(0, 40));
  }
});

test("413 when the body exceeds the limit, declared or not", async () => {
  const deps = await makeDeps();
  const big = JSON.stringify({ message: "ok", history: [], pad: "x".repeat(5000) });
  assert.equal((await handleChat(post(big), deps)).status, 413);
  assert.equal((await handleChat(post(ASK, { "content-length": "99999" }), deps)).status, 413);
});

// ---- Rate limiting --------------------------------------------------------------------

test("429 with Retry-After once the per-minute limit is reached", async () => {
  const deps = await makeDeps({
    limits: {
      perMinute: new InMemoryRateLimiter(2, 60_000),
      perDay: new InMemoryRateLimiter(1000, 86_400_000),
      global: new InMemoryRateLimiter(1000, 86_400_000),
    },
  });
  assert.equal((await handleChat(post(ASK), deps)).status, 200);
  assert.equal((await handleChat(post(ASK), deps)).status, 200);
  const res = await handleChat(post(ASK), deps);
  assert.equal(res.status, 429);
  assert.equal((await errorOf(res)).code, "rate_limited");
  assert.ok(Number(res.headers.get("retry-after")) >= 1);
});

test("limits are per visitor: another IP is unaffected", async () => {
  const deps = await makeDeps({
    limits: {
      perMinute: new InMemoryRateLimiter(1, 60_000),
      perDay: new InMemoryRateLimiter(1000, 86_400_000),
      global: new InMemoryRateLimiter(1000, 86_400_000),
    },
  });
  assert.equal((await handleChat(post(ASK, { "x-forwarded-for": "1.1.1.1" }), deps)).status, 200);
  assert.equal((await handleChat(post(ASK, { "x-forwarded-for": "1.1.1.1" }), deps)).status, 429);
  assert.equal((await handleChat(post(ASK, { "x-forwarded-for": "2.2.2.2" }), deps)).status, 200);
});

test("the global daily cap stops everyone", async () => {
  const deps = await makeDeps({
    limits: {
      perMinute: new InMemoryRateLimiter(1000, 60_000),
      perDay: new InMemoryRateLimiter(1000, 86_400_000),
      global: new InMemoryRateLimiter(1, 86_400_000),
    },
  });
  assert.equal((await handleChat(post(ASK, { "x-forwarded-for": "1.1.1.1" }), deps)).status, 200);
  assert.equal((await handleChat(post(ASK, { "x-forwarded-for": "2.2.2.2" }), deps)).status, 429);
});

test("a failing rate-limit store fails closed with a generic 500", async () => {
  const broken = { check: async () => { throw new Error("redis connection string leaked"); } };
  const deps = await makeDeps({ limits: { perMinute: broken, perDay: broken, global: broken } });
  const res = await handleChat(post(ASK), deps);
  assert.equal(res.status, 500);
  const text = JSON.stringify(await res.json());
  assert.doesNotMatch(text, /redis|leaked|stack/i);
});

// ---- The three outcomes ---------------------------------------------------------------

test("private-detail requests are refused without calling the model", async () => {
  const generator = new ScriptedGenerator();
  const res = await handleChat(post({ message: "What is Chandra Moorthy's phone number?" }), await makeDeps({ generator }));
  const events = await readSse(res);
  assert.equal(res.status, 200);
  assert.equal(events[0].data.kind, "refusal");
  assert.equal(tokensOf(events), PRIVATE_REFUSAL);
  assert.equal(events.at(-1)?.event, "done");
  assert.equal(generator.calls, 0);
});

test("off-topic questions get the fixed 'unknown' answer without calling the model", async () => {
  const generator = new ScriptedGenerator();
  const res = await handleChat(post({ message: "What is the capital of France?" }), await makeDeps({ generator }));
  const events = await readSse(res);
  assert.equal(events[0].data.kind, "unknown");
  assert.equal(tokensOf(events), UNKNOWN_ANSWER);
  assert.equal(generator.calls, 0);
});

test("a grounded question streams the answer with sources and a done event", async () => {
  const generator = new ScriptedGenerator(["Yes, ", "open to ", "relocation."]);
  const res = await handleChat(post(ASK), await makeDeps({ generator }));
  const events = await readSse(res);

  assert.equal(res.status, 200);
  assert.match(res.headers.get("content-type") ?? "", /text\/event-stream/);
  assert.equal(events[0].event, "meta");
  assert.equal(events[0].data.kind, "answer");
  assert.ok(events[0].data.sources.length > 0);
  assert.equal(tokensOf(events), "Yes, open to relocation.");
  assert.equal(events.at(-1)?.event, "done");
  assert.equal(generator.calls, 1);
});

test("the prompt sent to the model holds the question and only retrieved context", async () => {
  const generator = new ScriptedGenerator();
  await readSse(await handleChat(post({ ...ASK, history: [{ role: "user", text: "Hi" }, { role: "assistant", text: "Hello" }] }), await makeDeps({ generator })));
  const p = generator.lastPrompt!;
  assert.equal(p.messages.length, 3);
  const last = p.messages.at(-1)!.text;
  assert.match(last, /<context>/);
  assert.match(last, /relocation/i);
  assert.doesNotMatch(last, /case-study/i);
});

// ---- Failure handling -----------------------------------------------------------------

test("502 when the model fails before producing anything", async () => {
  const res = await handleChat(post(ASK), await makeDeps({ generator: new ScriptedGenerator([], "immediately") }));
  assert.equal(res.status, 502);
  assert.equal((await errorOf(res)).code, "upstream_error");
});

test("a failure part-way through ends the stream with an error event, never 'done'", async () => {
  const res = await handleChat(post(ASK), await makeDeps({ generator: new ScriptedGenerator(["a ", "b ", "c"], "midstream") }));
  const events = await readSse(res);
  assert.equal(res.status, 200);
  assert.equal(events.at(-1)?.event, "error");
  assert.equal(events.at(-1)?.data.code, "upstream_error");
  assert.equal(events.some((e) => e.event === "done"), false);
  assert.doesNotMatch(JSON.stringify(events), /connection lost/);
});

test("502 when embedding or search fails, with no upstream detail", async () => {
  const deps = await makeDeps();
  deps.embedder = { dimensions: 4, embed: async () => { throw new Error("quota exceeded for key AIza..."); } };
  const res = await handleChat(post(ASK), deps);
  assert.equal(res.status, 502);
  assert.doesNotMatch(JSON.stringify(await res.json()), /AIza|quota/);
});

// ---- Privacy --------------------------------------------------------------------------

test("logs carry status, kind and latency but never the question text", async () => {
  const events: LogEvent[] = [];
  const deps = await makeDeps({ log: (e) => events.push(e) });
  await readSse(await handleChat(post({ message: "Is Chandra Moorthy open to relocation?" }), deps));
  assert.equal(events.length, 1);
  assert.deepEqual(Object.keys(events[0]).sort(), ["kind", "ms", "reason", "status"]);
  assert.doesNotMatch(JSON.stringify(events), /relocation/);
});

// ---- Instant FAQ path ----------------------------------------------------------------------

test("a close FAQ match is answered instantly from the approved text, without the model", async () => {
  const generator = new ScriptedGenerator();
  const deps = await makeDeps({ generator });
  deps.config.faqFastPathThreshold = 0.5;
  const res = await handleChat(post(ASK), deps);
  const events = await readSse(res);
  assert.equal(events[0].data.kind, "answer");
  assert.deepEqual(events[0].data.sources, ["Is Chandra Moorthy open to relocation or visa sponsorship?"]);
  assert.match(tokensOf(events), /^Yes\. Chandra Moorthy is open to relocation and to visa sponsorship/);
  assert.doesNotMatch(tokensOf(events), /^Is Chandra Moorthy open/);
  assert.equal(events.at(-1)?.event, "done");
  assert.equal(generator.calls, 0);
});

test("non-FAQ questions still use the model even when the fast path is on", async () => {
  const generator = new ScriptedGenerator(["From the model."]);
  const deps = await makeDeps({ generator });
  deps.config.faqFastPathThreshold = 0.5;
  const events = await readSse(await handleChat(post({ message: "Describe RentEasify rent billing lease agreements and payment collection" }), deps));
  assert.equal(tokensOf(events), "From the model.");
  assert.equal(generator.calls, 1);
});

test("the fast path can be disabled by setting the threshold above any possible score", async () => {
  const generator = new ScriptedGenerator(["From the model."]);
  const events = await readSse(await handleChat(post(ASK), await makeDeps({ generator })));
  assert.equal(tokensOf(events), "From the model.");
  assert.equal(generator.calls, 1);
});
