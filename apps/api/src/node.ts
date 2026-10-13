import type { IncomingMessage, ServerResponse } from "node:http";

/** A web-standard handler: Request in, Response out. handleChat has this shape. */
export type WebHandler = (request: Request) => Promise<Response>;

export type NodeAdapterOptions = {
  /** Requests with a larger body are rejected with 413 before they are read into memory. */
  maxBodyBytes?: number;
};

const INTERNAL_ERROR = JSON.stringify({ error: { code: "internal", message: "Something went wrong. Please try again." } });
const TOO_LARGE = JSON.stringify({ error: { code: "body_too_large", message: "Request is too large." } });

class BodyTooLarge extends Error {}

async function readBody(req: IncomingMessage, limit: number): Promise<ArrayBuffer> {
  const declared = Number(req.headers["content-length"] ?? 0);
  if (declared > limit) throw new BodyTooLarge();
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    size += (chunk as Buffer).length;
    if (size > limit) throw new BodyTooLarge();
    chunks.push(chunk as Buffer);
  }
  const all = Buffer.concat(chunks);
  return all.buffer.slice(all.byteOffset, all.byteOffset + all.byteLength) as ArrayBuffer;
}

/**
 * Adapts a web-standard handler to Node's (req, res) signature, streaming the response as it is
 * produced. Used by the Vercel function and by the local dev server, so both run the same path.
 */
export function toNodeHandler(handle: WebHandler, options: NodeAdapterOptions = {}) {
  const limit = options.maxBodyBytes ?? 16 * 1024;

  return async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
    try {
      const proto = String(req.headers["x-forwarded-proto"] ?? "http").split(",")[0].trim();
      const url = new URL(req.url ?? "/", `${proto}://${req.headers.host ?? "localhost"}`);

      const headers = new Headers();
      for (const [key, value] of Object.entries(req.headers)) {
        if (value !== undefined) headers.set(key, Array.isArray(value) ? value.join(", ") : value);
      }

      const hasBody = req.method !== "GET" && req.method !== "HEAD";
      const body = hasBody ? await readBody(req, limit) : undefined;
      const response = await handle(new Request(url, { method: req.method, headers, body }));

      res.statusCode = response.status;
      response.headers.forEach((value, key) => res.setHeader(key, value));
      if (!response.body) {
        res.end();
        return;
      }

      const reader = response.body.getReader();
      // If the visitor leaves, stop the upstream work instead of streaming into the void.
      res.on("close", () => void reader.cancel().catch(() => {}));
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(value);
      }
      res.end();
    } catch (error) {
      if (res.headersSent) {
        res.end();
        return;
      }
      const tooLarge = error instanceof BodyTooLarge;
      res.statusCode = tooLarge ? 413 : 500;
      res.setHeader("Content-Type", "application/json");
      res.end(tooLarge ? TOO_LARGE : INTERNAL_ERROR);
    }
  };
}
