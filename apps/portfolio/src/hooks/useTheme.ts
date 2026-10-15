import { useCallback, useEffect, useState } from "react";
import { applyTheme, nextPref, prefersDark, readPref, resolveTheme, writePref, type ThemePref } from "../theme/theme";
import type { ThemeName } from "../theme/tokens";

/**
 * The theme controller. All rules live in src/theme/theme.ts; this hook only connects them to React:
 * it remembers the visitor's choice (system, light or dark), follows the system setting live while
 * the choice is "system", and applies the result to the page.
 */
export function useTheme(): { pref: ThemePref; resolved: ThemeName; cycle: () => void } {
  const [pref, setPref] = useState<ThemePref>(() => readPref());
  const [systemDark, setSystemDark] = useState<boolean>(() => prefersDark());

  useEffect(() => {
    const query = matchMedia("(prefers-color-scheme: dark)");
    const onChange = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    applyTheme(pref, systemDark);
  }, [pref, systemDark]);

  const cycle = useCallback(() => {
    const next = nextPref(pref);
    writePref(next);
    setPref(next);
  }, [pref]);

  return { pref, resolved: resolveTheme(pref, systemDark), cycle };
}
