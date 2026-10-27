import assert from "node:assert/strict";
import { test } from "node:test";
import { COMPENSATION_REPLY, GREETING_REPLY, UNKNOWN_ANSWER } from "@my-portfolio/rag";
import { AnswerCache } from "./cache";
import { handleChat } from "./chat";
import { InMemoryRateLimiter } from "./limiter";
import { makeDeps, post, readSse, ScriptedGenerator, tokensOf } from "./testkit";

const ask = async (message: string, deps: Awaited<ReturnType<typeof makeDeps>>, history: unknown[] = []) =>
  readSse(await handleChat(post({ message, history }), deps));
const metaOf = (events: Awaited<ReturnType<typeof readSse>>) => events.find((e) => e.event === "meta")!.data;

test("a greeting is answered for free, with suggestions and no model or quota use", async () => {
  const generator = new ScriptedGenerator();
  const deps = await makeDeps({ generator, limits: { ...(await makeDeps()).limits, perDay: new InMemoryRateLimiter(0, 1000) } });
  const events = await ask("Hello", deps);
  assert.equal(tokensOf(events), GREETING_REPLY);
  assert.equal(generator.calls, 0);
  assert.equal(metaOf(events).counted, false);
  assert.ok(metaOf(events).suggestions.length >= 3);
});

test("a salary question gets the email reply with a ready-made enquiry link, and never the model", async () => {
  const generator = new ScriptedGenerator();
  const events = await ask("What salary does Chandra Moorthy expect?", await makeDeps({ generator }));
  assert.equal(tokensOf(events), COMPENSATION_REPLY);
  assert.equal(generator.calls, 0);
  assert.match(metaOf(events).action.href, /^mailto:/);
  assert.equal(metaOf(events).counted, false);
});

test("quick replies work even when the daily quota is used up", async () => {
  const exhausted = new InMemoryRateLimiter(0, 1000);
  const deps = await makeDeps({ limits: { perMinute: new InMemoryRateLimiter(100, 1000), perDay: exhausted, global: exhausted } });
  assert.equal((await handleChat(post({ message: "Thanks!" }), deps)).status, 200);
  assert.equal((await handleChat(post({ message: "Is Chandra Moorthy open to relocation or visa sponsorship?" }), deps)).status, 429);
});

test("a repeated question is replayed from the cache without asking the model again", async () => {
  const generator = new ScriptedGenerator(["Chandra Moorthy uses ", "TypeScript and Node.js."]);
  const deps = await makeDeps({ generator, cache: new AnswerCache() });
  const q = "Is Chandra Moorthy open to relocation or visa sponsorship?";
  const first = await ask(q, deps);
  const second = await ask(q.toUpperCase(), deps);
  assert.equal(generator.calls, 1);
  assert.equal(tokensOf(second), tokensOf(first));
});

test("a model answer that says it does not know is not cached", async () => {
  const generator = new ScriptedGenerator(["I don't have that information about Chandra Moorthy."]);
  const deps = await makeDeps({ generator, cache: new AnswerCache() });
  const q = "Is Chandra Moorthy open to relocation or visa sponsorship?";
  await ask(q, deps);
  await ask(q, deps);
  assert.equal(generator.calls, 2);
});

test("a follow-up is searched together with the previous question", async () => {
  const deps = await makeDeps();
  const searched: string[] = [];
  const real = deps.embedder;
  deps.embedder = { ...real, embed: async (texts: string[], task: Parameters<typeof real.embed>[1]) => (searched.push(...texts), real.embed(texts, task)) } as typeof real;
  const history = [
    { role: "user", text: "What did Chandra Moorthy build on SociBooks?" },
    { role: "assistant", text: "Expense approval, statements and invoices." },
  ];
  await ask("and the stack?", deps, history);
  assert.match(searched.join(" "), /SociBooks/);
  searched.length = 0;
  await ask("Which time zones can Chandra Moorthy work with?", deps, history);
  assert.doesNotMatch(searched.join(" "), /SociBooks/, "a question that stands alone is searched as written");
});

test("an unanswerable question gets suggestions instead of a dead end", async () => {
  const events = await ask("Who won the cricket world cup?", await makeDeps());
  assert.equal(tokensOf(events), UNKNOWN_ANSWER);
  assert.ok(metaOf(events).suggestions.length >= 3);
});
