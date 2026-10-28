/**
 * Writes a page that shows both contact emails side by side, so a design change can be judged in a browser
 * without sending anything:
 *
 *   npm run mail:preview -w @my-portfolio/api
 *
 * then open apps/api/.preview/index.html. The page uses made-up sample data and the real templates.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { confirmationMail, ownerMail, type ContactRequest, type OutgoingMail } from "../src/contact";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, ".preview");

const SITE = "https://my-portfolio-six-flax-15.vercel.app";
const AT = new Date("2026-10-28T17:37:24Z");

const message: ContactRequest = {
  kind: "message",
  name: "Priya Raman",
  email: "priya.raman@acme.example",
  topic: "Job opportunity",
  channel: "email",
  message:
    "Hi Chandra,\n\nWe are hiring a remote backend engineer (Node.js, PostgreSQL) for a payments team. Your RentEasify work looks like a close match.\n\nCould we talk this week?",
};
const call: ContactRequest = { ...message, kind: "call", preferred: { date: "2026-11-03", time: "15:30", timeZone: "US Eastern" } };
const whatsapp: ContactRequest = {
  ...message,
  channel: "whatsapp",
  phone: { dial: "+91", national: "9876543210", e164: "+919876543210", display: "+91 9876543210" },
};

type Variant = { subject: string; html: string; text: string };
const pack = (m: OutgoingMail): Variant => ({ subject: m.subject, html: m.html ?? "", text: m.text });

/** Email clients that follow the system theme switch on this media query. Here it is forced on to show the dark version. */
const forceDark = (html: string) => html.replace("@media (prefers-color-scheme: dark)", "@media all");

const variants: Record<string, Variant> = {};
for (const [kind, req] of [["message", message], ["call", call], ["whatsapp", whatsapp]] as const) {
  const owner = pack(ownerMail(req, "you@example.com", AT));
  const receipt = pack(confirmationMail(req, SITE));
  variants[`owner-${kind}-light`] = owner;
  variants[`owner-${kind}-dark`] = { ...owner, html: forceDark(owner.html) };
  variants[`receipt-${kind}-light`] = receipt;
  variants[`receipt-${kind}-dark`] = { ...receipt, html: forceDark(receipt.html) };
}

// "<" is escaped so no email text can close the script tag that carries it.
const data = JSON.stringify(variants).replace(/</g, "\\u003c");

const page = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Contact email preview</title>
<style>
  :root { color-scheme: light dark; --bg: #fafaf9; --ink: #0a0a0a; --mu: #5c5c57; --ln: #e2e0da; --ac: #4338ca; --sf: #ffffff; }
  @media (prefers-color-scheme: dark) { :root { --bg: #0b0b0c; --ink: #ededed; --mu: #9a9aa1; --ln: #2a2a2e; --ac: #9aa2ff; --sf: #131315; } }
  * { box-sizing: border-box; }
  body { margin: 0; background: var(--bg); color: var(--ink); font: 14px/1.5 -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
  header { position: sticky; top: 0; z-index: 2; background: var(--bg); border-bottom: 1px solid var(--ln); padding: 12px 20px; display: flex; flex-wrap: wrap; gap: 10px 28px; align-items: center; }
  header h1 { margin: 0; font-size: 15px; }
  .grp { display: flex; align-items: center; gap: 8px; }
  .grp > span { color: var(--mu); font-size: 12px; }
  .seg { display: flex; border: 1px solid var(--ln); border-radius: 8px; overflow: hidden; }
  .seg button { font: inherit; padding: 8px 14px; border: 0; background: transparent; color: var(--mu); cursor: pointer; border-right: 1px solid var(--ln); }
  .seg button:last-child { border-right: 0; }
  .seg button[aria-pressed="true"] { background: var(--ink); color: var(--bg); }
  main { display: flex; flex-wrap: wrap; gap: 24px; padding: 24px 20px 48px; align-items: flex-start; justify-content: center; }
  section { flex: 1 1 560px; min-width: 0; max-width: 720px; }
  section.phone { flex: 0 0 auto; width: 420px; }
  h2 { margin: 0 0 4px; font-size: 14px; }
  .subj { margin: 0 0 10px; color: var(--mu); font-size: 13px; word-break: break-word; }
  .frame { border: 1px solid var(--ln); border-radius: 12px; overflow: hidden; background: var(--sf); }
  iframe { display: block; width: 100%; height: 760px; border: 0; background: #fff; }
  pre { margin: 0; padding: 18px; height: 760px; overflow: auto; white-space: pre-wrap; font: 13px/1.6 ui-monospace, Menlo, Consolas, monospace; }
  .hide { display: none; }
</style>
</head>
<body>
<header>
  <h1>Contact email preview</h1>
  <div class="grp"><span>Request</span><div class="seg" data-key="kind"><button data-v="message">Message</button><button data-v="call">Call request</button><button data-v="whatsapp">With WhatsApp</button></div></div>
  <div class="grp"><span>Theme</span><div class="seg" data-key="theme"><button data-v="light">Light</button><button data-v="dark">Dark</button></div></div>
  <div class="grp"><span>Width</span><div class="seg" data-key="width"><button data-v="desktop">Desktop</button><button data-v="phone">Phone</button></div></div>
  <div class="grp"><span>Version</span><div class="seg" data-key="view"><button data-v="html">Designed</button><button data-v="text">Plain text</button></div></div>
</header>
<main>
  <section id="owner-s"><h2>Email you receive</h2><p class="subj" id="owner-subj"></p><div class="frame"><iframe id="owner-f" title="Email you receive"></iframe><pre id="owner-t" class="hide"></pre></div></section>
  <section id="receipt-s"><h2>Email the visitor receives</h2><p class="subj" id="receipt-subj"></p><div class="frame"><iframe id="receipt-f" title="Email the visitor receives"></iframe><pre id="receipt-t" class="hide"></pre></div></section>
</main>
<script>
  const V = ${data};
  const state = { kind: "message", theme: "light", width: "desktop", view: "html" };
  function render() {
    for (const who of ["owner", "receipt"]) {
      const v = V[who + "-" + state.kind + "-" + state.theme];
      document.getElementById(who + "-subj").textContent = "Subject: " + v.subject;
      const f = document.getElementById(who + "-f"), t = document.getElementById(who + "-t");
      f.srcdoc = v.html; t.textContent = v.text;
      f.classList.toggle("hide", state.view !== "html"); t.classList.toggle("hide", state.view !== "text");
      document.getElementById(who + "-s").classList.toggle("phone", state.width === "phone");
    }
    document.body.style.colorScheme = state.theme;
    for (const seg of document.querySelectorAll(".seg"))
      for (const b of seg.children) b.setAttribute("aria-pressed", String(state[seg.dataset.key] === b.dataset.v));
  }
  for (const seg of document.querySelectorAll(".seg"))
    seg.addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) { state[seg.dataset.key] = b.dataset.v; render(); } });
  render();
</script>
</body>
</html>`;

mkdirSync(outDir, { recursive: true });
const file = join(outDir, "index.html");
writeFileSync(file, page);
console.log(`Wrote ${file}\nOpen it in a browser to see both emails.`);
