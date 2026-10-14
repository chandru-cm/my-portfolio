import assert from "node:assert/strict";
import { test } from "node:test";
import { ConfigError, loadConfig } from "./config";

const base = {
  GEMINI_API_KEY: "k1",
  GEMINI_CHAT_MODEL: "some-model",
  PINECONE_API_KEY: "k2",
  PINECONE_INDEX: "portfolio",
};

test("local mode needs only the keys and index, and allows a missing Origin", () => {
  const { GEMINI_CHAT_MODEL: _omit, ...withoutModel } = base;
  const c = loadConfig(withoutModel, { production: false });
  assert.equal(c.geminiChatModel, "gemini-3.1-flash-lite");
  assert.deepEqual(c.geminiFallbackModels, ["gemini-3.1-flash-lite-preview", "gemini-3.5-flash-lite"]);
  assert.equal(c.threshold, 0.6);
  assert.equal(c.perMinute, 10);
  assert.equal(c.allowMissingOrigin, true);
  assert.equal(c.upstash, undefined);
});

test("reports every missing setting at once, by name only", () => {
  try {
    loadConfig({}, { production: false });
    assert.fail("should throw");
  } catch (e) {
    assert.ok(e instanceof ConfigError);
    for (const name of ["GEMINI_API_KEY", "PINECONE_API_KEY", "PINECONE_INDEX"]) {
      assert.match(e.message, new RegExp(name));
    }
  }
});

test("production also requires allowed origins and Upstash credentials, and forbids a missing Origin", () => {
  assert.throws(() => loadConfig(base, { production: true }), /ALLOWED_ORIGINS[\s\S]*UPSTASH_REDIS_REST_URL[\s\S]*UPSTASH_REDIS_REST_TOKEN/);
  const c = loadConfig(
    { ...base, ALLOWED_ORIGINS: "https://a.example/, https://b.example", UPSTASH_REDIS_REST_URL: "https://u", UPSTASH_REDIS_REST_TOKEN: "t" },
    { production: true }
  );
  assert.deepEqual(c.allowedOrigins, ["https://a.example", "https://b.example"]);
  assert.equal(c.allowMissingOrigin, false);
  assert.ok(c.upstash);
});

test("allows this deployment's own Vercel addresses without ALLOWED_ORIGINS", () => {
  const c = loadConfig(
    {
      ...base,
      UPSTASH_REDIS_REST_URL: "https://u",
      UPSTASH_REDIS_REST_TOKEN: "t",
      VERCEL_PROJECT_PRODUCTION_URL: "my-site.vercel.app",
      VERCEL_URL: "my-site-abc123.vercel.app",
      VERCEL_BRANCH_URL: "https://my-site-git-main.vercel.app/",
    },
    { production: true }
  );
  assert.deepEqual(c.allowedOrigins, ["https://my-site.vercel.app", "https://my-site-abc123.vercel.app", "https://my-site-git-main.vercel.app"]);
});

test("explicit origins and Vercel's own are combined without duplicates, and junk hosts are ignored", () => {
  const c = loadConfig(
    { ...base, ALLOWED_ORIGINS: "https://my-site.vercel.app, https://custom.example", VERCEL_PROJECT_PRODUCTION_URL: "my-site.vercel.app", VERCEL_URL: "bad host;rm -rf" },
    { production: false }
  );
  assert.deepEqual(c.allowedOrigins, ["https://my-site.vercel.app", "https://custom.example"]);
});

test("rejects a half-configured Upstash and bad numbers", () => {
  assert.throws(() => loadConfig({ ...base, UPSTASH_REDIS_REST_URL: "https://u" }, { production: false }), /both UPSTASH/);
  assert.throws(() => loadConfig({ ...base, RATE_LIMIT_PER_MINUTE: "0" }, { production: false }), /RATE_LIMIT_PER_MINUTE/);
  assert.throws(() => loadConfig({ ...base, RETRIEVAL_THRESHOLD: "1.5" }, { production: false }), /RETRIEVAL_THRESHOLD/);
});

test("rejects a Pinecone host URL as the index name", () => {
  assert.throws(() => loadConfig({ ...base, PINECONE_INDEX: "https://x.svc.pinecone.io" }, { production: false }), /index name/);
});

test("error messages never contain secret values", () => {
  try {
    loadConfig({ ...base, GEMINI_API_KEY: "SECRET-VALUE-123", RATE_LIMIT_PER_MINUTE: "abc" }, { production: false });
  } catch (e) {
    assert.doesNotMatch((e as Error).message, /SECRET-VALUE-123/);
  }
});

test("rejects a model display name and says what a model ID looks like", () => {
  assert.throws(
    () => loadConfig({ ...base, GEMINI_CHAT_MODEL: "Gemini 3.5 Flash Lite" }, { production: false }),
    /model ID like "gemini-3\.1-flash-lite".*Got "Gemini 3\.5 Flash Lite"/
  );
  assert.throws(() => loadConfig({ ...base, GEMINI_CHAT_FALLBACK_MODELS: "gemini-3.1-flash-lite, Some Name" }, { production: false }), /FALLBACK/);
  assert.doesNotThrow(() => loadConfig({ ...base, GEMINI_CHAT_MODEL: "gemini-flash-latest" }, { production: false }));
});
