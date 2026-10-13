import assert from "node:assert/strict";
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { test } from "node:test";
import { toNodeHandler, type WebHandler } from "./node";

async function withServer<T>(handle: WebHandler, run: (base: string) => Promise<T>, maxBodyBytes?: number): Promise<T> {
  const server: Server = createServer(toNodeHandler(handle, { maxBodyBytes }));
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  try {
    return await run(`http://127.0.0.1:${(server.address() as AddressInfo).port}`);
  } finally {
    server.closeAllConnections();
    await new Promise((r) => server.close(r));
  }
}

test("passes method, path, headers and body through to the web handler", async () => {
  let seen: { method: string; path: string; origin: string | null; body: string } | undefined;
  await withServer(
    async (req) => {
      seen = { method: req.method, path: new URL(req.url).pathname, origin: req.headers.get("origin"), body: await req.text() };
      return new Response('{"ok":true}', { status: 201, headers: { "Content-Type": "application/json", "X-Test": "1" } });
    },
    async (base) => {
      const res = await fetch(`${base}/api/chat`, { method: "POST", headers: { origin: "https://site.example" }, body: '{"message":"hi"}' });
      assert.equal(res.status, 201);
      assert.equal(res.headers.get("x-test"), "1");
      assert.deepEqual(await res.json(), { ok: true });
    }
  );
  assert.deepEqual(seen, { method: "POST", path: "/api/chat", origin: "https://site.example", body: '{"message":"hi"}' });
});

test("streams chunks as they are produced instead of buffering the whole response", async () => {
  const enc = new TextEncoder();
  let release!: () => void;
  const gate = new Promise<void>((r) => (release = r));
  await withServer(
    async () =>
      new Response(
        new ReadableStream({
          async start(c) {
            c.enqueue(enc.encode("first;"));
            await gate; // the second chunk is withheld until the client has read the first
            c.enqueue(enc.encode("second;"));
            c.close();
          },
        })
      ),
    async (base) => {
      const res = await fetch(`${base}/`);
      const reader = res.body!.getReader();
      const first = new TextDecoder().decode((await reader.read()).value);
      assert.equal(first, "first;", "first chunk must arrive before the stream finishes");
      release();
      let rest = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        rest += new TextDecoder().decode(value);
      }
      assert.equal(rest, "second;");
    }
  );
});

test("a handler that throws becomes a generic 500 with no details", async () => {
  await withServer(
    async () => {
      throw new Error("secret connection string leaked");
    },
    async (base) => {
      const res = await fetch(`${base}/`);
      assert.equal(res.status, 500);
      const text = await res.text();
      assert.doesNotMatch(text, /secret|leaked|stack/i);
      assert.equal(JSON.parse(text).error.code, "internal");
    }
  );
});

test("an oversized body is rejected with 413 before the handler runs", async () => {
  let called = false;
  await withServer(
    async () => {
      called = true;
      return new Response("x");
    },
    async (base) => {
      const res = await fetch(`${base}/`, { method: "POST", body: "x".repeat(5000) });
      assert.equal(res.status, 413);
    },
    1024
  );
  assert.equal(called, false);
});

test("GET requests carry no body", async () => {
  await withServer(
    async (req) => new Response(String(req.body === null)),
    async (base) => assert.equal(await (await fetch(`${base}/`)).text(), "true")
  );
});
