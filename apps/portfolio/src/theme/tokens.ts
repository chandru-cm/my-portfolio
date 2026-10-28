/**
 * The single source of truth for the site's colours and fonts.
 *
 * Change a colour HERE and nowhere else. The stylesheet variables, the browser's address-bar colour
 * and the anti-flash boot script are all generated from this file (see vite.config.ts), so they can
 * never drift apart. styles.css only ever refers to var(--name).
 */
export type ThemeName = "light" | "dark";

/**
 * "Ink and Indigo": near-black text on warm off-white (a deep ink surface in dark mode), one indigo accent
 * for links and actions, and a separate plum family reserved for the AI assistant so it reads as its own feature.
 * Green is for availability and success only.
 */
export const palette: Record<ThemeName, Record<string, string>> = {
  light: {
    bg: "#fafaf9",
    surface: "#ffffff",
    side: "#f4f3f0",
    hover: "#f0eeea",
    callout: "#f6f5f2",
    ink: "#0a0a0a",
    muted: "#5c5c57",
    line: "#e2e0da",
    "line-2": "#cfccc5",
    accent: "#4338ca",
    "accent-ink": "#ffffff",
    "accent-soft": "#eef0ff",
    ai: "#8b3fd9",
    "ai-ink": "#ffffff",
    "ai-deep": "#3b1a5a",
    "ai-deep-ink": "#ffffff",
    "ai-soft": "#f6effc",
    ok: "#14702f",
    "ok-soft": "#e7f5ec",
    warn: "#8a5e16",
    "warn-soft": "#fbf3e4",
    danger: "#b42318",
  },
  dark: {
    bg: "#0b0b0c",
    surface: "#131315",
    side: "#131315",
    hover: "#1b1b1e",
    callout: "#17171a",
    ink: "#ededed",
    muted: "#9a9aa1",
    line: "#2a2a2e",
    "line-2": "#3a3a40",
    accent: "#9aa2ff",
    "accent-ink": "#0b0b0c",
    "accent-soft": "#1a1b33",
    ai: "#c9a2ff",
    "ai-ink": "#1a0f2b",
    "ai-deep": "#34174f",
    "ai-deep-ink": "#ffffff",
    "ai-soft": "#251838",
    ok: "#5fd08a",
    "ok-soft": "#12251a",
    warn: "#e0b56a",
    "warn-soft": "#2b2417",
    danger: "#f09595",
  },
};

/** Not colour-dependent, so identical in both themes. */
export const shared: Record<string, string> = {
  display: '"Inter", system-ui, sans-serif',
  mono: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
  body: '"Inter", system-ui, -apple-system, "Segoe UI", sans-serif',
  ease: "cubic-bezier(0.22, 1, 0.36, 1)",
};

/** The colour the browser's address bar and status bar take on, per theme. */
export const themeColor = (theme: ThemeName): string => palette[theme].bg;

const block = (selector: string, vars: Record<string, string>, scheme: ThemeName): string =>
  `${selector} {\n${Object.entries(vars)
    .map(([k, v]) => `  --${k}: ${v};`)
    .join("\n")}\n  color-scheme: ${scheme};\n}`;

/** The CSS custom properties for both themes, generated from the palette above. */
export function tokensToCss(): string {
  return [
    block(":root", { ...shared, ...palette.light }, "light"),
    block(':root[data-theme="dark"]', palette.dark, "dark"),
  ].join("\n");
}
