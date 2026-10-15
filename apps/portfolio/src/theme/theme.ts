import { themeColor, type ThemeName } from "./tokens";

export type ThemePref = "system" | "light" | "dark";

/** The one place the storage key lives. */
export const STORAGE_KEY = "theme";

const PREFS: ThemePref[] = ["system", "light", "dark"];

export function parsePref(value: unknown): ThemePref {
  return PREFS.includes(value as ThemePref) ? (value as ThemePref) : "system";
}

/** What the page should actually look like, given the visitor's choice and their system setting. */
export function resolveTheme(pref: ThemePref, systemDark: boolean): ThemeName {
  if (pref === "system") return systemDark ? "dark" : "light";
  return pref;
}

/** The order the toggle cycles through: system, then light, then dark, then back. */
export function nextPref(pref: ThemePref): ThemePref {
  return PREFS[(PREFS.indexOf(pref) + 1) % PREFS.length];
}

export function prefersDark(): boolean {
  return typeof matchMedia === "function" && matchMedia("(prefers-color-scheme: dark)").matches;
}

/** Storage can be blocked (private windows, strict settings), so every access is guarded. */
export function readPref(storage?: Pick<Storage, "getItem">): ThemePref {
  try {
    return parsePref((storage ?? localStorage).getItem(STORAGE_KEY));
  } catch {
    return "system";
  }
}

export function writePref(pref: ThemePref, storage?: Pick<Storage, "setItem">): void {
  try {
    (storage ?? localStorage).setItem(STORAGE_KEY, pref);
  } catch {
    /* the choice just will not persist */
  }
}

/** Applies a theme to the page and returns what was applied. Safe to call before React loads. */
export function applyTheme(pref: ThemePref, systemDark: boolean = prefersDark()): ThemeName {
  const theme = resolveTheme(pref, systemDark);
  if (typeof document !== "undefined") {
    const root = document.documentElement;
    root.dataset.theme = theme;
    root.dataset.themePref = pref;
    let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "theme-color";
      document.head.appendChild(meta);
    }
    meta.content = themeColor(theme);
  }
  return theme;
}
