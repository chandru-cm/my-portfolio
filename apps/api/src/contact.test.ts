import assert from "node:assert/strict";
import { test } from "node:test";
import { handleContact, parseContact, type ContactDeps, type Mailer, type Notifier, type OutgoingMail } from "./contact";
import { InMemoryRateLimiter } from "./limiter";

const SITE = "https://site.example";

class FakeMailer implements Mailer {
  sent: OutgoingMail[] = [];
  constructor(private readonly failOn: "all" | "confirmation" | null = null) {}
  async send(mail: OutgoingMail) {
    if (this.failOn === "all") throw new Error("smtp down");
    if (this.failOn === "confirmation" && mail.to !== "owner@example.com") throw new Error("bad recipient");
    this.sent.push(mail);
  }
}

class FakeNotifier implements Notifier {
  texts: string[] = [];
  constructor(private readonly fail = false) {}
  async notify(text: string) {
    if (this.fail) throw new Error("telegram:500");
    this.texts.push(text);
  }
}

function makeDeps(overrides: Partial<ContactDeps> = {}): ContactDeps {
  return {
    config: { allowedOrigins: [SITE], allowMissingOrigin: false, maxBodyBytes: 8192, ownerEmail: "owner@example.com", sendConfirmation: true, siteUrl: SITE },
    mailer: new FakeMailer(),
    notifier: new FakeNotifier(),
    limits: {
      perMinute: new InMemoryRateLimiter(1000, 60_000),
      perDay: new InMemoryRateLimiter(1000, 86_400_000),
      global: new InMemoryRateLimiter(1000, 86_400_000),
    },
    now: () => new Date("2026-11-01T10:00:00Z"),
    ...overrides,
  };
}

const GOOD = { name: "Jane Doe", email: "jane@company.com", topic: "Job opportunity", message: "We are hiring a remote backend engineer." };

