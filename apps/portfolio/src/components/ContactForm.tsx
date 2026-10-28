import { useId, useRef, useState, type FormEvent } from "react";
import { profile } from "@my-portfolio/content";
import CountryPicker from "./CountryPicker";
import Cta from "./Cta";
import {
  CALL_ZONES,
  CHANNEL_LABEL,
  CONTACT_CHANNELS,
  CONTACT_TOPICS,
  makeDraft,
  sendContact,
  toPayload,
  validateDraft,
  type ContactDraft,
  type ContactKind,
} from "../lib/contact";
import { CONTACT_ENDPOINT } from "../lib/site";

type Status = "idle" | "sending" | "sent";

const todayIso = () => new Date().toISOString().slice(0, 10);

/**
 * Sends a message or a call request to the owner's inbox through /api/contact.
 * Checked in the browser first (same rules as the server), shows a spinner while sending, and when
 * delivery fails it shows the email address so a visitor is never left without a way to reach out.
 */
export default function ContactForm() {
  const uid = useId();
  const id = (name: string) => `${uid}-${name}`;
  const openedAt = useRef(Date.now());
  const guess = useRef("");
  const trap = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState<ContactDraft>(() => makeDraft());
  if (!guess.current) guess.current = draft.country;
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const [fallback, setFallback] = useState(false);
  // Bumped on every error so the message shakes again even when the text is the same.
  const [errorKey, setErrorKey] = useState(0);

  const set = <K extends keyof ContactDraft>(key: K, value: ContactDraft[K]) => setDraft((d) => ({ ...d, [key]: value }));
  const call = draft.kind === "call";
  const needsPhone = draft.channel !== "email";

  function fail(message: string, showEmail = false) {
    setError(message);
    setFallback(showEmail);
    setErrorKey((k) => k + 1);
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (status === "sending") return;
    const problem = validateDraft(draft);
    if (problem) return fail(problem);

    setError("");
    setFallback(false);
    setStatus("sending");
    const result = await sendContact(CONTACT_ENDPOINT, toPayload(draft, trap.current?.value ?? "", Date.now() - openedAt.current));
    if (result.ok) {
      setStatus("sent");
      return;
    }
    setStatus("idle");
    fail(result.message, result.fallback);
  }

  function again() {
    setDraft(makeDraft());
    setStatus("idle");
    setError("");
    setFallback(false);
    openedAt.current = Date.now();
  }

  if (status === "sent") {
    return (
      <div className="cform cform-done" role="status">
        <span className="cform-check" aria-hidden="true">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12.5l4.5 4.5L19 7.5" />
          </svg>
        </span>
        <h3>Message sent</h3>
        <p>
          It is in my inbox now, and a receipt is on its way to you. I reply within {profile.replyTime}.
        </p>
        <button type="button" className="btn" onClick={again}>
          Send another
        </button>
      </div>
    );
  }

  return (
    <form className="cform" onSubmit={onSubmit} noValidate aria-label="Contact form">
      <div className="seg cform-kind" role="group" aria-label="What would you like to do">
        {(["message", "call"] as ContactKind[]).map((k) => (
          <button key={k} type="button" aria-pressed={draft.kind === k} onClick={() => set("kind", k)}>
            {k === "message" ? "Send a message" : "Request a call"}
          </button>
        ))}
      </div>

      <div className="cform-row">
        <div className="field">
          <label htmlFor={id("name")}>Your name</label>
          <input id={id("name")} type="text" autoComplete="name" value={draft.name} onChange={(e) => set("name", e.target.value)} maxLength={80} />
        </div>
        <div className="field">
          <label htmlFor={id("email")}>Email</label>
          <input id={id("email")} type="email" autoComplete="email" inputMode="email" value={draft.email} onChange={(e) => set("email", e.target.value)} maxLength={254} />
        </div>
      </div>

      <fieldset className="field cform-topics">
        <legend>Best way to reach me</legend>
        <div className="seg">
          {CONTACT_CHANNELS.map((c) => (
            <button key={c} type="button" aria-pressed={draft.channel === c} onClick={() => set("channel", c)}>
              {CHANNEL_LABEL[c]}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="field">
        <label htmlFor={id("phone")}>{needsPhone ? "Phone number" : "Phone number (optional)"}</label>
        <div className="cform-phone">
          <CountryPicker value={draft.country} onChange={(iso) => set("country", iso)} guess={guess.current} />
          <input
            id={id("phone")}
            type="tel"
            inputMode="tel"
            autoComplete="tel-national"
            value={draft.phone}
            onChange={(e) => set("phone", e.target.value)}
            placeholder="98765 43210"
            maxLength={20}
          />
        </div>
        <small className="cform-hint">Only used to reach you about this message. Never shared.</small>
      </div>

      {call && (
        <div className="cform-row cform-row-3">
          <div className="field">
            <label htmlFor={id("date")}>Preferred date</label>
            <input id={id("date")} type="date" min={todayIso()} value={draft.date} onChange={(e) => set("date", e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor={id("time")}>Time</label>
            <input id={id("time")} type="time" value={draft.time} onChange={(e) => set("time", e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor={id("zone")}>Your time zone</label>
            <select id={id("zone")} value={draft.timeZone} onChange={(e) => set("timeZone", e.target.value)}>
              {CALL_ZONES.map((z) => (
                <option key={z}>{z}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      <fieldset className="field cform-topics">
        <legend>About</legend>
        <div className="seg">
          {CONTACT_TOPICS.map((t) => (
            <button key={t} type="button" aria-pressed={draft.topic === t} onClick={() => set("topic", t)}>
              {t}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="field">
        <label htmlFor={id("message")}>{call ? "What would you like to discuss?" : "Message"}</label>
        <textarea
          id={id("message")}
          rows={4}
          value={draft.message}
          onChange={(e) => set("message", e.target.value)}
          placeholder={call ? "The role, the team, and anything I should read before we talk" : "Role, team, and anything I should read first"}
          maxLength={2000}
        />
      </div>

      {/* Honeypot: invisible and unreachable for people, tempting for bots. */}
      <div className="cform-trap" aria-hidden="true">
        <label>
          Website
          <input ref={trap} type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      {error && (
        <p key={errorKey} className="cform-error" role="alert">
          {error}
          {fallback && (
            <>
              {" "}
              <Cta kind="mail" email={profile.email} variant="link">
                Email me instead
              </Cta>
            </>
          )}
        </p>
      )}

      <button type="submit" className="btn btn-primary cform-send" disabled={status === "sending"}>
        {status === "sending" && <span className="spin" aria-hidden="true" />}
        {status === "sending" ? "Sending…" : call ? "Request the call" : "Send message"}
      </button>
      <p className="cform-note">No account needed. Your email is only used to reply.</p>
    </form>
  );
}
