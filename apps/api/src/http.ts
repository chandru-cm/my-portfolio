export type ErrorCode =
  | "invalid_request"
  | "forbidden_origin"
  | "method_not_allowed"
  | "body_too_large"
  | "rate_limited"
  | "upstream_error"
  | "internal";

const encoder = new TextEncoder();

/** An absent Origin is allowed only when explicitly permitted (local tools, curl). */
export function isOriginAllowed(origin: string | null, allowed: string[], allowMissing: boolean): boolean {
  if (origin === null || origin === "") return allowMissing;
  return allowed.includes(origin.replace(/\/+$/, ""));
}

/** CORS headers are only ever issued to an origin on the allow-list. */
export function corsHeaders(origin: string | null, allowed: string[], preflight = false): Record<string, string> {
  if (!origin || !allowed.includes(origin.replace(/\/+$/, ""))) return {};
  const headers: Record<string, string> = { "Access-Control-Allow-Origin": origin, Vary: "Origin" };
  if (preflight) {
    headers["Access-Control-Allow-Methods"] = "POST, OPTIONS";
    headers["Access-Control-Allow-Headers"] = "Content-Type";
    headers["Access-Control-Max-Age"] = "600";
  }
  return headers;
}

export function jsonError(
  status: number,
  code: ErrorCode,
  message: string,
  headers: Record<string, string> = {}
): Response {
  return new Response(JSON.stringify({ error: { code, message } }), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...headers },
  });
}

export function sseEvent(event: string, data: unknown): Uint8Array {
  return encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

export function sseResponse(body: ReadableStream<Uint8Array>, headers: Record<string, string> = {}): Response {
  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-store, no-transform",
      "X-Accel-Buffering": "no",
      ...headers,
    },
  });
}

/** Visitor IP as set by the hosting platform. Used only as a rate-limit key. */
export function clientIp(headers: Headers): string {
  const first = (v: string | null) => v?.split(",")[0]?.trim() || null;
  return (
    first(headers.get("x-vercel-forwarded-for")) ??
    first(headers.get("x-forwarded-for")) ??
    first(headers.get("x-real-ip")) ??
    "unknown"
  );
}
