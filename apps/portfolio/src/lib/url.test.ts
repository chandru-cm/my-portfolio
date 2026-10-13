import assert from "node:assert/strict";
import { test } from "node:test";
import { joinUrl } from "./url";

test("an empty or missing base keeps the path relative", () => {
  assert.equal(joinUrl("", "/api/chat"), "/api/chat");
  assert.equal(joinUrl(undefined, "/api/chat"), "/api/chat");
  assert.equal(joinUrl("   ", "/api/chat"), "/api/chat");
});

test("joins a base URL and path with exactly one slash", () => {
  assert.equal(joinUrl("http://localhost:8787", "/api/chat"), "http://localhost:8787/api/chat");
  assert.equal(joinUrl("http://localhost:8787/", "/api/chat"), "http://localhost:8787/api/chat");
  assert.equal(joinUrl("http://localhost:8787///", "api/chat"), "http://localhost:8787/api/chat");
});
