import assert from "node:assert/strict";
import { test } from "node:test";
import { clientIp, corsHeaders, isOriginAllowed, sseEvent } from "./http";
import { InMemoryRateLimiter } from "./limiter";

test("origin allow-list ignores a trailing slash and rejects look-alikes", () => {
  const allowed = ["https://site.example"];
  assert.equal(isOriginAllowed("https://site.example", allowed, false), true);
  assert.equal(isOriginAllowed("https://site.example/", allowed, false), true);
  assert.equal(isOriginAllowed("https://site.example.evil.com", allowed, false), false);
  assert.equal(isOriginAllowed("http://site.example", allowed, false), false);
  assert.equal(isOriginAllowed(null, allowed, false), false);
  assert.equal(isOriginAllowed(null, allowed, true), true);
});

test("CORS headers are only issued to allowed origins", () => {
  assert.deepEqual(corsHeaders("https://evil.example", ["https://site.example"]), {});
  assert.equal(corsHeaders("https://site.example", ["https://site.example"])["Access-Control-Allow-Origin"], "https://site.example");
});

test("SSE events are framed correctly", () => {
  assert.equal(new TextDecoder().decode(sseEvent("token", { text: "hi" })), 'event: token\ndata: {"text":"hi"}\n\n');
});

test("newlines in streamed text cannot break SSE framing", () => {
  const frame = new TextDecoder().decode(sseEvent("token", { text: "line1\n\nevent: done" }));
  assert.equal(frame.split("\n\n").filter(Boolean).length, 1);
});

test("client IP prefers the platform header and takes the first address", () => {
  assert.equal(clientIp(new Headers({ "x-vercel-forwarded-for": "9.9.9.9", "x-forwarded-for": "1.1.1.1" })), "9.9.9.9");
  assert.equal(clientIp(new Headers({ "x-forwarded-for": "1.1.1.1, 2.2.2.2" })), "1.1.1.1");
  assert.equal(clientIp(new Headers()), "unknown");
});

test("in-memory limiter allows up to the limit, then blocks until the window passes", async () => {
  let now = 0;
  const limiter = new InMemoryRateLimiter(2, 1000, () => now);
  assert.equal((await limiter.check("a")).allowed, true);
  assert.equal((await limiter.check("a")).allowed, true);
  const blocked = await limiter.check("a");
  assert.equal(blocked.allowed, false);
  assert.equal(blocked.retryAfterSec, 1);
  assert.equal((await limiter.check("b")).allowed, true);
  now = 1001;
  assert.equal((await limiter.check("a")).allowed, true);
});
