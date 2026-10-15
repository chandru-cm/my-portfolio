import { applyTheme, readPref } from "./theme";

// Runs before the page paints, so a dark-mode visitor never sees a white flash. It is built from
// this file and inlined into index.html by vite.config.ts, so it shares theme.ts with the app.
applyTheme(readPref());