function post(body: unknown, headers: Record<string, string> = {}): Request {
  return new Request("https://api.test/api/contact", {
    method: "POST",
    headers: { origin: SITE, "content-type": "application/json", ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}
const errorOf = async (res: Response) => (await res.json()).error as { code: string; message: string };

// ---- Validation --------------------------------------------------------------------------

test("accepts a valid message and rejects each missing or bad field with a plain message", () => {
  assert.equal(parseContact(JSON.stringify(GOOD)).ok, true);
  const bad = (patch: object) => parseContact(JSON.stringify({ ...GOOD, ...patch }));
  assert.deepEqual(bad({ name: "  " }), { ok: false, message: "Enter your name." });
  assert.deepEqual(bad({ email: "jane@x" }), { ok: false, message: "Enter a valid email so I can reply." });
  assert.deepEqual(bad({ message: "short" }), { ok: false, message: "Add a short message, at least 10 characters." });
  assert.equal((bad({ message: "x".repeat(2001) }) as { ok: false }).ok, false);
  assert.equal((parseContact("not json") as { ok: false }).ok, false);
});

test("an unknown topic becomes Other, and a call request needs a date", () => {
  const r = parseContact(JSON.stringify({ ...GOOD, topic: "Free crypto" }));
  assert.equal(r.ok === true && r.request.topic, "Other");
  const noDate = parseContact(JSON.stringify({ ...GOOD, kind: "call", preferred: { time: "10:00" } }));
  assert.deepEqual(noDate, { ok: false, message: "Pick a preferred date for the call." });
  const call = parseContact(JSON.stringify({ ...GOOD, kind: "call", preferred: { date: "2026-11-03", time: "15:30", timeZone: "US Eastern" } }));
  assert.equal(call.ok === true && call.request.preferred?.time, "15:30");
});

// ---- Handler: origin, method, size, limits -----------------------------------------------

test("rejects other origins, wrong methods and oversized bodies", async () => {
  assert.equal((await handleContact(post(GOOD, { origin: "https://evil.example" }), makeDeps())).status, 403);
  const get = await handleContact(new Request("https://api.test/api/contact", { method: "GET", headers: { origin: SITE } }), makeDeps());
  assert.equal(get.status, 405);
  const big = await handleContact(post({ ...GOOD, message: "x".repeat(9000) }), makeDeps());
  assert.equal(big.status, 413);
});

test("answers CORS preflight only for an allowed origin", async () => {
  const res = await handleContact(new Request("https://api.test/api/contact", { method: "OPTIONS", headers: { origin: SITE } }), makeDeps());
  assert.equal(res.status, 204);
  assert.equal(res.headers.get("access-control-allow-origin"), SITE);
});

test("rate limits a visitor and tells them to email instead", async () => {
  const deps = makeDeps({ limits: { perMinute: new InMemoryRateLimiter(1, 60_000), perDay: new InMemoryRateLimiter(100, 1e9), global: new InMemoryRateLimiter(100, 1e9) } });
  assert.equal((await handleContact(post(GOOD), deps)).status, 200);
  const second = await handleContact(post(GOOD), deps);
  assert.equal(second.status, 429);
  assert.ok(second.headers.get("retry-after"));
  assert.match((await errorOf(second)).message, /email/i);
});

// ---- Delivery ------------------------------------------------------------------------------

test("a message reaches the owner by email and phone alert, and the visitor gets a receipt", async () => {
  const mailer = new FakeMailer();
  const notifier = new FakeNotifier();
  const res = await handleContact(post({ ...GOOD, elapsedMs: 9000 }), makeDeps({ mailer, notifier }));
  assert.equal(res.status, 200);
  assert.deepEqual((await res.json()).delivered, ["email", "alert"]);

  const [toOwner, receipt] = mailer.sent;
  assert.equal(toOwner.to, "owner@example.com");
  assert.match(toOwner.subject, /Job opportunity from Jane Doe/);
  assert.match(toOwner.replyTo ?? "", /jane@company\.com/);
  assert.match(toOwner.text, /We are hiring a remote backend engineer\./);
  assert.equal(receipt.to, "jane@company.com");
  assert.match(receipt.text, /^Hi Jane,/);
  assert.match(notifier.texts[0], /Jane Doe <jane@company\.com>/);
});

test("a call request carries the preferred time into the subject and the alert", async () => {
  const mailer = new FakeMailer();
  const notifier = new FakeNotifier();
  const body = { ...GOOD, kind: "call", preferred: { date: "2026-11-03", time: "15:30", timeZone: "US Eastern" } };
  assert.equal((await handleContact(post(body), makeDeps({ mailer, notifier }))).status, 200);
  assert.match(mailer.sent[0].subject, /Call request from Jane Doe, 2026-11-03 15:30 \(US Eastern\)/);
  assert.match(notifier.texts[0], /When: 2026-11-03 15:30/);
});

test("a visitor cannot inject headers through the name or email", async () => {
  const mailer = new FakeMailer();
  const body = { ...GOOD, name: "Jane\r\nBcc: victim@example.com", email: "jane@company.com" };
  assert.equal((await handleContact(post(body), makeDeps({ mailer }))).status, 200);
  assert.doesNotMatch(mailer.sent[0].subject, /[\r\n]/);
  assert.doesNotMatch(mailer.sent[0].replyTo ?? "", /[\r\n]/);
  const injectedEmail = await handleContact(post({ ...GOOD, email: "a@b.com\r\nBcc: v@x.com" }), makeDeps());
  assert.equal(injectedEmail.status, 400);
});

test("succeeds when only the phone alert gets through, and fails clearly when nothing does", async () => {
  const onlyAlert = await handleContact(post(GOOD), makeDeps({ mailer: new FakeMailer("all") }));
  assert.equal(onlyAlert.status, 200);
  assert.deepEqual((await onlyAlert.json()).delivered, ["alert"]);

  const none = await handleContact(post(GOOD), makeDeps({ mailer: new FakeMailer("all"), notifier: new FakeNotifier(true) }));
  assert.equal(none.status, 502);
  const err = await errorOf(none);
  assert.equal(err.code, "upstream_error");
  assert.match(err.message, /email me directly/i);
  assert.doesNotMatch(err.message, /smtp|telegram/i, "internal service names stay out of the response");
});

test("a failed receipt never fails the request", async () => {
  const res = await handleContact(post(GOOD), makeDeps({ mailer: new FakeMailer("confirmation") }));
  assert.equal(res.status, 200);
});

test("does not email the visitor when confirmations are switched off", async () => {
  const mailer = new FakeMailer();
  const deps = makeDeps({ mailer });
  deps.config.sendConfirmation = false;
  await handleContact(post(GOOD), deps);
  assert.equal(mailer.sent.length, 1);
});

// ---- Spam ---------------------------------------------------------------------------------

test("the hidden field and an instant submit look like success but send nothing", async () => {
  for (const extra of [{ website: "http://spam.example" }, { elapsedMs: 200 }]) {
    const mailer = new FakeMailer();
    const notifier = new FakeNotifier();
    const res = await handleContact(post({ ...GOOD, ...extra }), makeDeps({ mailer, notifier }));
    assert.equal(res.status, 200);
    assert.deepEqual((await res.json()).delivered, []);
    assert.equal(mailer.sent.length + notifier.texts.length, 0);
  }
});

// ---- Privacy -----------------------------------------------------------------------------

test("logs carry the status and channels only, never the visitor's details", async () => {
  const lines: string[] = [];
  await handleContact(post(GOOD), makeDeps({ log: (e) => lines.push(JSON.stringify(e)) }));
  assert.equal(lines.length, 1);
  assert.doesNotMatch(lines[0], /Jane|jane@|hiring/);
  assert.match(lines[0], /"channels":\["email","alert"\]/);
});

test("a failed channel is logged by error code only, so a login problem can be diagnosed without leaking anything", async () => {
  class AuthFailure extends Error {
    code = "EAUTH";
    constructor() {
      super("Invalid login for jane@company.com: password hunter2");
    }
  }
  const failing: Mailer = {
    async send() {
      throw new AuthFailure();
    },
  };
  const lines: string[] = [];
  const res = await handleContact(post(GOOD), makeDeps({ mailer: failing, notifier: undefined, log: (e) => lines.push(JSON.stringify(e)) }));
  assert.equal(res.status, 502);
  assert.match(lines[0], /"failed":\["email:EAUTH"\]/);
  assert.doesNotMatch(lines[0], /hunter2|jane@|Invalid login/);
});

test("when only email is configured, no alert is attempted", async () => {
  const mailer = new FakeMailer();
  const res = await handleContact(post(GOOD), makeDeps({ mailer, notifier: undefined }));
  assert.deepEqual((await res.json()).delivered, ["email"]);
});

// ---- Email design -------------------------------------------------------------------------

test("every email carries a designed HTML version and a plain-text version", async () => {
  const mailer = new FakeMailer();
  await handleContact(post(GOOD), makeDeps({ mailer }));
  for (const mail of mailer.sent) {
    assert.ok(mail.text.length > 20);
    assert.match(mail.html ?? "", /^<!doctype html>/i);
    assert.match(mail.html ?? "", /prefers-color-scheme: dark/, "has a dark-mode style");
    assert.doesNotMatch(mail.html ?? "", /<script|<img|javascript:|<link/i, "no scripts, remote images or external styles");
  }
});

test("visitor text is escaped in the HTML, so a message can never inject markup", async () => {
  const mailer = new FakeMailer();
  const nasty = { ...GOOD, name: `Jane <b>Doe</b>`, message: `<script>alert(1)</script> & "quotes" and <a href="javascript:x">click</a>` };
  assert.equal((await handleContact(post(nasty), makeDeps({ mailer }))).status, 200);
  for (const mail of mailer.sent) {
    const html = mail.html ?? "";
    assert.doesNotMatch(html, /<script>alert/);
    assert.doesNotMatch(html, /<b>Doe/);
    assert.doesNotMatch(html, /<a href="javascript/);
  }
  assert.match(mailer.sent[0].html ?? "", /&lt;script&gt;alert\(1\)&lt;\/script&gt; &amp; &quot;quotes&quot;/);
});

test("the owner email has a one-tap reply link and, for a call, the preferred time", async () => {
  const mailer = new FakeMailer();
  const body = { ...GOOD, kind: "call", preferred: { date: "2026-11-03", time: "15:30", timeZone: "US Eastern" } };
  await handleContact(post(body), makeDeps({ mailer }));
  const html = mailer.sent[0].html ?? "";
  assert.match(html, /href="mailto:jane@company\.com\?subject=Re%3A/);
  assert.match(html, /Reply to Jane/);
  assert.match(html, /Tue, 3 Nov 2026/);
  assert.match(html, /15:30/);
  assert.match(html, /US Eastern time zone/);
  assert.match(html, /Requested time/i);
  assert.match(html, /would like a call/);
});

test("the visitor receipt repeats what they sent, says what happens next, and links to the site", async () => {
  const mailer = new FakeMailer();
  await handleContact(post(GOOD), makeDeps({ mailer }));
  const html = mailer.sent[1].html ?? "";
  assert.match(html, /Thanks, Jane/);
  assert.match(html, /We are hiring a remote backend engineer\./);
  assert.match(html, /What happens next/);
  assert.match(html, new RegExp(`href="${SITE.replace(/\./g, "\.")}"`));
});

test("the receipt leaves out the site link when no address is configured", async () => {
  const mailer = new FakeMailer();
  const deps = makeDeps({ mailer });
  deps.config.siteUrl = "";
  await handleContact(post(GOOD), deps);
  assert.doesNotMatch(mailer.sent[1].html ?? "", />Portfolio<\/a>/);
});

// ---- Phone and WhatsApp -------------------------------------------------------------------

const WITH_PHONE = { ...GOOD, channel: "whatsapp", phone: { dial: "+91", number: "98765 43210" } };

test("accepts a phone number, normalises it, and requires one for WhatsApp or phone", () => {
  const ok = parseContact(JSON.stringify(WITH_PHONE));
  assert.equal(ok.ok === true && ok.request.phone?.e164, "+919876543210");
  assert.equal(ok.ok === true && ok.request.channel, "whatsapp");

  assert.deepEqual(parseContact(JSON.stringify({ ...GOOD, channel: "whatsapp" })), { ok: false, message: "Add your phone number so I can reach you on WhatsApp." });
  assert.deepEqual(parseContact(JSON.stringify({ ...GOOD, channel: "phone" })), { ok: false, message: "Add your phone number so I can reach you by phone." });
  const emailOnly = parseContact(JSON.stringify({ ...GOOD, channel: "email" }));
  assert.equal(emailOnly.ok === true && emailOnly.request.phone, undefined);
  const unknownChannel = parseContact(JSON.stringify({ ...GOOD, channel: "telegram" }));
  assert.equal(unknownChannel.ok === true && unknownChannel.request.channel, "email");
});

test("rejects a bad phone number with a plain message", () => {
  const bad = (number: string, dial = "+91") => parseContact(JSON.stringify({ ...GOOD, phone: { dial, number } }));
  assert.deepEqual(bad("not a number"), { ok: false, message: "Use digits only in your phone number." });
  assert.equal((bad("123") as { ok: false }).ok, false);
  assert.equal((bad("9876543210", "91") as { ok: false }).ok, false);
  assert.equal((bad("9876543210", "+91; DROP") as { ok: false }).ok, false);
});

test("the owner email puts WhatsApp first for a WhatsApp visitor, with working WhatsApp and call links", async () => {
  const mailer = new FakeMailer();
  await handleContact(post(WITH_PHONE), makeDeps({ mailer }));
  const html = mailer.sent[0].html ?? "";
  assert.match(html, /href="https:\/\/wa\.me\/919876543210\?text=Hi%20Jane%2C/);
  assert.match(html, /href="tel:\+919876543210"/);
  assert.match(html, /Prefers WhatsApp/);
  assert.ok(html.indexOf(">WhatsApp<") < html.indexOf(">Reply by email<"), "the preferred channel comes first");
  assert.match(mailer.sent[0].text, /Phone: \+91 9876543210/);
  assert.match(mailer.sent[0].text, /Best way to reach them: WhatsApp/);
});

test("without a phone, the owner email has just the reply button", async () => {
  const mailer = new FakeMailer();
  await handleContact(post(GOOD), makeDeps({ mailer }));
  const html = mailer.sent[0].html ?? "";
  assert.doesNotMatch(html, /wa\.me|tel:/);
  assert.match(html, /Reply to Jane/);
});

test("the receipt and the phone alert mention the number, and the log never does", async () => {
  const mailer = new FakeMailer();
  const notifier = new FakeNotifier();
  const lines: string[] = [];
  await handleContact(post(WITH_PHONE), makeDeps({ mailer, notifier, log: (e) => lines.push(JSON.stringify(e)) }));
  assert.match(mailer.sent[1].text, /by WhatsApp on \+91 9876543210/);
  assert.match(mailer.sent[1].html ?? "", /WhatsApp on <strong>\+91 9876543210/);
  assert.match(notifier.texts[0], /WhatsApp: \+91 9876543210/);
  assert.doesNotMatch(lines[0], /9876543210|\+91/);
});

test("with no phone, the receipt says the reply goes by email, to the address they gave", async () => {
  const mailer = new FakeMailer();
  await handleContact(post(GOOD), makeDeps({ mailer }));
  assert.match(mailer.sent[1].text, /by email at jane@company\.com/);
  assert.match(mailer.sent[1].html ?? "", /by email at <strong>jane@company\.com<\/strong>/);
});

test("the response says whether the visitor's receipt went out, so the page never claims more than is true", async () => {
  const sent = await handleContact(post(GOOD), makeDeps());
  assert.equal((await sent.json()).receipt, "sent");

  const failedReceipt = await handleContact(post(GOOD), makeDeps({ mailer: new FakeMailer("confirmation") }));
  assert.equal(failedReceipt.status, 200, "a failed receipt never fails the request");
  assert.equal((await failedReceipt.json()).receipt, "failed");

  const off = makeDeps();
  off.config.sendConfirmation = false;
  assert.equal((await (await handleContact(post(GOOD), off)).json()).receipt, "off");

  const alertOnly = makeDeps({ mailer: undefined });
  assert.equal((await (await handleContact(post(GOOD), alertOnly)).json()).receipt, "off", "no mailer means no receipt");
});
