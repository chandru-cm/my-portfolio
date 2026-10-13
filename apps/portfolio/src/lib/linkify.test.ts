import assert from "node:assert/strict";
import { test } from "node:test";
import { linkify } from "./linkify";

test("plain text is a single text segment", () => {
  assert.deepEqual(linkify("Nothing to link here."), [{ type: "text", value: "Nothing to link here." }]);
  assert.deepEqual(linkify(""), []);
});

test("finds emails and URLs and keeps surrounding text", () => {
  assert.deepEqual(linkify("Email a@b.com or see https://github.com/x/y now"), [
    { type: "text", value: "Email " },
    { type: "email", value: "a@b.com" },
    { type: "text", value: " or see " },
    { type: "url", value: "https://github.com/x/y" },
    { type: "text", value: " now" },
  ]);
});

test("sentence punctuation after a link is not part of it", () => {
  assert.deepEqual(linkify("Visit https://example.com/page."), [
    { type: "text", value: "Visit " },
    { type: "url", value: "https://example.com/page" },
    { type: "text", value: "." },
  ]);
  assert.deepEqual(linkify("(https://example.com)"), [
    { type: "text", value: "(" },
    { type: "url", value: "https://example.com" },
    { type: "text", value: ")" },
  ]);
});

test("non-http schemes are never linked", () => {
  const segments = linkify("javascript:alert(1) and ftp://x.com and data:text/html,hi");
  assert.ok(segments.every((s) => s.type === "text"));
});

test("segments always reassemble to the original text", () => {
  const text = "Mail me at x.y@z.org, or https://a.com/b?c=d, thanks.";
  assert.equal(linkify(text).map((s) => s.value).join(""), text);
});
