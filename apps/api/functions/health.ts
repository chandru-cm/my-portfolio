import { healthReport } from "../src/health";
import { toNodeHandler } from "../src/node";

/** Vercel entry for GET /api/health. Calls no upstream service and returns no secret. */
export default toNodeHandler(
  async () =>
    new Response(JSON.stringify(healthReport(process.env)), {
      status: 200,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    })
);
