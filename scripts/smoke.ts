/**
 * Checks a live deployment end to end and prints timings. Run it after deploying.
 *
 *   npm run smoke -- https://YOUR-API.vercel.app https://YOUR-SITE.vercel.app
 *   npm run smoke -- http://127.0.0.1:8787 --origin http://localhost:5173     (local API only)
 *
 * Structural checks must pass (health, CORS, refusal, instant FAQ, site pages). Model-written
 * answers depend on Gemini's free tier being available, so a slow or unavailable model is a
 * warning, not a failure.
 */
import { SseParser } from "../apps/portfolio/src/lib/sse";

const args = process.argv.slice(2);
const flag = (name: string) => {
  const i = args.indexOf(name);
  return i === -1 ? undefined : args[i + 1];
};
const positional = args.filter((a, i) => !a.startsWith("--") && !args[i - 1]?.startsWith("--"));
const api = positional[0]?.replace(/\/+$/, "");
const site = positional[1]?.replace(/\/+$/, "");
const origin = flag("--origin") ?? (site ? new URL(site).origin : undefined);

if (!api || !origin) {
  console.error("Usage: npm run smoke -- <api-url> <site-url>   (or <api-url> --origin <allowed-origin>)");
  process.exit(1);
}

let failures = 0;
let warnings = 0;
const line = (status: "PASS" | "FAIL" | "WARN", name: string, detail: string) => {
  if (status === "FAIL") failures++;
  if (status === "WARN") warnings++;
  console.log(`${status}  ${name.padEnd(34)} ${detail}`);
};
const secs = (ms: number) => `${(ms / 1000).toFixed(1)}s`;

type Chat = { status: number; contentType: string; kind?: string; text: string; firstMs: number; totalMs: number; error?: string };

