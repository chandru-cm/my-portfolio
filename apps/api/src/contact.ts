import { normalizePhone, profile, type NormalizedPhone } from "@my-portfolio/content";
import { clientIp, corsHeaders, isOriginAllowed, jsonError } from "./http";
import type { RateLimiter } from "./limiter";
import { renderOwnerHtml, renderReceiptHtml } from "./mailTemplates";

export const CONTACT_TOPICS = ["Job opportunity", "Interview", "Collaboration", "Project discussion", "Other"] as const;
export type ContactTopic = (typeof CONTACT_TOPICS)[number];
export type ContactKind = "message" | "call";

/** `text` is always present. `html` is the designed version; clients that cannot show it fall back to the text. */
export type OutgoingMail = { to: string; subject: string; text: string; html?: string; replyTo?: string };

/** Sends one email. The real one speaks SMTP; tests use a fake. */
export interface Mailer {
  send(mail: OutgoingMail): Promise<void>;
}

/** A second, independent channel (a phone alert) so a delayed or failed email never hides a visitor. */
export interface Notifier {
  notify(text: string): Promise<void>;
}

export type ContactHandlerConfig = {
  allowedOrigins: string[];
  allowMissingOrigin: boolean;
  maxBodyBytes: number;
  /** Where messages are delivered. Empty when only the phone alert is configured. */
  ownerEmail: string;
  /** Also email the visitor a short "received" note. */
  sendConfirmation: boolean;
  /** The public address of the website, used for the link in the visitor's receipt. Empty means no link. */
  siteUrl: string;
};

export type ContactLogEvent = {
  status: number;
  kind?: string;
  reason?: string;
  channels?: string[];
  /** Channels that failed, with an error code only, for example "email:EAUTH". Never the error message. */
  failed?: string[];
  ms: number;
};

/** A short, secret-free description of why a channel failed: an error code or class, never its message. */
function failureCode(channel: string, error: unknown): string {
  const e = error as { code?: unknown; responseCode?: unknown; name?: unknown; message?: unknown } | null;
  const telegram = typeof e?.message === "string" ? /^telegram:(\d{3})$/.exec(e.message) : null;
  const code = telegram?.[1] ?? (typeof e?.code === "string" ? e.code : typeof e?.responseCode === "number" ? e.responseCode : typeof e?.name === "string" ? e.name : "unknown");
  return `${channel}:${code}`;
}

export type ContactDeps = {
  config: ContactHandlerConfig;
  /** At least one of mailer and notifier is always present (the loader enforces it). */
  mailer?: Mailer;
  notifier?: Notifier;
  limits: { perMinute: RateLimiter; perDay: RateLimiter; global: RateLimiter };
  /** Receives status, kind and channel names only. Never a name, address or message. */
  log?: (event: ContactLogEvent) => void;
  now?: () => Date;
};

/** How the visitor would like to be reached. A number is required for WhatsApp and phone, optional for email. */
export const CONTACT_CHANNELS = ["email", "whatsapp", "phone"] as const;
export type ContactChannel = (typeof CONTACT_CHANNELS)[number];

export type ContactRequest = {
  kind: ContactKind;
  name: string;
  email: string;
  topic: ContactTopic;
  message: string;
  channel: ContactChannel;
  phone?: NormalizedPhone;
  preferred?: { date: string; time?: string; timeZone?: string };
};

/** A bot that fills the hidden field, or submits faster than a person can type, gets a fake success. */
type Parsed = { ok: true; request: ContactRequest } | { ok: false; message: string } | { ok: "bot" };

