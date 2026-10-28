import { handleContact } from "../src/contact";
import { getContactDeps } from "../src/contactDeps";
import { jsonError } from "../src/http";
import { toNodeHandler } from "../src/node";

/** Vercel entry for POST/OPTIONS /api/contact. Bundled into one file by scripts/build.mjs. */
export default toNodeHandler(
  async (request) => {
    try {
      return await handleContact(request, getContactDeps(process.env));
    } catch (error) {
      // Start-up failures such as a missing setting. The message names variables, never values.
      console.error(JSON.stringify({ evt: "contact_startup_error", message: (error as Error).message }));
      return jsonError(500, "internal", "The contact form is not configured. Please email me directly.");
    }
  },
  { maxBodyBytes: 16 * 1024 }
);
