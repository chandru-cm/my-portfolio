import assert from "node:assert/strict";
import { test } from "node:test";
import { ContactConfigError, loadContactConfig, TelegramNotifier } from "./contactDeps";

const smtp = { SMTP_USER: "me@gmail.com", SMTP_PASS: "abcd efgh ijkl mnop" };

test("reads SMTP settings, strips the spaces Google puts in an app password, and defaults to Gmail", () => {
  const c = loadContactConfig(smtp, { production: false });
  assert.deepEqual(c.smtp, { host: "smtp.gmail.com", port: 465, user: "me@gmail.com", pass: "abcdefghijklmnop" });
  assert.equal(c.ownerEmail, "me@gmail.com", "messages go to the sending account unless CONTACT_TO is set");
  assert.equal(c.sendConfirmation, true);
  assert.equal(loadContactConfig({ ...smtp, CONTACT_TO: "inbox@example.com" }, { production: false }).ownerEmail, "inbox@example.com");
});

test("needs at least one delivery channel, and paired settings", () => {
  assert.throws(() => loadContactConfig({}, { production: false }), ContactConfigError);
  assert.throws(() => loadContactConfig({ SMTP_USER: "me@gmail.com" }, { production: false }), /SMTP_USER and SMTP_PASS/);
  assert.throws(() => loadContactConfig({ TELEGRAM_BOT_TOKEN: "t" }, { production: false }), /TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID/);
  const alertOnly = loadContactConfig({ TELEGRAM_BOT_TOKEN: "t", TELEGRAM_CHAT_ID: "1" }, { production: false });
  assert.equal(alertOnly.smtp, undefined);
  assert.equal(alertOnly.ownerEmail, "");
});

test("production needs allowed origins and Upstash, and every problem is reported together", () => {
  try {
    loadContactConfig(smtp, { production: true });
    assert.fail("should have thrown");
  } catch (error) {
    const message = (error as Error).message;
    assert.match(message, /ALLOWED_ORIGINS/);
    assert.match(message, /UPSTASH_REDIS_REST_URL/);
    assert.doesNotMatch(message, /abcdefghijklmnop|abcd efgh/, "secret values are never echoed");
  }
});

test("rejects a bad email, a bad port and the confirmation switch", () => {
  assert.throws(() => loadContactConfig({ ...smtp, CONTACT_TO: "not-an-email" }, { production: false }), /CONTACT_TO/);
  assert.throws(() => loadContactConfig({ ...smtp, SMTP_PORT: "abc" }, { production: false }), /SMTP_PORT/);
  assert.equal(loadContactConfig({ ...smtp, CONTACT_CONFIRMATION: "false" }, { production: false }).sendConfirmation, false);
});

test("the Telegram alert posts to the bot API and reports only the status on failure", async () => {
  let url = "";
  let body: any;
  const ok = new TelegramNotifier({ botToken: "SECRET-TOKEN", chatId: "42" }, async (input, init) => {
    url = String(input);
    body = JSON.parse(String(init?.body));
    return new Response("{}", { status: 200 });
  });
  await ok.notify("hello");
  assert.equal(url, "https://api.telegram.org/botSECRET-TOKEN/sendMessage");
  assert.deepEqual(body, { chat_id: "42", text: "hello", disable_web_page_preview: true });

  const failing = new TelegramNotifier({ botToken: "SECRET-TOKEN", chatId: "42" }, async () => new Response("nope", { status: 401 }));
  await assert.rejects(failing.notify("x"), (error: Error) => error.message === "telegram:401" && !/SECRET/.test(error.message));
});