const MIN_FILL_MS = 1500;
const EMAIL = /^[^\s@<>()[\],;:"]+@[^\s@<>()[\],;:"]+\.[^\s@<>()[\],;:"]+$/;
// eslint-disable-next-line no-control-regex
const CONTROL = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g;

/** One line, no control characters: safe to put in an email header or subject. */
export function oneLine(value: string): string {
  return value.replace(CONTROL, " ").replace(/\s+/g, " ").trim();
}

function str(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

export function parseContact(text: string): Parsed {
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return { ok: false, message: "Send a JSON body." };
  }
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return { ok: false, message: "Send a JSON object." };
  }
  const b = body as Record<string, unknown>;

  if ((str(b.website) ?? "").trim() !== "") return { ok: "bot" };
  if (typeof b.elapsedMs === "number" && b.elapsedMs < MIN_FILL_MS) return { ok: "bot" };

  const kind: ContactKind = b.kind === "call" ? "call" : "message";
  const name = oneLine(str(b.name) ?? "");
  if (!name) return { ok: false, message: "Enter your name." };
  if (name.length > 80) return { ok: false, message: "Your name is too long." };

  const email = oneLine(str(b.email) ?? "");
  if (email.length > 254 || !EMAIL.test(email)) return { ok: false, message: "Enter a valid email so I can reply." };

  const message = (str(b.message) ?? "").replace(CONTROL, "").trim();
  if (message.length < 10) return { ok: false, message: "Add a short message, at least 10 characters." };
  if (message.length > 2000) return { ok: false, message: "Your message is too long. Keep it under 2000 characters." };

  const topicRaw = str(b.topic);
  const topic = (CONTACT_TOPICS as readonly string[]).includes(topicRaw ?? "") ? (topicRaw as ContactTopic) : "Other";

  const channelRaw = str(b.channel);
  const channel: ContactChannel = (CONTACT_CHANNELS as readonly string[]).includes(channelRaw ?? "") ? (channelRaw as ContactChannel) : "email";
  let phone: NormalizedPhone | undefined;
  const ph = (typeof b.phone === "object" && b.phone !== null ? b.phone : {}) as Record<string, unknown>;
  if ((str(ph.number) ?? "").trim() !== "") {
    const result = normalizePhone({ dial: str(ph.dial) ?? "", number: str(ph.number) ?? "" });
    if (!result.ok) return { ok: false, message: result.message };
    phone = result.phone;
  }
  if (channel !== "email" && !phone) {
    return { ok: false, message: `Add your phone number so I can reach you ${channel === "whatsapp" ? "on WhatsApp" : "by phone"}.` };
  }

  let preferred: ContactRequest["preferred"];
  if (kind === "call") {
    const p = (typeof b.preferred === "object" && b.preferred !== null ? b.preferred : {}) as Record<string, unknown>;
    const date = str(p.date)?.trim() ?? "";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { ok: false, message: "Pick a preferred date for the call." };
    const time = str(p.time)?.trim() ?? "";
    preferred = {
      date,
      time: /^\d{2}:\d{2}$/.test(time) ? time : undefined,
      timeZone: oneLine(str(p.timeZone) ?? "").slice(0, 40) || undefined,
    };
  }
  return { ok: true, request: { kind, name, email, topic, message, channel, phone, preferred } };
}

/** What happened to the visitor's receipt email: sent, failed (their message still reached the owner), or switched off. */
export type Receipt = "sent" | "failed" | "off";

export const CHANNEL_LABEL: Record<ContactChannel, string> = { email: "Email", whatsapp: "WhatsApp", phone: "Phone call" };

const when = (p: NonNullable<ContactRequest["preferred"]>) =>
  [p.date, p.time, p.timeZone ? `(${p.timeZone})` : ""].filter(Boolean).join(" ");

export function ownerMail(req: ContactRequest, to: string, at: Date): OutgoingMail {
  const call = req.kind === "call";
  const preferred = call && req.preferred ? when(req.preferred) : "";
  const subject = oneLine(
    `[Portfolio] ${call ? "Call request" : req.topic} from ${req.name}${preferred ? `, ${preferred}` : ""}`
  );
  const text = [
    call ? "New call request from your portfolio" : "New message from your portfolio",
    "",
    `Name: ${req.name}`,
    `Email: ${req.email}`,
    ...(req.phone ? [`Phone: ${req.phone.display}`] : []),
    `Best way to reach them: ${CHANNEL_LABEL[req.channel]}`,
    `About: ${req.topic}`,
    ...(preferred ? [`Preferred time: ${preferred}`] : []),
    "",
    "Message:",
    req.message,
    "",
    `Reply to this email to answer ${req.name}.`,
    `Received ${at.toISOString()}`,
  ].join("\n");
  return { to, subject, text, html: renderOwnerHtml(req, subject, at), replyTo: `"${req.name.replace(/"/g, "")}" <${req.email}>` };
}

export function confirmationMail(req: ContactRequest, siteUrl = ""): OutgoingMail {
  const first = req.name.split(" ")[0];
  const text = [
    `Hi ${first},`,
    "",
    req.kind === "call"
      ? "Thanks for asking for a call. I received your request and will confirm a time by email."
      : "Thanks for getting in touch. I received your message.",
    req.channel !== "email" && req.phone
      ? `I reply within ${profile.replyTime}, by ${CHANNEL_LABEL[req.channel]} on ${req.phone.display}.`
      : `I reply within ${profile.replyTime}, by email at ${req.email}.`,
    "",
    profile.name,
    "",
    "If you did not send this, you can ignore this email.",
  ].join("\n");
  return { to: req.email, subject: `Got your message, ${profile.name}`, text, html: renderReceiptHtml(req, siteUrl) };
}

export function alertText(req: ContactRequest): string {
  const preferred = req.kind === "call" && req.preferred ? `\nWhen: ${when(req.preferred)}` : "";
  const snippet = req.message.length > 300 ? `${req.message.slice(0, 300)}...` : req.message;
  const reach = req.phone ? `\n${CHANNEL_LABEL[req.channel]}: ${req.phone.display}` : "";
  return `Portfolio ${req.kind === "call" ? "call request" : "message"}\n${req.name} <${req.email}>${reach}\nAbout: ${req.topic}${preferred}\n\n${snippet}`;
}

