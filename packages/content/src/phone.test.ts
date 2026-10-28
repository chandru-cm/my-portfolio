import assert from "node:assert/strict";
import { test } from "node:test";
import { countries, guessCountry, normalizePhone, regionFromLocale } from "./phone";

test("the country list has unique codes and valid dial prefixes", () => {
  assert.equal(new Set(countries.map((c) => c.iso)).size, countries.length);
  for (const c of countries) assert.match(c.dial, /^\+\d{1,4}$/, c.name);
  assert.deepEqual(
    countries.map((c) => c.name),
    [...countries.map((c) => c.name)].sort((a, b) => a.localeCompare(b)),
    "sorted by name for the picker"
  );
});

test("reads the region from a locale", () => {
  assert.equal(regionFromLocale("en-IN"), "IN");
  assert.equal(regionFromLocale("pt_BR"), "BR");
  assert.equal(regionFromLocale("en"), undefined);
  assert.equal(regionFromLocale(undefined), undefined);
});

test("pre-selects the visitor's country from their languages, and falls back to India", () => {
  assert.equal(guessCountry(["en-GB", "en"]).dial, "+44");
  assert.equal(guessCountry(["en", "ta-IN"]).iso, "IN", "skips a locale without a region and finds the next");
  assert.equal(guessCountry(["en-XX"]).iso, "IN", "an unknown region falls back");
  assert.equal(guessCountry([]).iso, "IN");
});

test("normalises common ways of typing a number", () => {
  const r = normalizePhone({ dial: "+91", number: "98765 43210" });
  assert.deepEqual(r, { ok: true, phone: { dial: "+91", national: "9876543210", e164: "+919876543210", display: "+91 9876543210" } });
  const us = normalizePhone({ dial: "+1", number: "(415) 555-0132" });
  assert.equal(us.ok && us.phone.e164, "+14155550132");
});

test("drops a local trunk zero, except for Italy where it belongs to the number", () => {
  const uk = normalizePhone({ dial: "+44", number: "07911 123456" });
  assert.equal(uk.ok && uk.phone.e164, "+447911123456");
  const it = normalizePhone({ dial: "+39", number: "06 1234 5678" });
  assert.equal(it.ok && it.phone.e164, "+390612345678");
});

test("rejects letters, a missing country code, and numbers that are too short or too long", () => {
  const bad = (dial: string, number: string) => normalizePhone({ dial, number });
  assert.equal(bad("+91", "call me").ok, false);
  assert.equal(bad("91", "9876543210").ok, false);
  assert.equal(bad("", "9876543210").ok, false);
  assert.equal(bad("+91", "12345").ok, false);
  assert.equal(bad("+91", "1".repeat(14)).ok, false, "15 digits is the limit including the country code");
  assert.equal(bad("+91", "1".repeat(13)).ok, true);
  assert.equal(bad("+91", "98765+43210").ok, false);
});

import { searchCountries, suggestedCountries } from "./phone";

test("searching finds a country by name, ISO code or dial code, best match first", () => {
  assert.deepEqual(searchCountries("ind").map((c) => c.iso).slice(0, 2), ["IN", "ID"], "India, then Indonesia");
  assert.equal(searchCountries("+44")[0].iso, "GB");
  assert.equal(searchCountries("91")[0].iso, "IN");
  assert.equal(searchCountries("gb")[0].iso, "GB");
  assert.deepEqual(searchCountries("united").map((c) => c.iso), ["AE", "GB", "US"]);
  assert.deepEqual(searchCountries("arab").map((c) => c.iso), ["SA", "AE"], "matches the start of any word in the name");
  assert.deepEqual(searchCountries("zzzz"), []);
  assert.equal(searchCountries("  ").length, countries.length, "an empty search shows everything");
});

test("suggestions start with the visitor's country, have no repeats, and stay short", () => {
  const s = suggestedCountries("DE").map((c) => c.iso);
  assert.equal(s[0], "DE");
  assert.equal(new Set(s).size, s.length);
  assert.equal(s.length, 6);
  assert.deepEqual(suggestedCountries("IN").map((c) => c.iso).slice(0, 3), ["IN", "US", "GB"]);
  assert.equal(suggestedCountries("XX")[0].iso, "IN", "an unknown country is skipped");
});
