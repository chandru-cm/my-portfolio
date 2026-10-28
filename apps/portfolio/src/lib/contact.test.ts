import assert from "node:assert/strict";
import { test } from "node:test";
import { emptyDraft, sendContact, toPayload, validateDraft, type ContactDraft } from "./contact";

const good: ContactDraft = { ...emptyDraft, name: "Jane Doe", email: "jane@company.com", message: "We are hiring a backend engineer." };

test("validates in the same order and words as the server", () => {
  assert.equal(validateDraft(good), null);
  assert.equal(validateDraft({ ...good, name: " " }), "Enter your name.");
  assert.equal(validateDraft({ ...good, email: "jane@x" }), "Enter a valid email so I can reply.");
  assert.equal(validateDraft({ ...good, message: "short" }), "Add a short message, at least 10 characters.");
  assert.equal(validateDraft({ ...good, message: "x".repeat(2001) }), "Your message is too long. Keep it under 2000 characters.");
});

test("a call request needs a date, a message does not", () => {
  assert.equal(validateDraft({ ...good, kind: "call", date: "" }), "Pick a preferred date for the call.");
  assert.equal(validateDraft({ ...good, kind: "call", date: "2026-11-03" }), null);
});

test("the payload trims text, carries the trap fields, and only a call has a preferred time", () => {
  const message = toPayload({ ...good, name: "  Jane  " }, "", 4200);
  assert.equal(message.name, "Jane");
  assert.equal(message.website, "");
  assert.equal(message.elapsedMs, 4200);
  assert.equal("preferred" in message, false);

  const call = toPayload({ ...good, kind: "call", date: "2026-11-03", time: "", timeZone: "UK" }, "", 5000);
  assert.deepEqual(call.preferred, { date: "2026-11-03", time: undefined, timeZone: "UK" });
});

test("a successful send resolves ok", async () => {
  const result = await sendContact("/api/contact", toPayload(good, "", 5000), async () => new Response('{"ok":true}', { status: 200 }));
  assert.deepEqual(result, { ok: true });
});

test("a rejected form can be fixed and retried, while a server problem points to email", async () => {
  const bad = await sendContact("/x", toPayload(good, "", 5000), async () => new Response('{"error":{"message":"Enter your name."}}', { status: 400 }));
  assert.deepEqual(bad, { ok: false, message: "Enter your name.", fallback: false });

  const down = await sendContact("/x", toPayload(good, "", 5000), async () => new Response("<html>", { status: 502 }));
  assert.equal(down.ok === false && down.fallback, true);

  const limited = await sendContact("/x", toPayload(good, "", 5000), async () => new Response('{"error":{"message":"Too many messages"}}', { status: 429 }));
  assert.equal(limited.ok === false && limited.fallback, true);
});

test("a network failure becomes a readable message with the email fallback", async () => {
  const result = await sendContact("/x", toPayload(good, "", 5000), async () => {
    throw new TypeError("Failed to fetch");
  });
  assert.equal(result.ok, false);
  assert.equal(result.ok === false && result.fallback, true);
  assert.match(result.ok === false ? result.message : "", /email me directly/i);
});

// ---- Phone and channel --------------------------------------------------------------------

import { makeDraft, dialFor } from "./contact";

test("the country starts from the visitor's browser languages", () => {
  assert.equal(makeDraft(["en-IN", "en"]).country, "IN");
  assert.equal(makeDraft(["de-DE"]).country, "DE");
  assert.equal(makeDraft([]).country, "IN", "India is the default");
  assert.equal(dialFor("IN"), "+91");
  assert.equal(dialFor("CA"), "+1", "Canada and the US share a code but stay separate choices");
});

test("a phone number is optional for email, and required for WhatsApp or a phone call", () => {
  assert.equal(validateDraft({ ...good, phone: "" }), null);
  assert.equal(validateDraft({ ...good, channel: "whatsapp", phone: "" }), "Add your phone number so I can reach you on WhatsApp.");
  assert.equal(validateDraft({ ...good, channel: "phone", phone: "" }), "Add your phone number so I can reach you by phone.");
  assert.equal(validateDraft({ ...good, channel: "whatsapp", country: "IN", phone: "98765 43210" }), null);
});

test("a number that is typed is checked even when email is the preferred channel", () => {
  assert.equal(validateDraft({ ...good, country: "IN", phone: "call me" }), "Use digits only in your phone number.");
  assert.match(validateDraft({ ...good, country: "IN", phone: "123" }) ?? "", /does not look right/);
});

test("the payload carries the channel and the phone with its country code", () => {
  const p = toPayload({ ...good, channel: "whatsapp", country: "IN", phone: " 98765 43210 " }, "", 5000);
  assert.equal(p.channel, "whatsapp");
  assert.deepEqual(p.phone, { dial: "+91", number: "98765 43210" });
  const none = toPayload(good, "", 5000);
  assert.equal(none.channel, "email");
  assert.equal("phone" in none, false);
});

