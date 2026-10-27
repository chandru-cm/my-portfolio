import { GeminiEmbedder, GeminiGenerator, PineconeStore } from "@my-portfolio/rag";
import { Redis } from "@upstash/redis";
import type { ChatDeps } from "./chat";
import { loadConfig, type Config, type Env } from "./config";
import { AnswerCache } from "./cache";
import { InMemoryRateLimiter, UpstashRateLimiter } from "./limiter";

const MINUTE = 60;
const DAY = 86_400;

/** Composition root: the only place real services are constructed. */
export function createDeps(config: Config): ChatDeps {
  const limits = config.upstash
    ? (() => {
        const redis = new Redis({ url: config.upstash.url, token: config.upstash.token });
        return {
          perMinute: new UpstashRateLimiter(redis, config.perMinute, MINUTE, "rl:min"),
          perDay: new UpstashRateLimiter(redis, config.perDay, DAY, "rl:day"),
          global: new UpstashRateLimiter(redis, config.globalDaily, DAY, "rl:global"),
        };
      })()
    : {
        perMinute: new InMemoryRateLimiter(config.perMinute, MINUTE * 1000),
        perDay: new InMemoryRateLimiter(config.perDay, DAY * 1000),
        global: new InMemoryRateLimiter(config.globalDaily, DAY * 1000),
      };

  return {
    config,
    embedder: new GeminiEmbedder({
      apiKey: config.geminiApiKey,
      model: config.geminiEmbeddingModel,
      dimensions: config.dimensions,
    }),
    store: new PineconeStore({
      apiKey: config.pineconeApiKey,
      indexName: config.pineconeIndex,
      namespace: config.pineconeNamespace,
      host: config.pineconeIndexHost,
    }),
    generator: new GeminiGenerator({
      apiKey: config.geminiApiKey,
      model: config.geminiChatModel,
      fallbackModels: config.geminiFallbackModels,
      firstTokenTimeoutMs: config.firstTokenTimeoutMs,
    }),
    limits,
    cache: new AnswerCache(),
    log: (event) => console.log(JSON.stringify({ evt: "chat", ...event })),
  };
}

let cached: ChatDeps | undefined;

/** Built once per warm instance and reused across requests. */
export function getDeps(env: Env): ChatDeps {
  cached ??= createDeps(loadConfig(env));
  return cached;
}
