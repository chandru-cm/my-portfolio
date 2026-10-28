import { profile } from "@my-portfolio/content";
import { Redis } from "@upstash/redis";
import nodemailer from "nodemailer";
import type { ContactDeps, ContactHandlerConfig, Mailer, Notifier, OutgoingMail } from "./contact";
import { isProduction, type Env } from "./config";
import { InMemoryRateLimiter, UpstashRateLimiter } from "./limiter";

const MINUTE = 60;
const DAY = 86_400;

export type SmtpSettings = { host: string; port: number; user: string; pass: string };
export type TelegramSettings = { botToken: string; chatId: string };

export type ContactConfig = ContactHandlerConfig & {
  smtp?: SmtpSettings;
  telegram?: TelegramSettings;
  upstash?: { url: string; token: string };
  perMinute: number;
  perDay: number;
  globalDaily: number;
};

export class ContactConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ContactConfigError";
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

const looksLikeEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

/**
 * Settings for the contact form. Needs at least one delivery channel: email over SMTP, a Telegram alert,
 * or both. Collects every problem and reports them together, and never echoes a secret value.
 */
export function loadContactConfig(env: Env, options: { production?: boolean } = {}): ContactConfig {
  const production = options.production ?? isProduction(env);
  const problems: string[] = [];

  const smtpUser = env.SMTP_USER?.trim() ?? "";
  // Google shows an app password as four groups of four letters. Spaces are not part of the password.
  const smtpPass = (env.SMTP_PASS ?? "").replace(/\s+/g, "");
  if (Boolean(smtpUser) !== Boolean(smtpPass)) problems.push("Set both SMTP_USER and SMTP_PASS, or neither");
  const smtpPort = int(env, "SMTP_PORT", 465, problems);

  const botToken = env.TELEGRAM_BOT_TOKEN?.trim() ?? "";
  const chatId = env.TELEGRAM_CHAT_ID?.trim() ?? "";
  if (Boolean(botToken) !== Boolean(chatId)) problems.push("Set both TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID, or neither");

  const smtp = smtpUser && smtpPass ? { host: env.SMTP_HOST?.trim() || "smtp.gmail.com", port: smtpPort, user: smtpUser, pass: smtpPass } : undefined;
  const telegram = botToken && chatId ? { botToken, chatId } : undefined;
  if (!smtp && !telegram && problems.length === 0) {
    problems.push("Configure a delivery channel: SMTP_USER and SMTP_PASS (email), or TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID (phone alert)");
  }

  const ownerEmail = (env.CONTACT_TO?.trim() || smtpUser).trim();
  if (smtp && !looksLikeEmail(ownerEmail)) problems.push("CONTACT_TO must be an email address");
  if (smtp && !looksLikeEmail(smtpUser)) problems.push("SMTP_USER must be an email address");

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
  if (Boolean(upstashUrl) !== Boolean(upstashToken)) problems.push("Set both UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN, or neither");

  const config: ContactConfig = {
    allowedOrigins,
    allowMissingOrigin: !production,
    maxBodyBytes: 8192,
    ownerEmail: smtp ? ownerEmail : "",
    sendConfirmation: (env.CONTACT_CONFIRMATION ?? "true").trim().toLowerCase() !== "false",
    siteUrl: (env.SITE_URL?.trim() || allowedOrigins[0] || "").replace(/\/+$/, ""),
    smtp,
    telegram,
    upstash: upstashUrl && upstashToken ? { url: upstashUrl, token: upstashToken } : undefined,
    perMinute: int(env, "CONTACT_RATE_LIMIT_PER_MINUTE", 3, problems),
    perDay: int(env, "CONTACT_RATE_LIMIT_PER_DAY", 10, problems),
    globalDaily: int(env, "CONTACT_GLOBAL_DAILY_LIMIT", 60, problems),
  };
  if (problems.length) throw new ContactConfigError(`Invalid contact configuration:\n- ${problems.join("\n- ")}`);
  return config;
}

/** Sends through any SMTP server. The default settings are Gmail with an app password. */
export class SmtpMailer implements Mailer {
  private readonly transport;

  constructor(private readonly smtp: SmtpSettings) {
    this.transport = nodemailer.createTransport({
      host: smtp.host,
      port: smtp.port,
      secure: smtp.port === 465,
      auth: { user: smtp.user, pass: smtp.pass },
      // One message goes to you and one receipt to the visitor. Keeping the connection open for the second
      // saves a full TLS handshake and login, which is most of the wait.
      pool: true,
      maxConnections: 1,
      maxMessages: 5,
      connectionTimeout: 8000,
      greetingTimeout: 8000,
      socketTimeout: 10000,
    });
  }

  async send(mail: OutgoingMail): Promise<void> {
    await this.transport.sendMail({
      // Gmail only sends as the signed-in account, so the visible sender is always that address.
      from: `"${profile.name} (portfolio)" <${this.smtp.user}>`,
      to: mail.to,
      subject: mail.subject,
      text: mail.text,
      html: mail.html,
      replyTo: mail.replyTo,
    });
  }
}

/** Phone alert through a Telegram bot. Errors name the HTTP status only, never the token. */
export class TelegramNotifier implements Notifier {
  constructor(
    private readonly settings: TelegramSettings,
    private readonly fetchImpl: typeof fetch = fetch
  ) {}

  async notify(text: string): Promise<void> {
    const res = await this.fetchImpl(`https://api.telegram.org/bot${this.settings.botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: this.settings.chatId, text, disable_web_page_preview: true }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`telegram:${res.status}`);
  }
}

/** Composition root for the contact form: the only place real services are constructed. */
export function createContactDeps(config: ContactConfig): ContactDeps {
  const limits = config.upstash
    ? (() => {
        const redis = new Redis({ url: config.upstash.url, token: config.upstash.token });
        return {
          perMinute: new UpstashRateLimiter(redis, config.perMinute, MINUTE, "ct:min"),
          perDay: new UpstashRateLimiter(redis, config.perDay, DAY, "ct:day"),
          global: new UpstashRateLimiter(redis, config.globalDaily, DAY, "ct:global"),
        };
      })()
    : {
        perMinute: new InMemoryRateLimiter(config.perMinute, MINUTE * 1000),
        perDay: new InMemoryRateLimiter(config.perDay, DAY * 1000),
        global: new InMemoryRateLimiter(config.globalDaily, DAY * 1000),
      };

  return {
    config,
    mailer: config.smtp ? new SmtpMailer(config.smtp) : undefined,
    notifier: config.telegram ? new TelegramNotifier(config.telegram) : undefined,
    limits,
    log: (event) => console.log(JSON.stringify({ evt: "contact", ...event })),
  };
}

let cached: ContactDeps | undefined;

/** Built once per warm instance and reused across requests. */
export function getContactDeps(env: Env): ContactDeps {
  cached ??= createContactDeps(loadContactConfig(env));
  return cached;
}
