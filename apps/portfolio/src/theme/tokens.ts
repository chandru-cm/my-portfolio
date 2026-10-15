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
    bg: "#fafaf7",
    surface: "#ffffff",
    ink: "#14161c",
    muted: "#5b6070",
    line: "#e4e4de",
    accent: "#3340e8",
    "accent-soft": "#e8eaff",
    ok: "#0f6e56",
    "ok-soft": "#e1f5ee",
    warn: "#633806",
    "warn-soft": "#faeeda",
    danger: "#c0392b",
    blob: "#ededfa",
  },
  dark: {
    bg: "#0e1015",
    surface: "#151821",
    ink: "#eceef4",
    muted: "#9aa0b2",
    line: "#23262f",
    accent: "#8e98ff",
    "accent-soft": "#1b1f3a",
    ok: "#5dcaa5",
    "ok-soft": "#10241e",
    warn: "#fac775",
    "warn-soft": "#2a2010",
    danger: "#f09595",
    blob: "#161a2c",
  },
};

/** Not colour-dependent, so identical in both themes. */
export const shared: Record<string, string> = {
  display: '"Inter", system-ui, sans-serif',
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
