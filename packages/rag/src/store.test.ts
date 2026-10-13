import assert from "node:assert/strict";
import { test } from "node:test";
import { InMemoryVectorStore } from "./inMemoryStore";
import { indexDocuments } from "./ingest";
import { LexicalEmbedder } from "./lexicalEmbedder";
import { cosine, normalize } from "./similarity";

test("cosine: identical is 1, orthogonal is 0, zero vector is 0", () => {
  assert.ok(Math.abs(cosine([1, 2, 3], [1, 2, 3]) - 1) < 1e-9);
  assert.equal(cosine([1, 0], [0, 1]), 0);
  assert.equal(cosine([0, 0], [1, 1]), 0);
  assert.throws(() => cosine([1], [1, 2]), RangeError);
});

test("normalize returns a unit vector and leaves zero vectors alone", () => {
  const n = normalize([3, 4]);
  assert.ok(Math.abs(Math.hypot(...n) - 1) < 1e-9);
  assert.deepEqual(normalize([0, 0]), [0, 0]);
});

test("store returns nearest first and respects topK", async () => {
  const store = new InMemoryVectorStore();
  const meta = (id: string) => ({ docId: id, source: "s", title: id, text: id, index: 0 });
  await store.upsert([
    { id: "far", values: [0, 1], metadata: meta("far") },
    { id: "near", values: [1, 0.1], metadata: meta("near") },
  ]);
  const hits = await store.query([1, 0], 1);
  assert.equal(hits.length, 1);
  assert.equal(hits[0].id, "near");
  assert.deepEqual(await store.query([1, 0], 0), []);
});

test("indexing twice is idempotent: no duplicate records", async () => {
  const docs = [
    { id: "a", source: "x", title: "A", text: "Alpha text about rentals." },
    { id: "b", source: "x", title: "B", text: "Beta text about schools." },
  ];
  const store = new InMemoryVectorStore();
  const emb = new LexicalEmbedder();
  await indexDocuments(docs, emb, store);
  await indexDocuments(docs, emb, store);
  assert.equal(store.size, 2);
});

test("reset removes records that no longer exist in the source", async () => {
  const store = new InMemoryVectorStore();
  const emb = new LexicalEmbedder();
  await indexDocuments([{ id: "old", source: "x", title: "Old", text: "Old content here." }], emb, store);
  await indexDocuments([{ id: "new", source: "x", title: "New", text: "New content here." }], emb, store, { reset: true });
  assert.equal(store.size, 1);
});

test("lexical embedder is deterministic and unit length", async () => {
  const emb = new LexicalEmbedder(64);
  const [a] = await emb.embed(["payment workflows in rentals"], "query");
  const [b] = await emb.embed(["payment workflows in rentals"], "query");
  assert.deepEqual(a, b);
  assert.ok(Math.abs(Math.hypot(...a) - 1) < 1e-9);
});
