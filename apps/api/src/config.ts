export type Env = Record<string, string | undefined>;

/** The subset of settings the request handler itself needs. */
export type HandlerConfig = {
  /** Exact origins allowed to call the API, with no trailing slash. */
  allowedOrigins: string[];
  /** Accept requests with no Origin header (curl, local CLI). Off in production. */
  allowMissingOrigin: boolean;
  threshold: number;
  topK: number;
  maxBodyBytes: number;
};

export type Config = HandlerConfig & {
  geminiApiKey: string;
  geminiChatModel: string;
  geminiEmbeddingModel?: string;
  dimensions: number;
  pineconeApiKey: string;
  pineconeIndex: string;
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
  const geminiChatModel = need("GEMINI_CHAT_MODEL");
  const pineconeApiKey = need("PINECONE_API_KEY");
  const pineconeIndex = need("PINECONE_INDEX");
  if (pineconeIndex && (/^https?:\/\//i.test(pineconeIndex) || pineconeIndex.includes("."))) {
    problems.push("PINECONE_INDEX must be the index name, not its host URL");
  }

  const allowedOrigins = (env.ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((o) => o.trim().replace(/\/+$/, ""))
    .filter(Boolean);
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

  const config: Config = {
    allowedOrigins,
    allowMissingOrigin: !production,
    threshold,
    topK: int(env, "RETRIEVAL_TOP_K", 4, problems),
    maxBodyBytes: 4096,
    geminiApiKey,
    geminiChatModel,
    geminiEmbeddingModel: env.GEMINI_EMBEDDING_MODEL || undefined,
    dimensions: int(env, "EMBEDDING_DIMENSIONS", 768, problems),
    pineconeApiKey,
    pineconeIndex,
    pineconeNamespace: env.PINECONE_NAMESPACE || "portfolio",
    upstash: upstashUrl && upstashToken ? { url: upstashUrl, token: upstashToken } : undefined,
    perMinute: int(env, "RATE_LIMIT_PER_MINUTE", 10, problems),
    perDay: int(env, "RATE_LIMIT_PER_DAY", 40, problems),
    globalDaily: int(env, "GLOBAL_DAILY_LIMIT", 500, problems),
  };

  if (problems.length) throw new ConfigError(`Invalid configuration:\n- ${problems.join("\n- ")}`);
  return config;
}
