/**
 * The single source of truth for the site's colours and fonts.
 *
 * Change a colour HERE and nowhere else. The stylesheet variables, the browser's address-bar colour
 * and the anti-flash boot script are all generated from this file (see vite.config.ts), so they can
 * never drift apart. styles.css only ever refers to var(--name).
 */
export type ThemeName = "light" | "dark";

export const palette: Record<ThemeName, Record<string, string>> = {
  light: {
    bg: "#ffffff",
    surface: "#ffffff",
    side: "#f7f7f5",
    hover: "#f1f1ef",
    callout: "#f7f6f3",
    ink: "#37352f",
    muted: "#6b6a66",
    line: "#e9e9e7",
    "line-2": "#d3d3cf",
    accent: "#0b6bcb",
    "accent-ink": "#ffffff",
    "accent-soft": "#e7f1fb",
    ai: "#6940a5",
    "ai-soft": "#f3eefb",
    ok: "#28704a",
    "ok-soft": "#e8f3ec",
    warn: "#8a5e16",
    "warn-soft": "#fbf3e4",
    danger: "#c0392b",
  },
  dark: {
    bg: "#191919",
    surface: "#202020",
    side: "#202020",
    hover: "#262626",
    callout: "#252525",
    ink: "#e3e2e0",
    muted: "#9b9a97",
    line: "#2f2f2f",
    "line-2": "#3d3d3d",
    accent: "#529cca",
    "accent-ink": "#191919",
    "accent-soft": "#1f2a33",
    ai: "#b28be6",
    "ai-soft": "#2a2235",
    ok: "#5fb98a",
    "ok-soft": "#1c2a22",
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
