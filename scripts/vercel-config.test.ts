import assert from "node:assert/strict";
import { test } from "node:test";
import { vercelConfig } from "./vercel-config";

const { version, routes } = vercelConfig();
const at = (pred: (r: Record<string, unknown>) => boolean) => routes.findIndex(pred);

test("is Build Output version 3", () => {
  assert.equal(version, 3);
});

test("real files and functions are served before any fallback", () => {
  const fs = at((r) => r.handle === "filesystem");
  assert.ok(fs > 0);
  assert.ok(at((r) => r.dest === "/index.html") > fs, "the website fallback must come after the filesystem step");
  assert.ok(at((r) => r.src === "/api/(.*)" && r.status === 404) > fs, "unknown API paths 404 after the filesystem step");
});

test("an unknown /api path is a 404, never the website", () => {
  const apiIdx = at((r) => r.src === "/api/(.*)" && r.status === 404);
  const fallbackIdx = at((r) => r.dest === "/index.html");
  assert.ok(apiIdx !== -1 && apiIdx < fallbackIdx);
});

test("security headers apply to everything and fall through to later rules", () => {
  const first = routes[0] as { src: string; continue: boolean; headers: Record<string, string> };
  assert.equal(first.src, "/(.*)");
  assert.equal(first.continue, true);
  assert.equal(first.headers["X-Content-Type-Options"], "nosniff");
  assert.equal(first.headers["X-Frame-Options"], "DENY");
});

test("hashed assets are cached for a year and immutable", () => {
  const r = routes.find((x) => x.src === "/assets/(.*)") as { headers: Record<string, string>; continue: boolean };
  assert.match(r.headers["Cache-Control"], /max-age=31536000, immutable/);
  assert.equal(r.continue, true);
});
