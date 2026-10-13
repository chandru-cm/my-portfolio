import assert from "node:assert/strict";
import { test } from "node:test";
import { isTransientHttpError, withRetry } from "./retry";

const noSleep = async () => {};

test("returns on first success without sleeping", async () => {
  let calls = 0;
  const out = await withRetry(async () => ++calls, { sleep: noSleep });
  assert.equal(out, 1);
});

test("retries transient failures, then succeeds", async () => {
  let calls = 0;
  const waits: number[] = [];
  const out = await withRetry(
    async () => {
      if (++calls < 3) throw Object.assign(new Error("rate limited"), { status: 429 });
      return "ok";
    },
    { baseMs: 10, sleep: async (ms) => void waits.push(ms), isRetryable: isTransientHttpError }
  );
  assert.equal(out, "ok");
  assert.deepEqual(waits, [10, 20]);
});

test("does not retry non-retryable errors", async () => {
  let calls = 0;
  await assert.rejects(
    withRetry(
      async () => {
        calls++;
        throw Object.assign(new Error("bad key"), { status: 401 });
      },
      { sleep: noSleep, isRetryable: isTransientHttpError }
    )
  );
  assert.equal(calls, 1);
});

test("gives up after the retry budget", async () => {
  let calls = 0;
  await assert.rejects(
    withRetry(
      async () => {
        calls++;
        throw new Error("down");
      },
      { retries: 2, sleep: noSleep }
    )
  );
  assert.equal(calls, 3);
});
