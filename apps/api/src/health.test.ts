import assert from "node:assert/strict";
import { test } from "node:test";
import { healthReport } from "./health";

const valid = {
  GEMINI_API_KEY: "SECRET-GEMINI-KEY-123",
  PINECONE_API_KEY: "SECRET-PINECONE-KEY-456",
  PINECONE_INDEX: "portfolio",
  UPSTASH_REDIS_REST_URL: "https://secret-host-789.upstash.io",
  UPSTASH_REDIS_REST_TOKEN: "SECRET-TOKEN-000",
  ALLOWED_ORIGINS: "https://my-site.vercel.app, https://other.example/",
  VERCEL_ENV: "production",
};

test("a valid deployment reports its allowed origins, mode and rate-limit store", () => {
  const r = healthReport(valid);
  assert.equal(r.ok, true);
  assert.equal(r.configured, true);
  if (r.configured) {
    assert.deepEqual(r.allowedOrigins, ["https://my-site.vercel.app", "https://other.example"]);
    assert.equal(r.mode, "production");
    assert.equal(r.rateLimit, "redis");
  }
});

test("a broken deployment lists what to fix, by name only", () => {
  const r = healthReport({ VERCEL_ENV: "production" });
  assert.equal(r.configured, false);
  if (!r.configured) {
    assert.ok(r.problems.some((p) => /GEMINI_API_KEY/.test(p)));
    assert.ok(r.problems.some((p) => /ALLOWED_ORIGINS/.test(p)));
    assert.equal(r.mode, "production");
  }
});

test("the report never contains a secret value", () => {
  const text = JSON.stringify(healthReport(valid)) + JSON.stringify(healthReport({ ...valid, ALLOWED_ORIGINS: "" , RATE_LIMIT_PER_MINUTE: "abc" }));
  for (const secret of ["SECRET-GEMINI-KEY-123", "SECRET-PINECONE-KEY-456", "SECRET-TOKEN-000", "secret-host-789"]) {
    assert.ok(!text.includes(secret), `leaked ${secret}`);
  }
});

test("without Upstash the report says the limiter is in memory (outside production)", () => {
  const { UPSTASH_REDIS_REST_URL: _u, UPSTASH_REDIS_REST_TOKEN: _t, VERCEL_ENV: _v, ...rest } = valid;
  const r = healthReport(rest);
  assert.equal(r.configured, true);
  if (r.configured) assert.equal(r.rateLimit, "memory");
});
