export const MAX_QUESTION_CHARS = 300;

export const PRIVATE_REFUSAL =
  "I can't share private details such as a phone number, home address or salary. The best way to reach Chandra Moorthy is by email at chandramoorthy.dev@gmail.com.";

export const UNKNOWN_ANSWER =
  "I don't have that information in Chandra Moorthy's profile. You can ask about their projects, skills, experience or availability, or email chandramoorthy.dev@gmail.com.";

export type Validation = { ok: true; question: string } | { ok: false; error: string };

/** Trims and bounds user input. Never trust length or shape from the client. */
export function validateQuestion(input: unknown, maxChars = MAX_QUESTION_CHARS): Validation {
  if (typeof input !== "string") return { ok: false, error: "Question must be text" };
  const question = input.replace(/\s+/g, " ").trim();
  if (!question) return { ok: false, error: "Type a question first" };
  if (question.length > maxChars) {
    return { ok: false, error: `Keep your question under ${maxChars} characters` };
  }
  return { ok: true, question };
}

const PRIVATE_PATTERNS = [
  /\b(phone|mobile|cell|whatsapp|contact)\s*(number|no\.?)\b/i,
  /\b(call|ring)\s+(him|chandra|chandru)\b/i,
  /\b(salary|ctc|compensation|pay\s*expectation|expected\s*pay|expected\s*salary)\b/i,
  /\b(home|residential|street|house)\s*address\b/i,
  /\b(password|passport|aadhaar|aadhar|pan\s*card|bank\s*account|date\s*of\s*birth|dob)\b/i,
];

export type Route = { kind: "refuse-private" } | { kind: "search" };

/**
 * Cheap, deterministic check that runs before any embedding or model call, so private
 * requests are refused for free and cannot be talked around by prompt wording.
 */
export function routeQuestion(question: string): Route {
  return PRIVATE_PATTERNS.some((p) => p.test(question)) ? { kind: "refuse-private" } : { kind: "search" };
}
