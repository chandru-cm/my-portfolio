import assert from "node:assert/strict";
import { test } from "node:test";
import { palette, shared, themeColor, tokensToCss, type ThemeName } from "./tokens";

/** WCAG relative luminance and contrast ratio. */
function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const themes: ThemeName[] = ["light", "dark"];

test("both themes define exactly the same set of colours", () => {
  assert.deepEqual(Object.keys(palette.light).sort(), Object.keys(palette.dark).sort());
});

test("every colour is a 6-digit hex value", () => {
  for (const t of themes) for (const [k, v] of Object.entries(palette[t])) assert.match(v, /^#[0-9a-f]{6}$/i, `${t}.${k} = ${v}`);
});

// Pairs the stylesheet actually uses as text on a background. WCAG AA for normal text is 4.5.
const TEXT_ON_BACKGROUND: [string, string][] = [
  ["ink", "bg"],
  ["ink", "surface"],
  ["muted", "bg"],
  ["muted", "surface"],
  ["accent", "bg"],
  ["accent", "surface"],
  ["accent", "accent-soft"], // tags and chat bubbles
  ["ok", "ok-soft"], // the "open to relocation" pill
  ["warn", "warn-soft"], // refusal and error notes
  ["danger", "bg"], // form and chat errors
  ["accent-ink", "accent"], // primary button text
  ["ink", "side"],
  ["muted", "side"], // table header, skills row labels
  ["muted", "hover"], // selected filter, tags
  ["ink", "hover"],
  ["accent", "side"],
  ["ai", "ai-soft"], // Ask AI accents
  ["ink", "callout"], // relocation callout
  ["ink", "accent-soft"],
];

for (const t of themes) {
  test(`${t}: every text and background pair meets WCAG AA contrast (4.5:1)`, () => {
    for (const [fg, bg] of TEXT_ON_BACKGROUND) {
      const ratio = contrast(palette[t][fg], palette[t][bg]);
      assert.ok(ratio >= 4.5, `${t}: ${fg} on ${bg} is ${ratio.toFixed(2)}:1`);
    }
  });
}

test("generated CSS defines every variable for both themes and declares the colour scheme", () => {
  const css = tokensToCss();
  for (const k of Object.keys(palette.light)) {
    assert.ok(css.includes(`--${k}: ${palette.light[k]};`), `light --${k}`);
    assert.ok(css.includes(`--${k}: ${palette.dark[k]};`), `dark --${k}`);
  }
  for (const k of Object.keys(shared)) assert.ok(css.includes(`--${k}:`), `shared --${k}`);
  assert.match(css, /:root\[data-theme="dark"\]/);
  assert.match(css, /color-scheme: light;/);
  assert.match(css, /color-scheme: dark;/);
  assert.doesNotMatch(css, /undefined|NaN/);
});

test("the address-bar colour follows the page background in each theme", () => {
  assert.equal(themeColor("light"), palette.light.bg);
  assert.equal(themeColor("dark"), palette.dark.bg);
});
