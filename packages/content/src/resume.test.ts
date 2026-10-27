import assert from "node:assert/strict";
import { test } from "node:test";
import { projects } from "./projects";
import { toResume } from "./resume";

const everything = () => JSON.stringify(toResume());

test("the resume never contains a phone number", () => {
  assert.doesNotMatch(everything(), /86083|\+91|\b\d{5}\s?\d{5}\b/);
});

test("carries the public contact details and every project", () => {
  const r = toResume();
  assert.equal(r.name, "Chandra Moorthy");
  assert.ok(r.contact.some((c) => c.includes("@")));
  assert.deepEqual(r.projects.map((p) => p.name), projects.map((p) => p.name));
  assert.ok(r.experience[0].dates.endsWith("present"), "the current role is marked present");
});

test("every link is https", () => {
  const links = [...toResume().contact.filter((c) => c.startsWith("http")), ...toResume().projects.flatMap((p) => p.links)];
  assert.ok(links.length > 4);
  assert.ok(links.every((l) => l.startsWith("https://")));
});

test("skills are grouped by area and do not list buzzword filler", () => {
  const labels = toResume().skills.map((s) => s.label);
  assert.equal(labels[0], "Backend");
  assert.doesNotMatch(everything(), /Debugging|Code review/);
});

test("the resume names no technology the site does not claim", () => {
  assert.doesNotMatch(everything(), /Pinecone|Vertex/);
});
