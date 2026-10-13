import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const root = dirname(fileURLToPath(import.meta.url));

// The resume PDF is kept out of git (it contains a phone number). Only show the
// download button when the file actually exists, so a deployed site never has a dead link.
const hasResume = existsSync(resolve(root, "public/Chandra_Moorthy_Resume.pdf"));

export default defineConfig({
  plugins: [react()],
  server: {
    // In development, /api goes to the local chat API (apps/api dev server).
    proxy: { "/api": { target: "http://127.0.0.1:8787", changeOrigin: false } },
  },
  define: {
    __HAS_RESUME__: JSON.stringify(hasResume),
  },
});
