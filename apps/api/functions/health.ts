import { ConfigError, loadConfig } from "../src/config";
import { toNodeHandler } from "../src/node";

/**
 * Vercel entry for GET /api/health. Calls no upstream service and returns no secret.
 *
 * `ok` means the function is running. `configured` says whether the chat's settings are valid, and when
 * they are not, `problems` lists what to fix. The messages name variables, never their values, so this
 * is safe to expose, and it turns a vague 500 from /api/chat into something you can act on at once.
 */
export default toNodeHandler(async () => {
  let configured = true;
  let problems: string[] = [];
  try {
    loadConfig(process.env);
  } catch (error) {
    configured = false;
    problems =
      error instanceof ConfigError
        ? error.message.split("\n").slice(1).map((line) => line.replace(/^- /, ""))
        : ["Unexpected configuration error"];
  }
  return new Response(JSON.stringify({ ok: true, configured, ...(configured ? {} : { problems }) }), {
    status: 200,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
});
