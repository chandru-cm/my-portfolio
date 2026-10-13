import { toNodeHandler } from "../src/node";

/** Vercel entry for GET /api/health. Touches no secrets and calls no upstream service. */
export default toNodeHandler(
  async () =>
    new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    })
);
