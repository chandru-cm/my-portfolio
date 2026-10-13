import assert from "node:assert/strict";
import { test } from "node:test";
import { PineconeStore } from "./pinecone";

test("rejects a host URL given as the index name", () => {
  assert.throws(
    () => new PineconeStore({ apiKey: "k", indexName: "https://portfolio-abc.svc.example.pinecone.io" }),
    /index name.*not its host URL/
  );
  assert.throws(() => new PineconeStore({ apiKey: "k", indexName: "portfolio-abc.svc.example.pinecone.io" }), /host URL/);
});

test("requires an api key and an index name", () => {
  assert.throws(() => new PineconeStore({ apiKey: "", indexName: "portfolio" }), /PINECONE_API_KEY/);
  assert.throws(() => new PineconeStore({ apiKey: "k", indexName: "" }), /PINECONE_INDEX/);
});

test("accepts a plain index name without contacting the network", () => {
  assert.doesNotThrow(() => new PineconeStore({ apiKey: "k", indexName: "portfolio" }));
});
