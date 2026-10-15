import { useTheme } from "../hooks/useTheme";
import { nextPref, type ThemePref } from "../theme/theme";

const ICON: Record<ThemePref, string> = { system: "◐", light: "☼", dark: "☾" };

/** Cycles system, light, dark. The label says what is active now and what a click will do. */
export default function ThemeToggle() {
  const { pref, resolved, cycle } = useTheme();
  const next = nextPref(pref);
  const current = pref === "system" ? `system (${resolved})` : pref;
  const label = `Theme: ${current}. Switch to ${next}.`;
  return (
    <button className="icon-btn" type="button" onClick={cycle} aria-label={label} title={label}>
      <span aria-hidden="true">{ICON[pref]}</span>
    </button>
  );
}