const encoder = new TextEncoder();

export async function handleContact(request: Request, deps: ContactDeps): Promise<Response> {
  const started = performance.now();
  const finish = (res: Response, kind?: string, reason?: string, channels?: string[], failed?: string[]): Response => {
    deps.log?.({
      status: res.status,
      kind,
      reason,
      channels,
      ...(failed && failed.length ? { failed } : {}),
      ms: Math.round(performance.now() - started),
    });
    return res;
  };
  try {
    return await run(request, deps, finish);
  } catch {
    return finish(jsonError(500, "internal", "Something went wrong. Please email me directly."), undefined, "unhandled");
  }
}

async function run(
  request: Request,
  deps: ContactDeps,
  finish: (res: Response, kind?: string, reason?: string, channels?: string[], failed?: string[]) => Response
): Promise<Response> {
  const { config } = deps;
  const origin = request.headers.get("origin");

  if (!isOriginAllowed(origin, config.allowedOrigins, config.allowMissingOrigin)) {
    return finish(jsonError(403, "forbidden_origin", "This origin is not allowed."), undefined, "origin");
  }
  const cors = corsHeaders(origin, config.allowedOrigins);

  if (request.method === "OPTIONS") {
    return finish(new Response(null, { status: 204, headers: corsHeaders(origin, config.allowedOrigins, true) }));
  }
  if (request.method !== "POST") {
    return finish(jsonError(405, "method_not_allowed", "Use POST.", { ...cors, Allow: "POST, OPTIONS" }), undefined, "method");
  }

  const tooLarge = () => finish(jsonError(413, "body_too_large", "Request is too large.", cors), undefined, "size");
  if (Number(request.headers.get("content-length") ?? 0) > config.maxBodyBytes) return tooLarge();
  const text = await request.text();
  if (encoder.encode(text).length > config.maxBodyBytes) return tooLarge();

  const ip = clientIp(request.headers);
  const rateLimited = async (limiter: RateLimiter, key: string): Promise<Response | null> => {
    const result = await limiter.check(key);
    if (result.allowed) return null;
    return finish(
      jsonError(429, "rate_limited", `Too many messages from this connection. Please email ${profile.email} instead.`, {
        ...cors,
        "Retry-After": String(result.retryAfterSec),
      }),
      undefined,
      "rate_limited"
    );
  };
  const tooFast = await rateLimited(deps.limits.perMinute, ip);
  if (tooFast) return tooFast;

  const parsed = parseContact(text);
  if (parsed.ok === false) return finish(jsonError(400, "invalid_request", parsed.message, cors), undefined, "invalid");

  const okBody = (delivered: string[], receipt?: Receipt) =>
    new Response(JSON.stringify({ ok: true, delivered, ...(receipt ? { receipt } : {}) }), {
      status: 200,
      headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...cors },
    });
  // Looks like success to the bot. Nothing is sent and no quota is used.
  if (parsed.ok === "bot") return finish(okBody([]), "bot", "bot");

  const day = (await rateLimited(deps.limits.perDay, ip)) ?? (await rateLimited(deps.limits.global, "global"));
  if (day) return day;

  const req = parsed.request;
  const at = (deps.now ?? (() => new Date()))();

  // Both channels run at the same time. The visitor is told "sent" if either one got through.
  const attempts: [string, Promise<void>][] = [];
  if (deps.mailer && config.ownerEmail) attempts.push(["email", deps.mailer.send(ownerMail(req, config.ownerEmail, at))]);
  if (deps.notifier) attempts.push(["alert", deps.notifier.notify(alertText(req))]);
  const settled = await Promise.allSettled(attempts.map(([, p]) => p));
  const delivered = attempts.filter((_, i) => settled[i].status === "fulfilled").map(([name]) => name);
  const failed = attempts.flatMap(([name], i) => {
    const r = settled[i];
    return r.status === "rejected" ? [failureCode(name, r.reason)] : [];
  });

  if (delivered.length === 0) {
    return finish(
      jsonError(502, "upstream_error", `I could not send your message. Please email me directly at ${profile.email}.`, cors),
      req.kind,
      "delivery_failed",
      [],
      failed
    );
  }

  let receipt: Receipt = "off";
  if (config.sendConfirmation && deps.mailer) {
    // Best effort: the owner already has the message, so a failed receipt must not fail the request.
    receipt = "sent";
    await deps.mailer.send(confirmationMail(req, config.siteUrl)).catch((error) => {
      receipt = "failed";
      failed.push(failureCode("receipt", error));
    });
  }
  return finish(okBody(delivered, receipt), req.kind, undefined, delivered, failed);
}
