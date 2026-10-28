import { profile } from "@my-portfolio/content";
import { CHANNEL_LABEL, type ContactRequest } from "./contact";

/**
 * HTML for the two emails the contact form sends. Email clients are far stricter than browsers, so this is
 * written the way email has to be: table layout, inline styles, no scripts, no web fonts, no remote images.
 * Every visitor-supplied value goes through esc() first. The plain-text twin of each email is built in
 * contact.ts, so a client that blocks HTML still shows the message.
 *
 * Look: the site's "Ink and Indigo" theme. A near-black header carries the headline, a white card carries the
 * details, one indigo accent marks actions, and green marks WhatsApp.
 *
 * To see both emails in a browser, in light and dark: npm run mail:preview -w @my-portfolio/api
 */

const INK = "#0a0a0a";
const MUTED = "#5c5c57";
const LINE = "#e2e0da";
const PAPER = "#f4f3f0";
const ACCENT = "#4338ca";
const ACCENT_SOFT = "#eef0ff";
const ACCENT_ON_INK = "#9aa2ff";
const ON_INK_MUTED = "#a1a1aa";
const WHATSAPP = "#128c7e";
const FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
const MONO = "ui-monospace,SFMono-Regular,Menlo,Consolas,monospace";

/** Times in the owner's email are shown in the owner's own time zone. */
const OWNER_TIME_ZONE = "Asia/Kolkata";

