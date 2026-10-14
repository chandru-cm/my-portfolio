import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

const apiRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(apiRoot, ".vercel", "output");
const func = (name: string) => join(out, "functions", "api", `${name}.func`);
const readJson = (file: string) => JSON.parse(readFileSync(file, "utf8"));

// Build once; the tests below inspect and load the real output that Vercel would receive.
execFileSync(process.execPath, [join(apiRoot, "scripts", "build.mjs")], { cwd: apiRoot, stdio: "pipe" });

test("writes Vercel's Build Output format", () => {
  assert.equal(readJson(join(out, "config.json")).version, 3);
  for (const name of ["chat", "health"]) {
    const cfg = readJson(join(func(name), ".vc-config.json"));
    assert.equal(cfg.runtime, "nodejs22.x");
    assert.equal(cfg.handler, "index.js");
    assert.equal(cfg.launcherType, "Nodejs");
    assert.equal(cfg.supportsResponseStreaming, true);
    assert.ok(cfg.maxDuration >= 30, "slow model answers need a longer limit than the 10 s default");
    // The folder must be self-describing: the workspace package is "type": "module".
    assert.equal(readJson(join(func(name), "package.json")).type, "commonjs");
  }
});

test("the bundles are self-contained functions that load and answer", async () => {
  const require = createRequire(import.meta.url);
  // No keys on purpose: this must work in CI, and must fail safely when misconfigured.
  for (const k of ["GEMINI_API_KEY", "PINECONE_API_KEY", "PINECONE_INDEX"]) process.env[k] = "";

  const health = require(join(func("health"), "index.js"));
  const chat = require(join(func("chat"), "index.js"));
  assert.equal(typeof health, "function");
  assert.equal(typeof chat, "function");

  const server = createServer((req, res) => (req.url?.startsWith("/api/health") ? health(req, res) : chat(req, res)));
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  const realError = console.error;
  console.error = () => {}; // the expected start-up error is logged by design
  try {
    const h = await fetch(`${base}/api/health`);
    assert.equal(h.status, 200);
    const body = (await h.json()) as { ok: boolean; configured: boolean; problems?: string[] };
    assert.equal(body.ok, true);
    // No settings here, so health must say so and name what is missing, without any value.
    assert.equal(body.configured, false);
    assert.ok(body.problems?.some((p) => /GEMINI_API_KEY/.test(p)));
    assert.ok(body.problems?.some((p) => /PINECONE_INDEX/.test(p)));

    const c = await fetch(`${base}/api/chat`, { method: "POST", body: '{"message":"hi"}' });
    assert.equal(c.status, 500);
    const text = await c.text();
    assert.equal(JSON.parse(text).error.code, "internal");
    assert.doesNotMatch(text, /GEMINI|PINECONE|required/i, "the response must not name settings");
  } finally {
    console.error = realError;
    server.closeAllConnections();
    server.close();
  }
});
