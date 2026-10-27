export const MAX_QUESTION_CHARS = 300;

// The owner's public contact address. This package runs on the server only, so it does not need the
// run-time assembly the website uses to hide the address from scrapers.
export const CONTACT_EMAIL = "chandramoorthy.dev@gmail.com";

export const PRIVATE_REFUSAL = `I can't share private details such as a phone number or home address. The best way to reach Chandra Moorthy is by email at ${CONTACT_EMAIL}.`;

export const UNKNOWN_ANSWER = `I can only answer questions about Chandra Moorthy's work, so I can't help with that one. Try asking about their projects, skills, availability or remote working, or email ${CONTACT_EMAIL}.`;

export const GREETING_REPLY =
  "Hello! I'm the assistant on Chandra Moorthy's portfolio. I can answer questions about their projects, skills, experience, availability and remote working. What would you like to know?";

export const THANKS_REPLY = `You're welcome! Ask me anything else about Chandra Moorthy's work, or email ${CONTACT_EMAIL} to reach them directly.`;

export const HELP_REPLY = `I answer questions about Chandra Moorthy's work: their four live products, tech stack, experience, availability for remote or relocation roles, and time-zone overlap. I only use the approved content on this site, so for anything else please email ${CONTACT_EMAIL}.`;

/** Salary is not shared by the assistant: it depends on the role, so the owner discusses it directly. */
export const COMPENSATION_REPLY =
  "Chandra Moorthy discusses compensation directly, because it depends on the role, scope, location and type of engagement. Send the role, your working style and your budget by email and expect a reply within 24 hours.";

/** Questions offered as one-tap buttons after a fixed reply. */
export const SUGGESTED_QUESTIONS = [
  "What is Chandra Moorthy's tech stack?",
  "Is Chandra Moorthy open to remote or relocation roles?",
  "Which time zones can Chandra Moorthy work with?",
  "What did Chandra Moorthy build on RentEasify?",
];

export type ReplyAction = { label: string; href: string };

/** An email that already has the questions a recruiter or client needs to answer, to start the conversation. */
export function enquiryAction(): ReplyAction {
  const subject = "Role enquiry for Chandra Moorthy";
  const body = [
    "Hello Chandra,",
    "",
    "Role and company:",
    "Type of engagement (full-time, contract, remote, hybrid or on-site):",
    "Preferred working hours and time zone:",
    "Budget or salary range:",
    "Team and how you like to work:",
    "Earliest start date:",
  ].join("\n");
  return { label: "Email about this role", href: `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}` };
}

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
  /\b(home|residential|street|house)\s*address\b/i,
  /\b(password|passport|aadhaar|aadhar|pan\s*card|bank\s*account|date\s*of\s*birth|dob)\b/i,
];

const COMPENSATION = /\b(salary|salaries|ctc|lpa|compensation|pay\s*expectations?|expected\s*(pay|salary|ctc|rate)|(hourly|daily|day|monthly)\s*rate|rate\s*card|how\s*much\s*(does|do|would|will)\b.*\b(charge|cost|earn|paid|pay))\b/i;

const GREETING =
  /^(hi+|hello|hey|hiya|good\s+(morning|afternoon|evening)|namaste|vanakkam|hola|bonjour|hallo|greetings)(\s+(there|chandra|chandra moorthy|bot|assistant|team|all|everyone))?[\s!.,?]*$/i;

const THANKS =
  /^(thanks|thank\s*you|thx|ty|cheers|great|awesome|nice|cool|perfect|ok|okay|got\s*it|good|appreciate\s*it|that\s*helps|bye|goodbye)(\s+(a\s*lot|so\s*much|very\s*much|chandra|bot|assistant))?[\s!.,]*$/i;

const HELP =
  /^(help|what\s+can\s+you\s+(do|help(\s+me)?\s+with)|how\s+(can|do)\s+you\s+help|who\s+are\s+you|what\s+are\s+you|what\s+is\s+this|how\s+does\s+this\s+work|what\s+can\s+i\s+ask(\s+you)?)[\s?!.]*$/i;

export type Route =
  | { kind: "refuse-private" }
  | { kind: "compensation" }
  | { kind: "greeting" }
  | { kind: "thanks" }
  | { kind: "help" }
  | { kind: "search" };

/**
 * Cheap, deterministic check that runs before any embedding or model call. Private requests are
 * refused, and greetings, thanks, help and salary questions get a fixed reply, all for free: they
 * use no model quota, cannot be talked around by wording, and need no retrieval.
 */
export function routeQuestion(question: string): Route {
  const q = question.trim();
  if (PRIVATE_PATTERNS.some((p) => p.test(q))) return { kind: "refuse-private" };
  if (COMPENSATION.test(q)) return { kind: "compensation" };
  if (GREETING.test(q)) return { kind: "greeting" };
  if (THANKS.test(q)) return { kind: "thanks" };
  if (HELP.test(q)) return { kind: "help" };
  return { kind: "search" };
}
