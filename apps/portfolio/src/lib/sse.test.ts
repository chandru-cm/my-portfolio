import assert from "node:assert/strict";
import { test } from "node:test";
import { SseParser } from "./sse";

const frame = (event: string, data: unknown) => `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;

test("parses several events from one chunk", () => {
  const events = new SseParser().push(frame("meta", { kind: "answer" }) + frame("token", { text: "Hi" }) + frame("done", {}));
  assert.deepEqual(events.map((e) => e.event), ["meta", "token", "done"]);
  assert.deepEqual(events[1].data, { text: "Hi" });
});

test("reassembles an event split across chunks at any boundary", () => {
  const whole = frame("token", { text: "split me" });
  for (let cut = 1; cut < whole.length; cut++) {
    const p = new SseParser();
    const events = [...p.push(whole.slice(0, cut)), ...p.push(whole.slice(cut))];
    assert.equal(events.length, 1, `cut at ${cut}`);
    assert.deepEqual(events[0].data, { text: "split me" });
  }
});

test("emits nothing until the blank line arrives", () => {
  const p = new SseParser();
  assert.deepEqual(p.push('event: token\ndata: {"text":"a"}\n'), []);
  assert.equal(p.push("\n").length, 1);
});

test("handles CRLF line endings", () => {
  const events = new SseParser().push('event: token\r\ndata: {"text":"x"}\r\n\r\n');
  assert.deepEqual(events, [{ event: "token", data: { text: "x" } }]);
});

test("skips malformed JSON and comments without losing later events", () => {
  const events = new SseParser().push(`: keep-alive\n\nevent: token\ndata: {broken\n\n${frame("done", {})}`);
  assert.deepEqual(events.map((e) => e.event), ["done"]);
});

test("text containing newlines survives because data is JSON encoded", () => {
  const events = new SseParser().push(frame("token", { text: "line1\n\nline2" }));
  assert.equal((events[0].data as { text: string }).text, "line1\n\nline2");
});
