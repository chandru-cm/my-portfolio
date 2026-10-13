import { GoogleGenAI } from "@google/genai";
import type { Generator } from "../generator";
import type { BuiltPrompt } from "../prompt";

export type GeminiGeneratorOptions = {
  apiKey: string;
  /** Copy the current free Flash model name from Google AI Studio. There is no default on purpose. */
  model: string;
  maxOutputTokens?: number;
  temperature?: number;
};

export class GeminiGenerator implements Generator {
  private readonly ai: GoogleGenAI;
  private readonly model: string;
  private readonly maxOutputTokens: number;
  private readonly temperature: number;

  constructor(options: GeminiGeneratorOptions) {
    if (!options.apiKey) throw new Error("GEMINI_API_KEY is required");
    if (!options.model) throw new Error("GEMINI_CHAT_MODEL is required");
    this.ai = new GoogleGenAI({ apiKey: options.apiKey });
    this.model = options.model;
    this.maxOutputTokens = options.maxOutputTokens ?? 300;
    this.temperature = options.temperature ?? 0.2;
  }

  async *generate(prompt: BuiltPrompt): AsyncIterable<string> {
    const stream = await this.ai.models.generateContentStream({
      model: this.model,
      contents: prompt.messages.map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.text }],
      })),
      config: {
        systemInstruction: prompt.system,
        maxOutputTokens: this.maxOutputTokens,
        temperature: this.temperature,
      },
    });
    for await (const chunk of stream) {
      if (chunk.text) yield chunk.text;
    }
  }
}
