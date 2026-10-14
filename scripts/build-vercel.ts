/**
 * Builds the website and the API into ONE Vercel project, served from one address.
 *
 *   npm run build:vercel
 *
 * Output: .vercel/output (Vercel's Build Output format)
 *   static/             the built website
 *   functions/api/*.func the bundled API (/api/chat, /api/health)
 *   config.json         routing (see vercel-config.ts)
 *
 * The website is built for the same origin (no API base URL), so the chat calls /api/chat on the
 * address it was loaded from. Use the two-project setup instead if you want separate addresses.
 */
import { execSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { vercelConfig } from "./vercel-config";

const root = resolve(import.meta.dirname, "..");
const out = join(root, ".vercel", "output");

function run(command: string, env: Record<string, string> = {}) {
  console.log(`\n> ${command}`);
  execSync(command, { cwd: root, stdio: "inherit", env: { ...process.env, ...env } });
}

rmSync(out, { recursive: true, force: true });

// 1. The website: same-origin API, chat on unless explicitly turned off.
run("npm run build -w @my-portfolio/portfolio", {
  VITE_API_BASE_URL: "",
  VITE_CHAT_ENABLED: process.env.VITE_CHAT_ENABLED === "false" ? "false" : "true",
});

// 2. The API functions.
run("npm run build -w @my-portfolio/api");

// 3. Assemble one output.
const dist = join(root, "apps", "portfolio", "dist");
const functions = join(root, "apps", "api", ".vercel", "output", "functions");
mkdirSync(join(out, "static"), { recursive: true });
cpSync(dist, join(out, "static"), { recursive: true });
cpSync(functions, join(out, "functions"), { recursive: true });
writeFileSync(join(out, "config.json"), JSON.stringify(vercelConfig(), null, 2));

// 4. Refuse to ship an output that is missing something essential.
const required = [
  "static/index.html",
  "functions/api/chat.func/index.js",
  "functions/api/chat.func/.vc-config.json",
  "functions/api/health.func/index.js",
  "config.json",
];
const missing = required.filter((p) => !existsSync(join(out, p)));
if (missing.length) {
  console.error(`\nBuild output is incomplete, missing:\n- ${missing.join("\n- ")}`);
  process.exit(1);
}

const count = (dir: string): number =>
  readdirSync(dir).reduce((n, f) => (statSync(join(dir, f)).isDirectory() ? n + count(join(dir, f)) : n + 1), 0);
console.log(`\nWrote .vercel/output: ${count(join(out, "static"))} website files, 2 functions, routing config.`);
