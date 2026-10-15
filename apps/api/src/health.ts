import { ConfigError, isProduction, loadConfig, type Env } from "./config";

export type HealthReport =
  | { ok: true; configured: true; mode: "production" | "preview"; allowedOrigins: string[]; rateLimit: "redis" | "memory" }
  | { ok: true; configured: false; mode: "production" | "preview"; problems: string[] };

/**
 * What /api/health says about the deployment. `ok` means the function is running. `configured` says
 * whether the settings are valid; when they are not, `problems` names what to fix. When they are, it
 * shows which website origins are allowed, which is the most common thing to get wrong.
 *
 * Everything here is safe to publish: setting NAMES, public site addresses, and yes/no facts. Never a
 * key, token or other value.
 */
export function healthReport(env: Env): HealthReport {
  const mode = isProduction(env) ? "production" : "preview";
  try {
    const config = loadConfig(env);
    return {
      ok: true,
      configured: true,
      mode,
      allowedOrigins: config.allowedOrigins,
      rateLimit: config.upstash ? "redis" : "memory",
    };
  } catch (error) {
    const problems =
      error instanceof ConfigError
        ? error.message.split("\n").slice(1).map((line) => line.replace(/^- /, ""))
        : ["Unexpected configuration error"];
    return { ok: true, configured: false, mode, problems };
  }
}
