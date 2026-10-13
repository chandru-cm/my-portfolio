/**
 * Ask the chat backend a question from the terminal, with no server.
 * It calls the same handleChat() function that runs in production.
 *
 *   npm run chat -- "Is Chandra Moorthy open to relocation?"
 *       offline: no keys, offline embedder, echoes the matched context instead of calling a model
 *
 *   npm run chat -- --live "What AI work has Chandra Moorthy done?"
 *       live: real Gemini + Pinecone from .env, local in-memory rate limiter
 *       needs GEMINI_API_KEY, GEMINI_CHAT_MODEL, PINECONE_API_KEY, PINECONE_INDEX and an indexed namespace
 */
import { handleChat, type ChatDeps } from "../apps/api/src/chat";
import { ConfigError, loadConfig } from "../apps/api/src/config";
import { createDeps } from "../apps/api/src/deps";
import { EchoGenerator, makeDeps } from "../apps/api/src/testkit";

const args = process.argv.slice(2);
const live = args.includes("--live");
const message = args.filter((a) => a !== "--live").join(" ").trim();

if (!message) {
  console.error('Usage: npm run chat -- [--live] "your question"');
  process.exit(1);
}

let deps: ChatDeps;
if (live) {
  try {
    deps = createDeps(loadConfig(process.env, { production: false }));
  } catch (error) {
    console.error(error instanceof ConfigError ? error.message : "Could not start live mode.");
    console.error("Fill in .env (see .env.example), or drop --live to run offline.");
    process.exit(1);
  }
} else {
  deps = await makeDeps({ generator: new EchoGenerator() });
  deps.config.allowMissingOrigin = true;
}

const response = await handleChat(
  new Request("http://localhost/api/chat", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ message }),
  }),
  deps
);

console.log(`Mode: ${live ? "live (Gemini + Pinecone)" : "offline (no keys, no model)"}   HTTP ${response.status}\n`);

if (!response.ok || !response.body) {
  console.log(await response.text());
  process.exit(response.ok ? 0 : 1);
}

const reader = response.body.getReader();
const decoder = new TextDecoder();
let buffer = "";
for (;;) {
  const { done, value } = await reader.read();
  if (done) break;
  buffer += decoder.decode(value, { stream: true });
  let end: number;
  while ((end = buffer.indexOf("\n\n")) !== -1) {
    const block = buffer.slice(0, end);
    buffer = buffer.slice(end + 2);
    const event = /^event: (.*)$/m.exec(block)?.[1];
    const data = JSON.parse(/^data: (.*)$/m.exec(block)?.[1] ?? "null");
    if (event === "meta") console.log(`kind: ${data.kind}${data.sources?.length ? `   sources: ${data.sources.join(", ")}` : ""}\n`);
    else if (event === "token") process.stdout.write(data.text);
    else if (event === "error") console.log(`\n[stream error: ${data.code}] ${data.message}`);
  }
}
console.log("\n");
