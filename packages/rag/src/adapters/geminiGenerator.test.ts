import assert from "node:assert/strict";
import { test } from "node:test";
import { GeminiGenerator, shouldTryNextModel, type StreamClient } from "./geminiGenerator";

const prompt = { system: "s", messages: [{ role: "user" as const, text: "q" }] };

type Behaviour =
  | { text: string[] }
  | { fail: number | "abort" }
  | { hang: true }
  | { text: string[]; failAfter: number };

/** Fake client: behaviour per model name, records which models were tried. */
function fakeClient(behaviours: Record<string, Behaviour>) {
  const tried: string[] = [];
  const client: StreamClient = {
    models: {
      async generateContentStream({ model, config }) {
        tried.push(model);
        const b = behaviours[model];
        if ("fail" in b) {
          throw Object.assign(new Error(`fail ${b.fail}`), b.fail === "abort" ? { name: "AbortError" } : { status: b.fail });
        }
        if ("hang" in b) {
          // Waits until the adapter's timeout aborts the request, like a real stalled call.
          await new Promise((_, reject) =>
            (config.abortSignal as AbortSignal).addEventListener("abort", () =>
              reject(Object.assign(new Error("aborted"), { name: "AbortError" }))
            )
          );
        }
        const parts = (b as { text: string[] }).text;
        const failAfter = (b as { failAfter?: number }).failAfter;
        return (async function* () {
          for (let i = 0; i < parts.length; i++) {
            if (failAfter !== undefined && i === failAfter) throw Object.assign(new Error("dropped"), { status: 503 });
            yield { text: parts[i] };
          }
        })();
      },
    },
  };
  return { client, tried };
}

async function collect(it: AsyncIterable<string>): Promise<string> {
  let out = "";
  for await (const t of it) out += t;
  return out;
}

const make = (client: StreamClient, fallbackModels: string[] = ["B"], firstTokenTimeoutMs = 30) =>
  new GeminiGenerator({ apiKey: "k", model: "A", fallbackModels, firstTokenTimeoutMs, client });

test("uses the primary model when it answers", async () => {
  const { client, tried } = fakeClient({ A: { text: ["Hello ", "there."] }, B: { text: ["unused"] } });
  assert.equal(await collect(make(client).generate(prompt)), "Hello there.");
  assert.deepEqual(tried, ["A"]);
});

test("falls back when the primary hangs past the first-word deadline", async () => {
  const { client, tried } = fakeClient({ A: { hang: true }, B: { text: ["From ", "B."] } });
  assert.equal(await collect(make(client).generate(prompt)), "From B.");
  assert.deepEqual(tried, ["A", "B"]);
});

test("falls back on 503, 429 and 404", async () => {
  for (const status of [503, 429, 404]) {
    const { client, tried } = fakeClient({ A: { fail: status }, B: { text: ["ok"] } });
    assert.equal(await collect(make(client).generate(prompt)), "ok", `status ${status}`);
    assert.deepEqual(tried, ["A", "B"]);
  }
});

test("does not fall back on a bad request or a key problem", async () => {
  for (const status of [400, 401, 403]) {
    const { client, tried } = fakeClient({ A: { fail: status }, B: { text: ["ok"] } });
    await assert.rejects(collect(make(client).generate(prompt)));
    assert.deepEqual(tried, ["A"], `status ${status}`);
  }
});

test("never switches models once text has been produced", async () => {
  const { client, tried } = fakeClient({ A: { text: ["Part one. ", "Part two."], failAfter: 1 }, B: { text: ["REPEATED"] } });
  const seen: string[] = [];
  await assert.rejects(async () => {
    for await (const t of make(client).generate(prompt)) seen.push(t);
  });
  assert.deepEqual(seen, ["Part one. "]);
  assert.deepEqual(tried, ["A"]);
});

test("throws the last error when every model fails", async () => {
  const { client, tried } = fakeClient({ A: { fail: 503 }, B: { fail: 429 } });
  await assert.rejects(collect(make(client).generate(prompt)), /fail 429/);
  assert.deepEqual(tried, ["A", "B"]);
});

test("requires a primary model name", () => {
  assert.throws(() => new GeminiGenerator({ apiKey: "k", model: "" }), /GEMINI_CHAT_MODEL/);
});

test("shouldTryNextModel classifies errors", () => {
  assert.equal(shouldTryNextModel({ name: "AbortError" }), true);
  assert.equal(shouldTryNextModel({ status: 500 }), true);
  assert.equal(shouldTryNextModel({ status: 400 }), false);
  assert.equal(shouldTryNextModel(new Error("plain")), false);
});
