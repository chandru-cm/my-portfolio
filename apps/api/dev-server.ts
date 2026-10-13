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
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { handleChat, type ChatDeps } from "./src/chat";
import { ConfigError, loadConfig } from "./src/config";
import { createDeps } from "./src/deps";
import { EchoGenerator, makeDeps } from "./src/testkit";

const PORT = Number(process.env.API_PORT ?? 8787);
const DEV_ORIGINS = ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:4173", "http://127.0.0.1:4173"];

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

async function readBody(req: IncomingMessage): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  return Buffer.concat(chunks);
}

function send(res: ServerResponse, status: number, body: string, type = "application/json") {
  res.writeHead(status, { "Content-Type": type });
  res.end(body);
}

createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);

  if (url.pathname === "/api/health") return send(res, 200, JSON.stringify({ ok: true, mode }));
  if (url.pathname !== "/api/chat") return send(res, 404, JSON.stringify({ error: { code: "not_found" } }));

  const headers = new Headers();
  for (const [k, v] of Object.entries(req.headers)) if (v !== undefined) headers.set(k, Array.isArray(v) ? v.join(", ") : v);

  const hasBody = req.method !== "GET" && req.method !== "HEAD";
  const request = new Request(url, { method: req.method, headers, body: hasBody ? new Uint8Array(await readBody(req)) : undefined });
  const response = await handleChat(request, deps);

  res.writeHead(response.status, Object.fromEntries(response.headers));
  if (!response.body) return res.end();

  const reader = response.body.getReader();
  res.on("close", () => void reader.cancel().catch(() => {}));
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(value);
    }
  } catch {
    /* client went away */
  }
  res.end();
}).listen(PORT, "127.0.0.1", () => {
  console.log(`\nChat API (${mode.toUpperCase()}) listening on http://127.0.0.1:${PORT}/api/chat`);
  if (mode === "offline") console.log("Offline: answers echo matched context. Add keys to .env for real answers.\n");
});
