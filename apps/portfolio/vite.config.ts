import { buildSync } from "esbuild";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { tokensToCss } from "./src/theme/tokens";

const root = dirname(fileURLToPath(import.meta.url));

// The resume PDF is generated from the site content and contains no phone number. Only show the
// download button when the file actually exists, so a deployed site never has a dead link.
const hasResume = existsSync(resolve(root, "public/Chandra_Moorthy_Resume.pdf"));

/**
 * Makes src/theme/ the single source of truth for the look of the site:
 *  - "virtual:theme.css" is the colour and font variables, generated from tokens.ts
 *  - a tiny boot script, built from src/theme/boot.ts, is inlined into the page head so the right
 *    theme is applied before the first paint (no white flash for dark-mode visitors)
 * Neither is written by hand anywhere, so the app, the page and the browser chrome cannot disagree.
 */
function themePlugin(): Plugin {
  const virtualId = "virtual:theme.css";
  const resolvedId = `\0${virtualId}`;
  return {
    name: "portfolio-theme",
    resolveId: (id) => (id === virtualId ? resolvedId : undefined),
    load: (id) => (id === resolvedId ? tokensToCss() : undefined),
    transformIndexHtml() {
      const boot = buildSync({
        entryPoints: [resolve(root, "src/theme/boot.ts")],
        bundle: true,
        minify: true,
        format: "iife",
        target: "es2019",
        write: false,
        logLevel: "silent",
      }).outputFiles[0].text;
      return [{ tag: "script", children: boot, injectTo: "head-prepend" }];
    },
  };
}

export default defineConfig({
  // Read VITE_* settings from the repository root .env, so one file configures everything.
  // Only variables prefixed VITE_ reach the browser; the API keys in that file never do.
  envDir: resolve(root, "../.."),
  plugins: [react(), themePlugin()],
  server: {
    // In development, /api goes to the local chat API (apps/api dev server).
    proxy: { "/api": { target: "http://127.0.0.1:8787", changeOrigin: false } },
  },
  define: {
    __HAS_RESUME__: JSON.stringify(hasResume),
  },
});