async function ask(message: string, asOrigin = origin!): Promise<Chat> {
  const t0 = performance.now();
  try {
    const res = await fetch(`${api}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: asOrigin },
      body: JSON.stringify({ message }),
    });
    const contentType = res.headers.get("content-type") ?? "";
    if (!res.ok || !res.body) return { status: res.status, contentType, text: await res.text(), firstMs: 0, totalMs: performance.now() - t0 };
    const parser = new SseParser();
    const decoder = new TextDecoder();
    const reader = res.body.getReader();
    let kind: string | undefined;
    let text = "";
    let firstMs = 0;
    let error: string | undefined;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!firstMs) firstMs = performance.now() - t0;
      for (const e of parser.push(decoder.decode(value, { stream: true }))) {
        const d = e.data as { kind?: string; text?: string; message?: string };
        if (e.event === "meta") kind = d.kind;
        else if (e.event === "token") text += d.text ?? "";
        else if (e.event === "error") error = d.message;
      }
    }
    return { status: res.status, contentType, kind, text, firstMs, totalMs: performance.now() - t0, error };
  } catch (e) {
    return { status: 0, contentType: "", text: String((e as Error).message), firstMs: 0, totalMs: performance.now() - t0 };
  }
}

// ---- API ----
let allowedOrigins: string[] | undefined;
try {
  const t0 = performance.now();
  const r = await fetch(`${api}/api/health`);
  const body = await r.text();
  const ok = r.status === 200 && /"ok"\s*:\s*true/.test(body);
  line(ok ? "PASS" : "FAIL", "API health", `HTTP ${r.status} in ${secs(performance.now() - t0)}${ok ? "" : ` (if this is a Vercel login page, turn off Deployment Protection for production)`}`);
  // Newer APIs also report whether their settings are valid, and exactly what is wrong if not.
  try {
    const h = JSON.parse(body) as { configured?: boolean; problems?: string[]; allowedOrigins?: string[] };
    if (h.configured === false) {
      line("FAIL", "API settings are valid", "no. Fix these in the API project's Environment Variables, then redeploy it:");
      for (const p of h.problems ?? []) console.log(`        - ${p}`);
    } else if (h.configured === true) {
      line("PASS", "API settings are valid", "all required settings present");
      allowedOrigins = h.allowedOrigins;
    }
  } catch {
    /* an older API without this field: the checks below still run */
  }
} catch (e) {
  line("FAIL", "API health", `unreachable: ${(e as Error).message}`);
}

{
  const r = await fetch(`${api}/api/chat`, {
    method: "OPTIONS",
    headers: { Origin: origin, "Access-Control-Request-Method": "POST", "Access-Control-Request-Headers": "content-type" },
  }).catch(() => undefined);
  const allow = r?.headers.get("access-control-allow-origin");
  const passed = r?.status === 204 && allow === origin;
  line(passed ? "PASS" : "FAIL", "CORS preflight from the site", r ? `HTTP ${r.status}, allow-origin=${allow ?? "(none)"}${passed ? "" : `  -> add ${origin} to ALLOWED_ORIGINS and redeploy the API`}` : "no response");
  if (!passed && allowedOrigins) {
    console.log(`        The API currently allows: ${allowedOrigins.length ? allowedOrigins.join(", ") : "(nothing)"}`);
    console.log(`        Your site's origin is:    ${origin}`);
    console.log("        They must match exactly: https, no slash at the end, no quotes, no typo.");
  }
}

{
  const c = await ask("hello", "https://not-allowed.example");
  line(c.status === 403 ? "PASS" : "FAIL", "Other origins are rejected", `HTTP ${c.status}`);
}

{
  const c = await ask("What is Chandra Moorthy's phone number?");
  const ok = c.status === 200 && c.kind === "refusal" && /text\/event-stream/.test(c.contentType);
  line(ok ? "PASS" : "FAIL", "Private details are refused", `HTTP ${c.status}, kind=${c.kind}, ${secs(c.totalMs)}`);
}

{
  const c = await ask("How can I contact Chandra Moorthy?");
  const ok = c.status === 200 && c.kind === "answer" && c.text.includes("@");
  line(ok ? "PASS" : "FAIL", "Instant FAQ answer", ok ? `first data ${secs(c.firstMs)}${c.firstMs > 8000 ? "  (slow: set PINECONE_INDEX_HOST)" : ""}` : `HTTP ${c.status}, kind=${c.kind}, ${c.text.slice(0, 80)}`);
}

{
  const c = await ask("What is the capital of France?");
  line(c.status === 200 && c.kind === "unknown" ? "PASS" : "FAIL", "Off-topic gets 'I don't know'", `HTTP ${c.status}, kind=${c.kind}, ${secs(c.totalMs)}`);
}

{
  const c = await ask("What did Chandra Moorthy build in RentEasify?");
  if (c.status === 200 && c.kind === "answer" && c.text.length > 40 && !c.error) {
    line(c.firstMs > 15000 ? "WARN" : "PASS", "Model-written answer", `first word ${secs(c.firstMs)}, complete ${secs(c.totalMs)}${c.firstMs > 15000 ? "  (slow: Gemini free tier is busy)" : ""}`);
  } else {
    line("WARN", "Model-written answer", `HTTP ${c.status}, ${c.error ?? c.text.slice(0, 80)}  (Gemini may be overloaded; retry, and check the API logs for reason=generate:<status>)`);
  }
}

// ---- Website ----
if (site) {
  const page = async (name: string, path: string, test: (r: Response) => boolean) => {
    try {
      const t0 = performance.now();
      const r = await fetch(`${site}${path}`);
      line(test(r) ? "PASS" : "FAIL", name, `HTTP ${r.status}, ${r.headers.get("content-type")?.split(";")[0]}, ${secs(performance.now() - t0)}`);
    } catch (e) {
      line("FAIL", name, `unreachable: ${(e as Error).message}`);
    }
  };
  await page("Site home", "/", (r) => r.status === 200 && /html/.test(r.headers.get("content-type") ?? ""));
  await page("Site deep link (SPA rewrite)", "/work/renteasify", (r) => r.status === 200);
  await page("Resume PDF is published", "/Chandra_Moorthy_Resume.pdf", (r) => r.status === 200 && /pdf/.test(r.headers.get("content-type") ?? ""));
  console.log("\nAlso check by eye: the chat button is visible on the site, and a question gets an answer.");
}

console.log(`\n${failures === 0 ? "All required checks passed" : `${failures} required check(s) FAILED`}${warnings ? `, ${warnings} warning(s)` : ""}.`);
process.exit(failures ? 1 : 0);
