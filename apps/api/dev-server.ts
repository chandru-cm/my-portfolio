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
import { confirmationMail, handleContact, ownerMail, type ContactDeps, type ContactRequest } from "./src/contact";
import { ContactConfigError, createContactDeps, loadContactConfig } from "./src/contactDeps";
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

/**
 * Contact form. With SMTP or Telegram settings in .env it really sends. Without them it prints what it would
 * have sent, so the form can be developed and tested without an email account.
 */
function buildContactDeps(): { deps: ContactDeps; live: boolean } {
  try {
    const config = loadContactConfig(process.env, { production: false });
    if (config.allowedOrigins.length === 0) config.allowedOrigins = DEV_ORIGINS;
    return { deps: createContactDeps(config), live: true };
  } catch (error) {
    if (!(error instanceof ContactConfigError)) throw error;
    console.warn(`${error.message}\nContact form: printing messages to this console instead of sending them.\n`);
    const config = loadContactConfig({ SMTP_USER: "dev@localhost.test", SMTP_PASS: "unused" }, { production: false });
    config.allowedOrigins = DEV_ORIGINS;
    const deps = createContactDeps(config);
    deps.mailer = {
      async send(mail) {
        console.log(`\n[contact: not sent] To: ${mail.to}\nSubject: ${mail.subject}\n${mail.text}\n`);
      },
    };
    return { deps, live: false };
  }
}
const { deps: contactDeps, live: contactLive } = buildContactDeps();
const contactRoute = toNodeHandler((request) => handleContact(request, contactDeps), { maxBodyBytes: 16 * 1024 });

/** Sample data for previewing the email designs in a browser. Development only: this server is never deployed. */
function previewMail(template: string): string {
  const call = template.endsWith("call");
  const sample: ContactRequest = {
    kind: call ? "call" : "message",
    name: "Priya Raman",
    email: "priya.raman@acme.example",
    topic: "Job opportunity",
    channel: template.includes("whatsapp") ? "whatsapp" : "email",
    ...(template.includes("whatsapp") ? { phone: { dial: "+91", national: "9876543210", e164: "+919876543210", display: "+91 9876543210" } } : {}),
    message:
      "Hi Chandra,\n\nWe are hiring a remote backend engineer (Node.js, PostgreSQL) for a payments team. Your RentEasify work looks like a close match.\n\nCould we talk this week?",
    ...(call ? { preferred: { date: "2026-11-03", time: "15:30", timeZone: "US Eastern" } } : {}),
  };
  const config = contactDeps.config;
  const mail = template.startsWith("receipt") ? confirmationMail(sample, config.siteUrl || "https://example.com") : ownerMail(sample, config.ownerEmail || "you@example.com", new Date());
  return mail.html ?? "";
}

createServer((req, res) => {
  const { pathname, searchParams } = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);
  if (pathname === "/api/contact-preview") {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    return void res.end(previewMail(searchParams.get("template") ?? "owner"));
  }
  if (pathname === "/api/chat") return void chatRoute(req, res);
  if (pathname === "/api/contact") return void contactRoute(req, res);
  const json = (status: number, body: unknown) => {
    res.writeHead(status, { "Content-Type": "application/json" });
    res.end(JSON.stringify(body));
  };
  if (pathname === "/api/health") return json(200, { ok: true, mode, contact: contactLive ? "live" : "console" });
  return json(404, { error: { code: "not_found" } });
}).listen(PORT, "127.0.0.1", () => {
  console.log(`\nChat API (${mode.toUpperCase()}) listening on http://127.0.0.1:${PORT}/api/chat`);
  if (mode === "offline") console.log("Offline: answers echo matched context. Add keys to .env for real answers.\n");
});