export function esc(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

/** Only web addresses become links, so a stray value can never turn into a javascript: link. */
const safeUrl = (url: string) => (/^https?:\/\/[^\s"'<>]+$/i.test(url) ? url : "");

/** Keeps the message's line breaks and turns nothing into markup. */
const multiline = (text: string) => esc(text).replace(/\r?\n/g, "<br>");

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => Array.from(p)[0]?.toUpperCase() ?? "")
    .join("") || "?";

/** "2026-11-03" becomes "Tue, 3 Nov 2026". Falls back to the raw text for anything unexpected. */
function niceDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

const receivedText = (at: Date) =>
  `${at.toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true, timeZone: OWNER_TIME_ZONE })} IST`;

const DARK_MODE = `
  @media (prefers-color-scheme: dark) {
    .bg { background: #0b0b0c !important; }
    .card { background: #131315 !important; border-color: #2a2a2e !important; }
    .ink { color: #ededed !important; }
    .muted { color: #9a9aa1 !important; }
    .tint { background: #1a1b33 !important; border-color: #2a2a2e !important; }
    .rule { border-color: #2a2a2e !important; }
    .pill { background: #1a1b33 !important; color: #9aa2ff !important; }
    .badge { background: #1a1b33 !important; color: #9aa2ff !important; }
    .lnk { color: #9aa2ff !important; }
    .ghost { border-color: #3a3a40 !important; color: #ededed !important; }
    .head { border-bottom: 1px solid #2a2a2e; }
  }
  @media (max-width: 620px) {
    .wrap { width: 100% !important; }
    .pad { padding: 22px !important; }
    .headpad { padding: 24px 22px !important; }
  }`;

type Shell = { title: string; preheader: string; eyebrow: string; headline: string; sub: string; body: string; footer: string };

/** The frame both emails share: a dark header with the headline, a white card with the details, a quiet footer. */
function shell(s: Shell): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light dark">
<meta name="supported-color-schemes" content="light dark">
<title>${esc(s.title)}</title>
<style>${DARK_MODE}</style>
</head>
<body class="bg" style="margin:0;padding:0;background:${PAPER};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${esc(s.preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="bg" style="background:${PAPER};">
<tr><td align="center" style="padding:32px 12px;">
  <table role="presentation" class="wrap" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:100%;">
    <tr><td class="card" style="background:#ffffff;border:1px solid ${LINE};border-radius:16px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr><td class="head headpad" style="background:${INK};border-radius:15px 15px 0 0;padding:30px 32px 32px 32px;font-family:${FONT};">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 26px 0;"><tr>
            <td align="center" style="width:30px;height:30px;background:#ffffff;color:${INK};border-radius:8px;font-family:${FONT};font-size:12px;font-weight:700;letter-spacing:-0.02em;">CM</td>
            <td style="padding-left:10px;font-family:${FONT};font-size:13px;color:${ON_INK_MUTED};">${esc(profile.name)}</td>
          </tr></table>
          <div style="font-family:${MONO};font-size:11px;letter-spacing:0.09em;text-transform:uppercase;color:${ACCENT_ON_INK};">${esc(s.eyebrow)}</div>
          <h1 style="margin:10px 0 8px 0;font-size:30px;line-height:1.15;letter-spacing:-0.025em;font-weight:600;color:#ffffff;">${s.headline}</h1>
          <div style="font-size:14px;line-height:1.5;color:${ON_INK_MUTED};">${s.sub}</div>
        </td></tr>
        <tr><td class="pad" style="padding:30px 32px 32px 32px;font-family:${FONT};">
          ${s.body}
        </td></tr>
      </table>
    </td></tr>
    <tr><td class="muted" style="padding:18px 10px 0 10px;font-family:${FONT};font-size:12px;line-height:1.6;color:${MUTED};">${s.footer}</td></tr>
  </table>
</td></tr>
</table>
</body>
</html>`;
}

/**
 * A small label. Each one carries its own right and bottom margin, so when two do not fit on one line (a phone) the
 * second wraps under the first with a gap instead of touching it. Put them next to each other with nothing between.
 */
const pill = (text: string) =>
  `<span class="pill" style="display:inline-block;margin:0 6px 6px 0;padding:4px 10px;border-radius:999px;background:${ACCENT_SOFT};color:${ACCENT};font-family:${MONO};font-size:12px;line-height:18px;white-space:nowrap;">${esc(text)}</span>`;

const label = (text: string, margin = "0 0 8px 0") =>
  `<div class="muted" style="margin:${margin};font-family:${MONO};font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:${MUTED};">${esc(text)}</div>`;

type Action = { href: string; text: string; kind: "primary" | "whatsapp" | "ghost" };

/** Buttons are plain links in inline-block, so they wrap onto a second line on a narrow phone. */
function actions(list: Action[]): string {
  const style = (k: Action["kind"]) =>
    k === "primary"
      ? `background:${ACCENT};border:1px solid ${ACCENT};color:#ffffff;`
      : k === "whatsapp"
        ? `background:${WHATSAPP};border:1px solid ${WHATSAPP};color:#ffffff;`
        : `background:transparent;border:1px solid ${LINE};color:${INK};`;
  return list
    .map(
      (a) =>
        `<a ${a.kind === "ghost" ? 'class="ghost" ' : ""}href="${esc(a.href)}" style="display:inline-block;margin:0 8px 8px 0;padding:12px 20px;border-radius:9px;font-family:${FONT};font-size:15px;font-weight:600;text-decoration:none;${style(a.kind)}">${esc(a.text)}</a>`
    )
    .join("");
}

const messageBox = (text: string) =>
  `<div class="tint ink" style="padding:18px 20px;background:${ACCENT_SOFT};border:1px solid ${LINE};border-radius:12px;font-family:${FONT};font-size:15px;line-height:1.65;color:${INK};">${multiline(text)}</div>`;

/**
 * The email that lands in the owner's inbox. It answers three questions at a glance: who is this, how do I
 * reach them fastest, and what do they want. The buttons put the visitor's preferred channel first.
 */
export function renderOwnerHtml(req: ContactRequest, subject: string, at: Date): string {
  const call = req.kind === "call";
  const first = req.name.split(" ")[0];
  const p = call ? req.preferred : undefined;
  const reply: Action = {
    href: `mailto:${req.email}?subject=${encodeURIComponent(`Re: ${subject.replace(/^\[Portfolio\]\s*/, "")}`)}`,
    text: req.phone ? "Reply by email" : `Reply to ${first}`,
    kind: "primary",
  };

  const buttons: Action[] = [];
  if (req.phone) {
    const hi = `Hi ${first}, this is ${profile.name}. Thanks for reaching out on my portfolio.`;
    const whatsapp: Action = {
      href: `https://wa.me/${req.phone.e164.slice(1)}?text=${encodeURIComponent(hi)}`,
      text: "WhatsApp",
      kind: "whatsapp",
    };
    const callBtn: Action = { href: `tel:${req.phone.e164}`, text: "Call", kind: "ghost" };
    if (req.channel === "whatsapp") buttons.push(whatsapp, { ...reply, kind: "ghost" }, callBtn);
    else if (req.channel === "phone") buttons.push({ ...callBtn, kind: "primary" }, { ...whatsapp, kind: "ghost" }, { ...reply, kind: "ghost" });
    else buttons.push(reply, { ...whatsapp, kind: "ghost" }, callBtn);
  } else {
    buttons.push(reply);
  }

  const who = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 22px 0;"><tr>
      <td valign="top" style="width:52px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
          <td class="badge" align="center" style="width:48px;height:48px;background:${ACCENT_SOFT};color:${ACCENT};border-radius:24px;font-family:${FONT};font-size:17px;font-weight:600;line-height:48px;">${esc(initials(req.name))}</td>
        </tr></table>
      </td>
      <td valign="top" style="padding-left:14px;font-family:${FONT};">
        <div class="ink" style="font-size:18px;font-weight:600;color:${INK};">${esc(req.name)}</div>
        <div style="font-size:14px;margin-top:3px;word-break:break-all;"><a class="lnk" href="mailto:${esc(req.email)}" style="color:${ACCENT};text-decoration:none;">${esc(req.email)}</a></div>
        ${req.phone ? `<div style="font-size:14px;margin-top:2px;"><a class="lnk" href="tel:${esc(req.phone.e164)}" style="color:${ACCENT};text-decoration:none;">${esc(req.phone.display)}</a></div>` : ""}
        <div style="margin-top:10px;">${pill(req.topic)}${req.channel !== "email" ? pill(`Prefers ${CHANNEL_LABEL[req.channel]}`) : ""}</div>
      </td>
    </tr></table>`;

  const when = p
    ? `<div class="tint" style="margin:0 0 22px 0;padding:16px 20px;background:${ACCENT_SOFT};border:1px solid ${LINE};border-radius:12px;font-family:${FONT};">
        ${label("Requested time", "0 0 6px 0")}
        <div class="ink" style="font-size:21px;font-weight:600;letter-spacing:-0.01em;color:${INK};">${esc(niceDate(p.date))}${p.time ? ` &middot; ${esc(p.time)}` : ""}</div>
        ${p.timeZone ? `<div class="muted" style="margin-top:2px;font-size:14px;color:${MUTED};">${esc(p.timeZone)} time zone</div>` : ""}
      </div>`
    : "";

  const body = `
    ${who}
    <div style="margin:0 0 26px 0;">${actions(buttons)}</div>
    ${when}
    ${label(call ? "Their note" : "Message")}
    ${messageBox(req.message)}`;

  return shell({
    title: subject,
    preheader: `${req.name}: ${req.message.slice(0, 90)}`,
    eyebrow: call ? "Call request" : "New message",
    headline: `${esc(req.name)} ${call ? "would like a call" : "wrote to you"}`,
    sub: `Received ${esc(receivedText(at))}`,
    body,
    footer: "Sent by the contact form on your portfolio. Replying by email goes straight to the visitor.",
  });
}

/** The receipt the visitor gets: friendly, short, and clear about what happens next. */
export function renderReceiptHtml(req: ContactRequest, siteUrl: string): string {
  const call = req.kind === "call";
  const first = req.name.split(" ")[0];
  const p = call ? req.preferred : undefined;
  const site = safeUrl(siteUrl);
  const linkStyle = `color:${ACCENT};text-decoration:none;`;
  const excerpt = req.message.length > 280 ? `${req.message.slice(0, 280)}...` : req.message;
  // Say where the reply will go: the phone number when they chose WhatsApp or a call, otherwise their email address.
  const channelNote =
    req.channel !== "email" && req.phone
      ? ` by ${esc(CHANNEL_LABEL[req.channel])} on <strong>${esc(req.phone.display)}</strong>`
      : ` by email at <strong>${esc(req.email)}</strong>`;

  const steps = (call
    ? ["I read your request today.", `I confirm a time with you, usually within ${profile.replyTime}.`, "We talk."]
    : ["I read your message today.", `I reply, usually within ${profile.replyTime}.`, "If it is a fit, we set up a call."]
  )
    .map(
      // The badge sits in its own little table so the row's extra height cannot stretch it into an oval.
      (t, i) => `<tr>
      <td valign="top" style="width:24px;padding:0 0 12px 0;"><table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
        <td class="badge" align="center" style="width:24px;height:24px;background:${ACCENT_SOFT};color:${ACCENT};border-radius:12px;font-family:${MONO};font-size:12px;line-height:24px;">${i + 1}</td>
      </tr></table></td>
      <td class="ink" style="padding:2px 0 12px 12px;font-family:${FONT};font-size:15px;line-height:1.5;color:${INK};">${esc(t)}</td>
    </tr>`
    )
    .join("");

  const links = [
    site && `<a class="lnk" href="${esc(site)}" style="${linkStyle}">Portfolio</a>`,
    safeUrl(profile.github) && `<a class="lnk" href="${esc(profile.github)}" style="${linkStyle}">GitHub</a>`,
    safeUrl(profile.linkedin) && `<a class="lnk" href="${esc(profile.linkedin)}" style="${linkStyle}">LinkedIn</a>`,
  ]
    .filter(Boolean)
    .join(`<span class="muted" style="color:${MUTED};"> &nbsp;&middot;&nbsp; </span>`);

  const sent = `
    ${pill(req.topic)}
    ${p ? `<div class="ink" style="margin:10px 0 0 0;font-size:15px;font-weight:600;color:${INK};">${esc(niceDate(p.date))}${p.time ? ` &middot; ${esc(p.time)}` : ""}${p.timeZone ? ` <span class="muted" style="font-weight:400;color:${MUTED};">(${esc(p.timeZone)})</span>` : ""}</div>` : ""}
    <div style="margin-top:12px;">${multiline(excerpt)}</div>`;

  const body = `
    <p class="ink" style="margin:0 0 26px 0;font-size:16px;line-height:1.65;color:${INK};">
      ${call ? "Thanks for asking for a call." : "Thanks for getting in touch."} I received it, and I will reply within <strong>${esc(profile.replyTime)}</strong>${channelNote}.
    </p>
    ${label("What you sent")}
    <div class="tint ink" style="padding:16px 18px;background:${ACCENT_SOFT};border:1px solid ${LINE};border-radius:12px;font-size:14px;line-height:1.6;color:${INK};">${sent}</div>
    ${label("What happens next", "26px 0 12px 0")}
    <table role="presentation" cellpadding="0" cellspacing="0" border="0">${steps}</table>
    <p class="ink" style="margin:20px 0 0 0;font-size:15px;line-height:1.6;color:${INK};">
      ${esc(profile.name)}<br><span class="muted" style="color:${MUTED};">${esc(profile.headline)}</span>
    </p>
    ${links ? `<p style="margin:12px 0 0 0;font-size:14px;">${links}</p>` : ""}`;

  return shell({
    title: `Got your message, ${profile.name}`,
    preheader: `I received your message and will reply within ${profile.replyTime}.`,
    eyebrow: "Message received",
    headline: `Thanks, ${esc(first)}. I have got it.`,
    sub: `I reply within ${esc(profile.replyTime)}${channelNote}.`,
    body,
    footer: "You are getting this because someone used the contact form on my portfolio with this address. If that was not you, you can ignore this email.",
  });
}
