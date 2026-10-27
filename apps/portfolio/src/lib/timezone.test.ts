import assert from "node:assert/strict";
import { test } from "node:test";
import { clock, offsetMinutes, overlap } from "./timezone";

// IST 10:00–19:00 is 04:30–13:30 UTC.
const WORK = { start: 4 * 60 + 30, end: 13 * 60 + 30 };
const winter = new Date("2026-01-15T12:00:00Z");
const summer = new Date("2026-07-15T12:00:00Z");

test("offsets follow daylight-saving time", () => {
  assert.equal(offsetMinutes("Europe/Berlin", winter), 60);
  assert.equal(offsetMinutes("Europe/Berlin", summer), 120);
  assert.equal(offsetMinutes("America/New_York", winter), -300);
  assert.equal(offsetMinutes("America/New_York", summer), -240);
  assert.equal(offsetMinutes("Asia/Kolkata", winter), 330);
});

test("Central Europe overlaps for most of the morning, in winter and summer", () => {
  assert.equal(overlap("Europe/Berlin", WORK, winter).minutes, 5 * 60 + 30); // 08:00–13:30 UTC
  assert.equal(overlap("Europe/Berlin", WORK, summer).minutes, 6 * 60 + 30); // 07:00–13:30 UTC
});

test("the United Kingdom overlaps until my day ends at 13:30 UTC", () => {
  assert.equal(overlap("Europe/London", WORK, winter).minutes, 4 * 60 + 30);
  assert.equal(overlap("Europe/London", WORK, summer).minutes, 5 * 60 + 30); // 08:00–13:30 UTC
});

test("US Eastern shares none in winter and half an hour in summer, and the US Pacific shares none", () => {
  assert.equal(overlap("America/New_York", WORK, winter).minutes, 0);
  assert.equal(overlap("America/New_York", WORK, summer).minutes, 30); // 13:00–13:30 UTC
  assert.equal(overlap("America/Los_Angeles", WORK, winter).minutes, 0);
});

test("my day is written in their local time", () => {
  const o = overlap("Europe/Berlin", WORK, winter);
  assert.equal(clock(o.mineStart), "05:30");
  assert.equal(clock(o.mineEnd), "14:30");
  assert.equal(clock(-30), "23:30");
  assert.equal(clock(24 * 60 + 15), "00:15");
});
