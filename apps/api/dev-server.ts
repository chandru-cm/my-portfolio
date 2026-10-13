/**
 * Local-only HTTP wrapper around the same handleChat() that runs on Vercel.
 * Not deployed. The website's dev server proxies /api to this.
 *
 *   npm run dev -w @my-portfolio/api
 *
 * Live mode (real Gemini + Pinecone) needs keys in .env. If they are missing, or you set
 * DEV_API_MODE=offline, it starts in offline mode so the UI can still be developed:
 * offline uses the real knowledge base with a keyword matcher and echoes context instead of
 * calling a model.
 */
import { createServer } from "node:http";
import { handleChat, type ChatDeps } from "./src/chat";
import { ConfigError, loadConfig } from "./src/config";
import { createDeps } from "./src/deps";
import { toNodeHandler } from "./src/node";
import { EchoGenerator, makeDeps } from "./src/testkit";

const PORT = Number(process.env.API_PORT ?? 8787);
// Vite moves to the next free port when 5173 is taken, so allow a small range of local ports.
const DEV_PORTS = [5173, 5174, 5175, 5176, 5177, 5178, 4173, 4174, 4175];
const DEV_ORIGINS = DEV_PORTS.flatMap((p) => [`http://localhost:${p}`, `http://127.0.0.1:${p}`]);

async function buildDeps(): Promise<{ deps: ChatDeps; mode: "live" | "offline" }> {
  if (process.env.DEV_API_MODE !== "offline") {
    try {
      const config = loadConfig(process.env, { production: false });
      if (config.allowedOrigins.length === 0) config.allowedOrigins = DEV_ORIGINS;
      return { deps: createDeps(config), mode: "live" };
    } catch (error) {
      console.warn(error instanceof ConfigError ? error.message : String(error));
      console.warn("Falling back to offline mode.\n");
    }
  }
  const deps = await makeDeps({ generator: new EchoGenerator() });
  deps.config.allowedOrigins = DEV_ORIGINS;
  deps.config.allowMissingOrigin = true;
  return { deps, mode: "offline" };
}

const { deps, mode } = await buildDeps();

const chatRoute = toNodeHandler((request) => handleChat(request, deps));

createServer((req, res) => {
  const { pathname } = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);
  if (pathname === "/api/chat") return void chatRoute(req, res);
  const json = (status: number, body: unknown) => {
    res.writeHead(status, { "Content-Type": "application/json" });
    res.end(JSON.stringify(body));
  };
  if (pathname === "/api/health") return json(200, { ok: true, mode });
  return json(404, { error: { code: "not_found" } });
}).listen(PORT, "127.0.0.1", () => {
  console.log(`\nChat API (${mode.toUpperCase()}) listening on http://127.0.0.1:${PORT}/api/chat`);
  if (mode === "offline") console.log("Offline: answers echo matched context. Add keys to .env for real answers.\n");
});
