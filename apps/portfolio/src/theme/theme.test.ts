import assert from "node:assert/strict";
import { test } from "node:test";
import { applyTheme, nextPref, parsePref, readPref, resolveTheme, STORAGE_KEY, writePref } from "./theme";

test("parsePref accepts the three modes and falls back to system for anything else", () => {
  assert.equal(parsePref("light"), "light");
  assert.equal(parsePref("dark"), "dark");
  assert.equal(parsePref("system"), "system");
  for (const bad of [null, undefined, "", "blue", 5, {}]) assert.equal(parsePref(bad), "system");
});

test("an explicit choice wins over the system setting; system follows it", () => {
  assert.equal(resolveTheme("light", true), "light");
  assert.equal(resolveTheme("dark", false), "dark");
  assert.equal(resolveTheme("system", true), "dark");
  assert.equal(resolveTheme("system", false), "light");
});

test("the toggle cycles system, light, dark, then back to system", () => {
  assert.equal(nextPref("system"), "light");
  assert.equal(nextPref("light"), "dark");
  assert.equal(nextPref("dark"), "system");
});

test("preferences round-trip through storage", () => {
  const data = new Map<string, string>();
  const storage = { getItem: (k: string) => data.get(k) ?? null, setItem: (k: string, v: string) => void data.set(k, v) };
  assert.equal(readPref(storage), "system");
  writePref("dark", storage);
  assert.equal(data.get(STORAGE_KEY), "dark");
  assert.equal(readPref(storage), "dark");
});

test("blocked or throwing storage never breaks the page", () => {
  const broken = {
    getItem: () => {
      throw new Error("blocked");
    },
    setItem: () => {
      throw new Error("blocked");
    },
  };
  assert.equal(readPref(broken), "system");
  assert.doesNotThrow(() => writePref("dark", broken));
});

test("applyTheme returns the resolved theme and is safe without a document", () => {
  assert.equal(applyTheme("system", true), "dark");
  assert.equal(applyTheme("light", true), "light");
});
