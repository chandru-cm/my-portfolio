import { DEFAULT_FAQ_FAST_PATH_THRESHOLD, DEFAULT_TOP_K } from "@my-portfolio/rag";

export type Env = Record<string, string | undefined>;

export const DEFAULT_CHAT_MODEL = "gemini-3.1-flash-lite";
// Free-tier capacity swings by the hour: in one session the 3.1 models returned 503 on every try while
// 3.5 answered, and earlier the reverse. Mix families so one is usually available.
export const DEFAULT_FALLBACK_MODELS = "gemini-3.1-flash-lite-preview,gemini-3.5-flash-lite";

/** The subset of settings the request handler itself needs. */
export type HandlerConfig = {
  /** Exact origins allowed to call the API, with no trailing slash. */
  allowedOrigins: string[];
  /** Accept requests with no Origin header (curl, local CLI). Off in production. */
  allowMissingOrigin: boolean;
  threshold: number;
  topK: number;
  maxBodyBytes: number;
  /** A match on an approved FAQ at or above this score is answered instantly, without the model. */
  faqFastPathThreshold: number;
};

export type Config = HandlerConfig & {
  geminiApiKey: string;
  geminiChatModel: string;
  geminiFallbackModels: string[];
  firstTokenTimeoutMs: number;
  geminiEmbeddingModel?: string;
  dimensions: number;
  pineconeApiKey: string;
  pineconeIndex: string;
  pineconeIndexHost?: string;
  pineconeNamespace: string;
  upstash?: { url: string; token: string };
  perMinute: number;
  perDay: number;
  globalDaily: number;
};

export class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConfigError";
  }
}

function int(env: Env, name: string, fallback: number, problems: string[]): number {
  const raw = env[name];
  if (raw === undefined || raw === "") return fallback;
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 1) {
    problems.push(`${name} must be a positive whole number (got "${raw}")`);
    return fallback;
  }
  return n;
}

/**
 * The addresses Vercel gives this very deployment (its production domain, this deployment's URL and
 * the branch URL), as https origins. When the website and the API are one project, the page that calls
 * the API is served from one of these, so it is allowed without any setting. Other sites still need
 * ALLOWED_ORIGINS. Vercel exposes these variables without a protocol.
 */
