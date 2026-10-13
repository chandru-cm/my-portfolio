import { GoogleGenAI } from "@google/genai";
import type { Generator } from "../generator";
import type { BuiltPrompt } from "../prompt";

/** The slice of the Gemini client this adapter uses. Narrow on purpose so tests can fake it. */
export type StreamClient = {
  models: {
    generateContentStream(params: {
      model: string;
      contents: { role: string; parts: { text: string }[] }[];
      config: Record<string, unknown>;
    }): Promise<AsyncIterable<{ text?: string }>>;
  };
};

export type GeminiGeneratorOptions = {
  apiKey: string;
  /** Primary model. Copy a current model name from Google AI Studio. There is no default on purpose. */
  model: string;
  /** Tried in order when the primary is slow, overloaded or unavailable. */
  fallbackModels?: string[];
  /** Give up on a model if it has not produced its first text within this time. */
  firstTokenTimeoutMs?: number;
  maxOutputTokens?: number;
  temperature?: number;
  /** For tests. Defaults to the real Google client. */
  client?: StreamClient;
};

/** Measured on the free tier: first text typically arrives in 7 to 13 seconds. */
export const DEFAULT_FIRST_TOKEN_TIMEOUT_MS = 15000;

/**
 * True for failures where trying a different model can help: a timeout, rate limit, server
 * error, or a model that is not available. Not for bad requests or key problems, which would
 * fail the same way on every model.
 */
export function shouldTryNextModel(error: unknown): boolean {
  const e = error as { name?: string; status?: number } | null;
  if (e?.name === "AbortError") return true;
  const s = e?.status;
  return typeof s === "number" && (s === 404 || s === 408 || s === 429 || s >= 500);
}

export class GeminiGenerator implements Generator {
  private readonly client: StreamClient;
  private readonly models: string[];
  private readonly firstTokenTimeoutMs: number;
  private readonly maxOutputTokens: number;
  private readonly temperature: number;

  constructor(options: GeminiGeneratorOptions) {
    if (!options.client && !options.apiKey) throw new Error("GEMINI_API_KEY is required");
    if (!options.model) throw new Error("GEMINI_CHAT_MODEL is required");
    this.client = options.client ?? (new GoogleGenAI({ apiKey: options.apiKey }) as unknown as StreamClient);
    this.models = [options.model, ...(options.fallbackModels ?? [])].filter(Boolean);
    this.firstTokenTimeoutMs = options.firstTokenTimeoutMs ?? DEFAULT_FIRST_TOKEN_TIMEOUT_MS;
    this.maxOutputTokens = options.maxOutputTokens ?? 300;
    this.temperature = options.temperature ?? 0.2;
  }

  async *generate(prompt: BuiltPrompt): AsyncIterable<string> {
    let lastError: unknown = new Error("No model configured");

    for (const model of this.models) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), this.firstTokenTimeoutMs);
      let started = false;
      try {
        const stream = await this.client.models.generateContentStream({
          model,
          contents: prompt.messages.map((m) => ({
            role: m.role === "assistant" ? "model" : "user",
            parts: [{ text: m.text }],
          })),
          config: {
            systemInstruction: prompt.system,
            maxOutputTokens: this.maxOutputTokens,
            temperature: this.temperature,
            abortSignal: controller.signal,
          },
        });

        for await (const chunk of stream) {
          if (!chunk.text) continue;
          if (!started) {
            started = true;
            clearTimeout(timer); // The deadline applies to the first text only.
          }
          yield chunk.text;
        }
        if (started) return;
        lastError = new Error(`Model ${model} returned no text`);
      } catch (error) {
        // Once text has been sent, switching models would repeat or contradict it.
        if (started) throw error;
        lastError = error;
        if (!shouldTryNextModel(error)) throw error;
      } finally {
        clearTimeout(timer);
      }
    }
    throw lastError;
  }
}
