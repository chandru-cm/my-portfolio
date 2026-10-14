/**
 * Bundles each function into one self-contained file and writes Vercel's Build Output format
 * (.vercel/output). Bundling means the functions do not depend on Vercel resolving our
 * TypeScript workspace packages at runtime, which is a known source of deploy failures.
 *
 *   npm run build -w @my-portfolio/api
 */
import { build } from "esbuild";
import { cpSync, mkdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, ".vercel", "output");

const FUNCTIONS = { chat: "functions/chat.ts", health: "functions/health.ts" };
// Slow free-tier model answers need room: embedding, search and up to two model attempts.
const MAX_DURATION_SECONDS = 30;
const RUNTIME = "nodejs22.x";

rmSync(out, { recursive: true, force: true });

for (const [name, entry] of Object.entries(FUNCTIONS)) {
  const dir = join(out, "functions", "api", `${name}.func`);
  mkdirSync(dir, { recursive: true });
  const file = join(dir, "index.js");

  await build({
    entryPoints: [join(root, entry)],
    outfile: file,
    bundle: true,
    platform: "node",
    target: "node22",
    format: "cjs",
    legalComments: "none",
    logLevel: "warning",
    // The Node launcher expects the handler as module.exports.
    footer: { js: "module.exports = module.exports.default || module.exports;" },
  });

  // Self-describing: the bundle is CommonJS even though the workspace package is "type": "module".
  writeFileSync(join(dir, "package.json"), JSON.stringify({ type: "commonjs" }, null, 2));

  writeFileSync(
    join(dir, ".vc-config.json"),
    JSON.stringify(
      {
        runtime: RUNTIME,
        handler: "index.js",
        launcherType: "Nodejs",
        shouldAddHelpers: false,
        supportsResponseStreaming: true,
        maxDuration: MAX_DURATION_SECONDS,
      },
      null,
      2
    )
  );
  console.log(`built api/${name}  ${(statSync(file).size / 1024).toFixed(0)} KB`);
}

writeFileSync(join(out, "config.json"), JSON.stringify({ version: 3 }, null, 2));
mkdirSync(join(out, "static"), { recursive: true });
cpSync(join(root, "public"), join(out, "static"), { recursive: true });
console.log("wrote .vercel/output");
