/**
 * The routing for a single Vercel project that serves the website and the API from one address,
 * in Vercel's Build Output format (.vercel/output/config.json). Pure, so it can be tested.
 *
 * Order matters:
 *  1. Security headers on every response, and long caching for hashed asset files.
 *  2. { handle: "filesystem" } serves real files first: the built website, and the functions at
 *     /api/chat and /api/health.
 *  3. Anything under /api that matched nothing is a real 404, not the website.
 *  4. Every other path gets index.html, so deep links like /work/renteasify work on a fresh load.
 */
export type Route = Record<string, unknown>;

export function vercelConfig(): { version: 3; routes: Route[] } {
  return {
    version: 3,
    routes: [
      {
        src: "/(.*)",
        headers: {
          "X-Content-Type-Options": "nosniff",
          "X-Frame-Options": "DENY",
          "Referrer-Policy": "strict-origin-when-cross-origin",
          "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
        },
        continue: true,
      },
      { src: "/assets/(.*)", headers: { "Cache-Control": "public, max-age=31536000, immutable" }, continue: true },
      { handle: "filesystem" },
      { src: "/api/(.*)", status: 404 },
      { src: "/(.*)", dest: "/index.html" },
    ],
  };
}
