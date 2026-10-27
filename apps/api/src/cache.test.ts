import assert from "node:assert/strict";
import { test } from "node:test";
import { AnswerCache } from "./cache";

test("case, spacing and punctuation do not make a different question", () => {
  const c = new AnswerCache();
  c.set("What is the tech stack?", { text: "TypeScript", sources: [] });
  assert.equal(c.get("  what is the TECH   stack ")?.text, "TypeScript");
  assert.equal(c.get("What is the visa status?"), undefined);
});

test("answers expire", () => {
  let now = 0;
  const c = new AnswerCache(1000, 10, () => now);
  c.set("q", { text: "a", sources: [] });
  now = 999;
  assert.ok(c.get("q"));
  now = 1001;
  assert.equal(c.get("q"), undefined);
});

test("the oldest answer is dropped when the cache is full", () => {
  const c = new AnswerCache(1000, 2);
  c.set("one", { text: "1", sources: [] });
  c.set("two", { text: "2", sources: [] });
  c.set("three", { text: "3", sources: [] });
  assert.equal(c.get("one"), undefined);
  assert.ok(c.get("two") && c.get("three"));
});

test("an empty answer is never stored", () => {
  const c = new AnswerCache();
  c.set("q", { text: "", sources: [] });
  assert.equal(c.get("q"), undefined);
});
