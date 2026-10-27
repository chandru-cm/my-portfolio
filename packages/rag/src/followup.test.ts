import assert from "node:assert/strict";
import { test } from "node:test";
import { searchQuery } from "./followup";

const history = [
  { role: "user" as const, text: "What did Chandra Moorthy build on SociBooks?" },
  { role: "assistant" as const, text: "They built expense approval and statements." },
];

test("a question that stands alone is searched as written", () => {
  const q = searchQuery("Which time zones can Chandra Moorthy work with?", history);
  assert.equal(q.text, "Which time zones can Chandra Moorthy work with?");
  assert.equal(q.followUp, false);
});

test("a short follow-up carries the previous question", () => {
  const q = searchQuery("and the stack?", history);
  assert.equal(q.followUp, true);
  assert.match(q.text, /SociBooks/);
  assert.match(q.text, /and the stack\?/);
});

test("a longer question that points back is also joined", () => {
  const q = searchQuery("What database does that product use for the ledger data?", history);
  assert.equal(q.followUp, true);
});

test("with no earlier question there is nothing to join", () => {
  assert.equal(searchQuery("more", []).followUp, false);
});

test("the joined query stays bounded", () => {
  const long = [{ role: "user" as const, text: "x".repeat(2000) }];
  assert.ok(searchQuery("and that?", long).text.length <= 400);
});
