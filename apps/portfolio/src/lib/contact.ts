import { countries, guessCountry, normalizePhone } from "@my-portfolio/content";

export const CONTACT_TOPICS =["Job opportunity", "Interview", "Collaboration", "Project discussion", "Other"] as const;
export type ContactTopic = (typeof CONTACT_TOPICS)[number];
export type ContactKind = "message" | "call";

/** Time zones a visitor can pick for a call. Values are what arrives in the email, so keep them plain. */
export const CALL_ZONES = ["US Pacific", "US Eastern", "UK", "Central Europe", "Gulf", "India (IST)", "Other"] as const;

export const CONTACT_CHANNELS = ["email", "whatsapp", "phone"] as const;
export type ContactChannel = (typeof CONTACT_CHANNELS)[number];
export const CHANNEL_LABEL: Record<ContactChannel, string> = { email: "Email", whatsapp: "WhatsApp", phone: "Phone call" };

export type ContactDraft = {
  kind: ContactKind;
  name: string;
  email: string;
  topic: ContactTopic;
  message: string;
  channel: ContactChannel;
  /** Country of the phone number, as an ISO code such as "IN". Pre-selected from the visitor's browser languages. */
  country: string;
  phone: string;
  date: string;
  time: string;
  timeZone: string;
};

/** A blank form. The country code starts as the one that matches the visitor's browser languages. */
export function makeDraft(locales: readonly string[] = []): ContactDraft {
  return {
    kind: "message",
    name: "",
    email: "",
    topic: "Job opportunity",
    message: "",
    channel: "email",
    country: guessCountry(locales).iso,
    phone: "",
    date: "",
    time: "",
    timeZone: "US Eastern",
  };
}

export const emptyDraft: ContactDraft = makeDraft();

/** "+91" for "IN". Several countries share a code, which is why the form keeps the country, not the code. */
export const dialFor = (iso: string): string => countries.find((c) => c.iso === iso)?.dial ?? "";

const EMAIL = /^[^\s@<>()[\],;:"]+@[^\s@<>()[\],;:"]+\.[^\s@<>()[\],;:"]+$/;

/** The first thing wrong with the form, in plain words, or null. The server checks the same rules. */
export function validateDraft(d: ContactDraft): string | null {
  if (!d.name.trim()) return "Enter your name.";
  if (!EMAIL.test(d.email.trim())) return "Enter a valid email so I can reply.";
  if (d.phone.trim()) {
    const result = normalizePhone({ dial: dialFor(d.country), number: d.phone });
    if (!result.ok) return result.message;
  } else if (d.channel !== "email") {
    return `Add your phone number so I can reach you ${d.channel === "whatsapp" ? "on WhatsApp" : "by phone"}.`;
  }
  if (d.kind === "call" && !/^\d{4}-\d{2}-\d{2}$/.test(d.date)) return "Pick a preferred date for the call.";
  if (d.message.trim().length < 10) return "Add a short message, at least 10 characters.";
  if (d.message.trim().length > 2000) return "Your message is too long. Keep it under 2000 characters.";
  return null;
}

export type ContactPayload = {
  kind: ContactKind;
  name: string;
  email: string;
  topic: ContactTopic;
  message: string;
  channel: ContactChannel;
  phone?: { dial: string; number: string };
  preferred?: { date: string; time?: string; timeZone?: string };
  /** Hidden field. People never fill it; many bots do. */
  website: string;
  /** How long the form was open. An instant submit is a script, not a person. */
  elapsedMs: number;
};

export function toPayload(d: ContactDraft, trap: string, elapsedMs: number): ContactPayload {
  return {
    kind: d.kind,
    name: d.name.trim(),
    email: d.email.trim(),
    topic: d.topic,
    message: d.message.trim(),
    channel: d.channel,
    ...(d.phone.trim() ? { phone: { dial: dialFor(d.country), number: d.phone.trim() } } : {}),
    ...(d.kind === "call" ? { preferred: { date: d.date, time: d.time || undefined, timeZone: d.timeZone || undefined } } : {}),
    website: trap,
    elapsedMs,
  };
}

export type SendResult = { ok: true } | { ok: false; message: string; fallback: boolean };

/** Posts the form. Every failure becomes a sentence a visitor can act on; `fallback` means "show the email address". */
export async function sendContact(endpoint: string, payload: ContactPayload, fetchImpl: typeof fetch = fetch): Promise<SendResult> {
  let res: Response;
  try {
    res = await fetchImpl(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    return { ok: false, message: "I could not reach the server. Please email me directly.", fallback: true };
  }
  if (res.ok) return { ok: true };

  let message = "";
  try {
    message = ((await res.json()) as { error?: { message?: string } }).error?.message ?? "";
  } catch {
    /* not JSON: use the generic text below */
  }
  // A 4xx other than rate limiting is a problem with what was typed, so the visitor can fix it and retry.
  const fixable = res.status === 400;
  return {
    ok: false,
    message: message || "Something went wrong. Please email me directly.",
    fallback: !fixable,
  };
}
