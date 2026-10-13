import type { BuiltPrompt } from "./prompt";

/** Streams the model's answer as text fragments. */
export interface Generator {
  generate(prompt: BuiltPrompt): AsyncIterable<string>;
}