export function vercelOrigins(env: Env): string[] {
  const hosts = [env.VERCEL_PROJECT_PRODUCTION_URL, env.VERCEL_URL, env.VERCEL_BRANCH_URL];
  return hosts
    .map((h) => h?.trim().replace(/^https?:\/\//, "").replace(/\/+$/, ""))
    .filter((h): h is string => !!h && /^[a-z0-9.-]+$/i.test(h))
    .map((h) => `https://${h}`);
}

export function isProduction(env: Env): boolean {
  return env.VERCEL_ENV === "production" || env.NODE_ENV === "production";
}

/**
 * Parses and validates settings. Collects every problem and reports them together, so one
 * deploy attempt shows everything that is missing. Never echoes secret values.
 */
export function loadConfig(env: Env, options: { production?: boolean } = {}): Config {
  const production = options.production ?? isProduction(env);
  const problems: string[] = [];
  const need = (name: string): string => {
    const v = env[name]?.trim();
    if (!v) problems.push(`${name} is required`);
    return v ?? "";
  };

  const geminiApiKey = need("GEMINI_API_KEY");
  // Measured on the free tier (see README section 10). Override with GEMINI_CHAT_MODEL when names change.
  const geminiChatModel = env.GEMINI_CHAT_MODEL?.trim() || DEFAULT_CHAT_MODEL;
  const pineconeApiKey = need("PINECONE_API_KEY");
  const pineconeIndex = need("PINECONE_INDEX");
  if (pineconeIndex && (/^https?:\/\//i.test(pineconeIndex) || pineconeIndex.includes("."))) {
    problems.push("PINECONE_INDEX must be the index name, not its host URL");
  }

  const allowedOrigins = [
    ...new Set([
      ...(env.ALLOWED_ORIGINS ?? "")
        .split(",")
        .map((o) => o.trim().replace(/\/+$/, ""))
        .filter(Boolean),
      ...vercelOrigins(env),
    ]),
  ];
  const upstashUrl = env.UPSTASH_REDIS_REST_URL?.trim();
  const upstashToken = env.UPSTASH_REDIS_REST_TOKEN?.trim();

  if (production) {
    if (allowedOrigins.length === 0) problems.push("ALLOWED_ORIGINS is required in production");
    if (!upstashUrl) problems.push("UPSTASH_REDIS_REST_URL is required in production");
    if (!upstashToken) problems.push("UPSTASH_REDIS_REST_TOKEN is required in production");
  }
  if ((upstashUrl && !upstashToken) || (!upstashUrl && upstashToken)) {
    problems.push("Set both UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN, or neither");
  }

  let threshold = 0.6;
  if (env.RETRIEVAL_THRESHOLD) {
    const t = Number(env.RETRIEVAL_THRESHOLD);
    if (!(t > 0 && t <= 1)) problems.push(`RETRIEVAL_THRESHOLD must be between 0 and 1 (got "${env.RETRIEVAL_THRESHOLD}")`);
    else threshold = t;
  }

  let faqFastPathThreshold = DEFAULT_FAQ_FAST_PATH_THRESHOLD;
  if (env.FAQ_FAST_PATH_THRESHOLD) {
    const t = Number(env.FAQ_FAST_PATH_THRESHOLD);
    if (!(t > 0 && t <= 1)) problems.push(`FAQ_FAST_PATH_THRESHOLD must be between 0 and 1 (got "${env.FAQ_FAST_PATH_THRESHOLD}")`);
    else faqFastPathThreshold = t;
  }

  // Model IDs are lowercase with hyphens, like "gemini-3.1-flash-lite". A display name such as
  // "Gemini 3.1 Flash Lite" is rejected by the API with an unhelpful 400, so catch it here.
  const looksLikeId = (m: string) => /^[a-z0-9][a-z0-9._-]*$/.test(m);
  const fallbackModels = (env.GEMINI_CHAT_FALLBACK_MODELS ?? DEFAULT_FALLBACK_MODELS).split(",").map((m) => m.trim()).filter(Boolean);
  for (const [name, value] of [["GEMINI_CHAT_MODEL", geminiChatModel], ...fallbackModels.map((m) => ["GEMINI_CHAT_FALLBACK_MODELS", m])] as [string, string][]) {
    if (!looksLikeId(value)) problems.push(`${name} must be a model ID like "${DEFAULT_CHAT_MODEL}" (lowercase, hyphens, no spaces), not a display name. Got "${value}"`);
  }

  const config: Config = {
    allowedOrigins,
    allowMissingOrigin: !production,
    threshold,
    topK: int(env, "RETRIEVAL_TOP_K", DEFAULT_TOP_K, problems),
    maxBodyBytes: 4096,
    faqFastPathThreshold,
    geminiApiKey,
    geminiChatModel,
    geminiFallbackModels: fallbackModels,
    firstTokenTimeoutMs: int(env, "GEMINI_FIRST_TOKEN_TIMEOUT_MS", 15000, problems),
    geminiEmbeddingModel: env.GEMINI_EMBEDDING_MODEL || undefined,
    dimensions: int(env, "EMBEDDING_DIMENSIONS", 768, problems),
    pineconeApiKey,
    pineconeIndex,
    pineconeIndexHost: env.PINECONE_INDEX_HOST?.trim() || undefined,
    pineconeNamespace: env.PINECONE_NAMESPACE || "portfolio",
    upstash: upstashUrl && upstashToken ? { url: upstashUrl, token: upstashToken } : undefined,
    perMinute: int(env, "RATE_LIMIT_PER_MINUTE", 10, problems),
    perDay: int(env, "RATE_LIMIT_PER_DAY", 40, problems),
    globalDaily: int(env, "GLOBAL_DAILY_LIMIT", 500, problems),
  };

  if (problems.length) throw new ConfigError(`Invalid configuration:\n- ${problems.join("\n- ")}`);
  return config;
}
