/**
 * Joins an optional base URL and a path. An empty base keeps the path relative, which is what
 * the dev proxy and the production rewrite rely on. Tolerates stray slashes on either side.
 */
export function joinUrl(base: string | undefined, path: string): string {
  const b = (base ?? "").trim().replace(/\/+$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${b}${p}`;
}
