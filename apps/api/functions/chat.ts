import { handleChat } from "../src/chat";
import { getDeps } from "../src/deps";
import { jsonError } from "../src/http";
import { toNodeHandler } from "../src/node";

/** Vercel entry for POST/OPTIONS /api/chat. Bundled into one file by scripts/build.mjs. */
export default toNodeHandler(async (request) => {
  try {
    return await handleChat(request, getDeps(process.env));
  } catch (error) {
    // Start-up failures such as a missing setting. The message names variables, never values.
    console.error(JSON.stringify({ evt: "startup_error", message: (error as Error).message }));
    return jsonError(500, "internal", "The service is not configured correctly.");
  }
});
