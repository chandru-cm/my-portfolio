import assert from "node:assert/strict";
import { test } from "node:test";
import type { Suggestion } from "@my-portfolio/content";
import { pickSuggestions, shuffle } from "./suggestions";

const pool: Suggestion[] = [
  { group: "hiring", text: "H1" },
  { group: "hiring", text: "H2" },
  { group: "project", text: "P1" },
  { group: "project", text: "P2" },
  { group: "project", text: "P3" },
];

/** A repeatable "random" (mulberry32), good enough that nearby seeds give unrelated sequences. */
function seeded(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

test("shuffle keeps every item and does not change the input", () => {
  const input = [1, 2, 3, 4, 5];
  const out = shuffle(input, seeded(7));
  assert.deepEqual([...out].sort(), [1, 2, 3, 4, 5]);
  assert.deepEqual(input, [1, 2, 3, 4, 5]);
});

test("always mixes a hiring question with a project question", () => {
  for (let seed = 1; seed <= 40; seed++) {
    const picks = pickSuggestions(pool, [], 4, seeded(seed));
    assert.equal(picks.length, 4);
    assert.equal(new Set(picks).size, 4, "no duplicates");
    assert.ok(picks.some((p) => p.startsWith("H")), `seed ${seed} has a hiring question`);
    assert.ok(picks.some((p) => p.startsWith("P")), `seed ${seed} has a project question`);
  }
});

test("different seeds give different sets, so visits do not look alike", () => {
  const sets = new Set<string>();
  for (let seed = 1; seed <= 30; seed++) sets.add(pickSuggestions(pool, [], 3, seeded(seed)).sort().join("|"));
  assert.ok(sets.size > 3, `only ${sets.size} distinct sets`);
});

test("never offers a question that was already asked, ignoring case and spacing", () => {
  for (let seed = 1; seed <= 20; seed++) {
    const picks = pickSuggestions(pool, ["h1", "  P2  "], 3, seeded(seed));
    assert.ok(!picks.includes("H1") && !picks.includes("P2"));
  }
});

test("returns fewer when little is left, and an empty list when nothing is", () => {
  assert.deepEqual(pickSuggestions(pool, ["H1", "H2", "P1", "P2"], 4, seeded(1)), ["P3"]);
  assert.deepEqual(pickSuggestions(pool, pool.map((p) => p.text), 4, seeded(1)), []);
});
